"""
recommend.py
------------
Run job -> candidate recommendations and print JSON to stdout.

Example:
  python recommend.py --excel_path "Dummy Data.xlsx" --job_id 201 --top_n 10
"""

import argparse
import json
import re
from datetime import datetime

import numpy as np
import pandas as pd


# ---------- helpers ----------
def extract_int(x):
    """Turns '1 (SQL)' -> 1. Returns <NA> if no number found."""
    if pd.isna(x):
        return pd.NA
    m = re.search(r"\d+", str(x))
    return int(m.group()) if m else pd.NA


def load_sheets(excel_path: str):
    xls = pd.ExcelFile(excel_path)

    job = pd.read_excel(xls, "Job Table")
    job_skill = pd.read_excel(xls, "Job_Skill Table")
    candidate = pd.read_excel(xls, "Candidate Table")
    candidate_skill = pd.read_excel(xls, "Candidate_Skill Table")
    skill = pd.read_excel(xls, "Skill Table")

    return job, job_skill, candidate, candidate_skill, skill



def clean_tables(job, job_skill, candidate, candidate_skill, skill):
    """
    Standardize key columns + numeric types; drop blank Excel rows.
    Adjust column names here if your tabs differ.
    """

    # ---- IDs (make sure columns exist) ----
    # Job
    job["job_id"] = pd.to_numeric(job["job_id"], errors="coerce").astype("Int64")

    # Skill
    skill["skill_id"] = pd.to_numeric(skill["skill_id"], errors="coerce").astype("Int64")

    # Candidate
    candidate["candidate_id"] = pd.to_numeric(candidate["candidate_id"], errors="coerce").astype("Int64")

    # Job_Skill
    job_skill["job_id"] = pd.to_numeric(job_skill["job_id"], errors="coerce").astype("Int64")
    # skill_id might be "1 (SQL)" so extract int
    job_skill["skill_id"] = job_skill["skill_id"].apply(extract_int).astype("Int64")
    job_skill["required_level"] = pd.to_numeric(job_skill["required_level"], errors="coerce")
    job_skill["importance_weight"] = pd.to_numeric(job_skill["importance_weight"], errors="coerce")

    # Candidate_Skill
    candidate_skill["candidate_id"] = pd.to_numeric(candidate_skill["candidate_id"], errors="coerce").astype("Int64")
    candidate_skill["skill_id"] = candidate_skill["skill_id"].apply(extract_int).astype("Int64")
    candidate_skill["proficiency_level"] = pd.to_numeric(candidate_skill["proficiency_level"], errors="coerce")

    # ---- Drop blank rows that cause {nan} set issues ----
    job = job.dropna(subset=["job_id"]).copy()
    skill = skill.dropna(subset=["skill_id"]).copy()
    candidate = candidate.dropna(subset=["candidate_id"]).copy()
    job_skill = job_skill.dropna(subset=["job_id", "skill_id"]).copy()
    candidate_skill = candidate_skill.dropna(subset=["candidate_id", "skill_id"]).copy()

    # ---- Optional: basic FK sanity (won't crash, but helps) ----
    # Keep only job_skill rows with known jobs/skills
    job_skill = job_skill[job_skill["job_id"].isin(job["job_id"])]
    job_skill = job_skill[job_skill["skill_id"].isin(skill["skill_id"])]

    # Keep only candidate_skill rows with known candidates/skills
    candidate_skill = candidate_skill[candidate_skill["candidate_id"].isin(candidate["candidate_id"])]
    candidate_skill = candidate_skill[candidate_skill["skill_id"].isin(skill["skill_id"])]

    return job, job_skill, candidate, candidate_skill, skill


# ---------- core recommender ----------
def recommend_candidates(job_id: int, top_n: int, job, job_skill, candidate, candidate_skill, skill):
    # ---- job requirements ----
    req = (
        job_skill[job_skill["job_id"] == job_id]
        .merge(skill[["skill_id", "skill_name"]], on="skill_id", how="left")
        [["job_id", "skill_id", "skill_name", "required_level", "importance_weight"]]
    )

    if req.empty:
        return {
            "job": {"job_id": int(job_id)},
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "error": f"No job_skill rows found for job_id={job_id}.",
            "recommendations": [],
        }

    # ---- candidate skills ----
    cand_sk = (
        candidate_skill.merge(skill[["skill_id", "skill_name"]], on="skill_id", how="left")
        [["candidate_id", "skill_id", "skill_name", "proficiency_level"]]
    )

    # ---- candidate x required skills ----
    merged = (
        candidate[["candidate_id", "current_role", "years_exp", "education_level_id"]]
        .merge(req, how="cross")
        .merge(
            cand_sk[["candidate_id", "skill_id", "proficiency_level"]],
            on=["candidate_id", "skill_id"],
            how="left",
        )
    )

    merged["proficiency_level"] = merged["proficiency_level"].fillna(0)
    merged["meets_required"] = merged["proficiency_level"] >= merged["required_level"]
    merged["gap"] = (merged["required_level"] - merged["proficiency_level"]).clip(lower=0)

    # scoring: ratio (cap at 1) * importance_weight
    merged["level_ratio"] = np.minimum(merged["proficiency_level"] / merged["required_level"], 1)
    merged["weighted_points"] = merged["level_ratio"] * merged["importance_weight"]

    scores = (
        merged.groupby(["candidate_id", "current_role", "years_exp", "education_level_id"], as_index=False)
        .agg(
            total_points=("weighted_points", "sum"),
            possible_points=("importance_weight", "sum"),
            skills_met=("meets_required", "sum"),
            skills_required=("skill_id", "count"),
            total_gap=("gap", "sum"),
        )
    )
    scores["match_score"] = scores["total_points"] / scores["possible_points"]

    # hard requirements + warnings
    job_row = job.loc[job["job_id"] == job_id]
    if job_row.empty:
        job_meta = {"job_id": int(job_id)}
        min_exp = 0
        edu_req = 0
    else:
        job_row = job_row.iloc[0]
        job_meta = job_row.to_dict()
        min_exp = job_row.get("min_years_experience", 0)
        edu_req = job_row.get("education_req", 0)

    scores["meets_exp_req"] = scores["years_exp"] >= min_exp
    scores["meets_edu_req"] = scores["education_level_id"] >= edu_req
    scores["eligible"] = scores["meets_exp_req"] & scores["meets_edu_req"]

    scores["warnings"] = ""
    scores.loc[~scores["meets_exp_req"], "warnings"] += "Below min years experience; "
    scores.loc[~scores["meets_edu_req"], "warnings"] += "Below education requirement; "
    scores["warnings"] = scores["warnings"].astype(str).str.strip()

    # sort: eligible first, then best score
    scores = scores.sort_values(["eligible", "match_score"], ascending=[False, False])

    # breakdown for top candidates
    breakdown = (
        merged[
            [
                "candidate_id",
                "skill_id",
                "skill_name",
                "required_level",
                "importance_weight",
                "proficiency_level",
                "meets_required",
                "gap",
                "weighted_points",
            ]
        ]
        .sort_values(["candidate_id", "importance_weight"], ascending=[True, False])
    )

    recs = []
    for rank, (_, row) in enumerate(scores.head(top_n).iterrows(), start=1):
        cid = int(row["candidate_id"])
        cand_breakdown = breakdown[breakdown["candidate_id"] == cid].to_dict(orient="records")

        recs.append(
            {
                "rank": rank,
                "candidate_id": cid,
                "current_role": row["current_role"],
                "match_score": float(row["match_score"]),
                "eligible": bool(row["eligible"]),
                "warnings": row["warnings"],
                "skills_met": int(row["skills_met"]),
                "skills_required": int(row["skills_required"]),
                "total_gap": float(row["total_gap"]),
                "breakdown": cand_breakdown,
            }
        )

    return {
        "job": {
            "job_id": int(job_meta.get("job_id", job_id)),
            "job_title": job_meta.get("job_title"),
            "department": job_meta.get("department"),
            "min_years_experience": float(job_meta.get("min_years_experience", 0) or 0),
            "education_req": job_meta.get("education_req"),
            "job_location": job_meta.get("job_location"),
            "work_status": job_meta.get("work_status"),
        },
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "recommendations": recs,
    }


# ---------- script entrypoint ----------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--excel_path", type=str, default="Dummy Data.xlsx", help="Path to Excel workbook")
    parser.add_argument("--job_id", type=int, required=True, help="Job ID to recommend candidates for")
    parser.add_argument("--top_n", type=int, default=10, help="How many candidates to return")
    args = parser.parse_args()

    job, job_skill, candidate, candidate_skill, skill = load_sheets(args.excel_path)
    job, job_skill, candidate, candidate_skill, skill = clean_tables(job, job_skill, candidate, candidate_skill, skill)

    results = recommend_candidates(
        job_id=args.job_id,
        top_n=args.top_n,
        job=job,
        job_skill=job_skill,
        candidate=candidate,
        candidate_skill=candidate_skill,
        skill=skill,
    )

    # IMPORTANT: stdout should be JSON only (backend will parse this)
    print(json.dumps(results, indent=2, default=str))


if __name__ == "__main__":
    main()
