"""
recommend.py
------------
Run job <-> candidate recommendations with ML-enhanced scoring.

- Uses historical hiring outcomes to improve recommendations
- Combines skill matching (70%) with ML predictions (30%)
- Always prints JSON to stdout (for backend / LLM)
- Optionally saves CSV output (for Tableau / analytics)

Examples:
  python recommend.py --excel_path "Dummy Data.xlsx" --job_id 201
  python recommend.py --excel_path "Dummy Data.xlsx" --candidate_id 301
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime

import numpy as np
import pandas as pd

# ML imports
try:
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

# Database imports
try:
    import psycopg2
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

# Database connection string (can be overridden via environment variable)
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:izzy1213@localhost:5432/AISHRComp"
)

# Weighting for hybrid scoring (skill_match vs ml_prediction)
# With limited training data, we weight skill matching higher
SKILL_WEIGHT = 0.7
ML_WEIGHT = 0.3


# ---------- ML Training ----------
def load_training_data():
    """Load historical hiring outcomes from the database."""
    if not PSYCOPG2_AVAILABLE:
        return pd.DataFrame()

    try:
        conn = psycopg2.connect(DATABASE_URL)
        query = """
            SELECT
                ca.candidate_id,
                ca.job_id,
                ca.outcome,
                c.years_exp,
                c.education_level_id
            FROM candidate_application ca
            JOIN candidate c ON ca.candidate_id = c.candidate_id
        """
        df = pd.read_sql(query, conn)
        conn.close()
        return df
    except Exception as e:
        print(f"Warning: Could not load training data: {e}", file=sys.stderr)
        return pd.DataFrame()


def compute_features_for_pair(candidate_id, job_id, job_skill, candidate_skill, candidate):
    """Compute features for a candidate-job pair for ML scoring."""
    # Get job requirements
    job_reqs = job_skill[job_skill["job_id"] == job_id]
    if job_reqs.empty:
        return None

    # Get candidate skills
    cand_skills = candidate_skill[candidate_skill["candidate_id"] == candidate_id]

    # Merge to compute skill match features
    merged = job_reqs.merge(
        cand_skills[["skill_id", "proficiency_level"]],
        on="skill_id",
        how="left"
    )
    merged["proficiency_level"] = merged["proficiency_level"].fillna(0)
    merged["meets_required"] = merged["proficiency_level"] >= merged["required_level"]
    merged["gap"] = (merged["required_level"] - merged["proficiency_level"]).clip(lower=0)
    merged["level_ratio"] = np.minimum(
        merged["proficiency_level"] / merged["required_level"].replace(0, 1), 1
    )
    merged["weighted_points"] = merged["level_ratio"] * merged["importance_weight"]

    # Aggregate features
    total_points = merged["weighted_points"].sum()
    possible_points = merged["importance_weight"].sum()
    match_score = total_points / possible_points if possible_points > 0 else 0
    skills_met = merged["meets_required"].sum()
    skills_required = len(merged)
    total_gap = merged["gap"].sum()
    pct_skills_met = skills_met / skills_required if skills_required > 0 else 0

    # Get candidate info
    cand_row = candidate[candidate["candidate_id"] == candidate_id]
    years_exp = cand_row["years_exp"].iloc[0] if not cand_row.empty else 0
    edu_level = cand_row["education_level_id"].iloc[0] if not cand_row.empty else 0

    return {
        "match_score": match_score,
        "pct_skills_met": pct_skills_met,
        "total_gap": total_gap,
        "years_exp": years_exp or 0,
        "education_level_id": edu_level or 0,
    }


def train_ml_model(job_skill, candidate_skill, candidate):
    """Train logistic regression on historical hiring outcomes."""
    if not SKLEARN_AVAILABLE:
        return None, None

    training_data = load_training_data()
    if training_data.empty or len(training_data) < 5:
        return None, None

    # Build feature matrix
    X_rows = []
    y = []

    for _, row in training_data.iterrows():
        features = compute_features_for_pair(
            row["candidate_id"], row["job_id"],
            job_skill, candidate_skill, candidate
        )
        if features is not None:
            X_rows.append([
                features["match_score"],
                features["pct_skills_met"],
                features["total_gap"],
                features["years_exp"],
                features["education_level_id"],
            ])
            # outcome 3 = hired (positive), 0 = rejected (negative)
            y.append(1 if row["outcome"] == 3 else 0)

    if len(X_rows) < 5:
        return None, None

    X = np.array(X_rows)
    y = np.array(y)

    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train logistic regression
    model = LogisticRegression(random_state=42, max_iter=1000)
    model.fit(X_scaled, y)

    return model, scaler


def predict_hire_probability(model, scaler, features):
    """Predict probability of hiring for a candidate-job pair."""
    if model is None or scaler is None or features is None:
        return 0.5  # neutral default

    X = np.array([[
        features["match_score"],
        features["pct_skills_met"],
        features["total_gap"],
        features["years_exp"],
        features["education_level_id"],
    ]])
    X_scaled = scaler.transform(X)

    # Return probability of class 1 (hired)
    proba = model.predict_proba(X_scaled)[0][1]
    return proba


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
    """Standardize key columns + numeric types; drop blank Excel rows."""

    job["job_id"] = pd.to_numeric(job["job_id"], errors="coerce").astype("Int64")
    skill["skill_id"] = pd.to_numeric(skill["skill_id"], errors="coerce").astype("Int64")
    candidate["candidate_id"] = pd.to_numeric(candidate["candidate_id"], errors="coerce").astype("Int64")

    job_skill["job_id"] = pd.to_numeric(job_skill["job_id"], errors="coerce").astype("Int64")
    job_skill["skill_id"] = job_skill["skill_id"].apply(extract_int).astype("Int64")
    job_skill["required_level"] = pd.to_numeric(job_skill["required_level"], errors="coerce")
    job_skill["importance_weight"] = pd.to_numeric(job_skill["importance_weight"], errors="coerce")

    candidate_skill["candidate_id"] = pd.to_numeric(candidate_skill["candidate_id"], errors="coerce").astype("Int64")
    candidate_skill["skill_id"] = candidate_skill["skill_id"].apply(extract_int).astype("Int64")
    candidate_skill["proficiency_level"] = pd.to_numeric(candidate_skill["proficiency_level"], errors="coerce")

    job = job.dropna(subset=["job_id"])
    skill = skill.dropna(subset=["skill_id"])
    candidate = candidate.dropna(subset=["candidate_id"])
    job_skill = job_skill.dropna(subset=["job_id", "skill_id"])
    candidate_skill = candidate_skill.dropna(subset=["candidate_id", "skill_id"])

    job_skill = job_skill[job_skill["job_id"].isin(job["job_id"])]
    job_skill = job_skill[job_skill["skill_id"].isin(skill["skill_id"])]
    candidate_skill = candidate_skill[candidate_skill["candidate_id"].isin(candidate["candidate_id"])]
    candidate_skill = candidate_skill[candidate_skill["skill_id"].isin(skill["skill_id"])]

    return job, job_skill, candidate, candidate_skill, skill


# ---------- job -> candidate ----------
def recommend_candidates(job_id: int, top_n: int,
                         job, job_skill, candidate, candidate_skill, skill,
                         ml_model=None, ml_scaler=None):

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

    cand_sk = (
        candidate_skill.merge(skill[["skill_id", "skill_name"]], on="skill_id", how="left")
        [["candidate_id", "skill_id", "skill_name", "proficiency_level"]]
    )

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
    merged["level_ratio"] = np.minimum(merged["proficiency_level"] / merged["required_level"], 1)
    merged["weighted_points"] = merged["level_ratio"] * merged["importance_weight"]

    scores = (
        merged.groupby(
            ["candidate_id", "current_role", "years_exp", "education_level_id"],
            as_index=False,
        )
        .agg(
            total_points=("weighted_points", "sum"),
            possible_points=("importance_weight", "sum"),
            skills_met=("meets_required", "sum"),
            skills_required=("skill_id", "count"),
            total_gap=("gap", "sum"),
        )
    )

    scores["match_score"] = scores["total_points"] / scores["possible_points"]

    # --- ML-enhanced scoring ---
    ml_predictions = {}
    ml_enabled = ml_model is not None and ml_scaler is not None

    if ml_enabled:
        for cid in scores["candidate_id"].unique():
            features = compute_features_for_pair(
                cid, job_id, job_skill, candidate_skill, candidate
            )
            ml_predictions[cid] = predict_hire_probability(ml_model, ml_scaler, features)

    # Compute hybrid score: skill_match * SKILL_WEIGHT + ml_prediction * ML_WEIGHT
    def compute_hybrid_score(row):
        skill_score = row["match_score"]
        if ml_enabled and row["candidate_id"] in ml_predictions:
            ml_score = ml_predictions[row["candidate_id"]]
            return (SKILL_WEIGHT * skill_score) + (ML_WEIGHT * ml_score)
        return skill_score

    scores["hybrid_score"] = scores.apply(compute_hybrid_score, axis=1)
    scores["ml_prediction"] = scores["candidate_id"].map(ml_predictions) if ml_enabled else None

    job_row = job[job["job_id"] == job_id]
    job_meta = job_row.iloc[0].to_dict() if not job_row.empty else {"job_id": job_id}

    min_exp = job_meta.get("min_years_experience", 0) or 0
    edu_req = job_meta.get("education_req", 0) or 0

    scores["meets_exp_req"] = scores["years_exp"] >= min_exp
    scores["meets_edu_req"] = scores["education_level_id"] >= edu_req
    scores["eligible"] = scores["meets_exp_req"] & scores["meets_edu_req"]

    scores["warnings"] = ""
    scores.loc[~scores["meets_exp_req"], "warnings"] += "Below min years experience; "
    scores.loc[~scores["meets_edu_req"], "warnings"] += "Below education requirement; "
    scores["warnings"] = scores["warnings"].str.strip()

    # Sort by hybrid score (which incorporates ML predictions)
    scores = scores.sort_values(["eligible", "hybrid_score"], ascending=[False, False])

    breakdown = merged[[
        "candidate_id", "skill_id", "skill_name",
        "required_level", "importance_weight",
        "proficiency_level", "meets_required",
        "gap", "weighted_points",
    ]]

    recs = []
    for rank, (_, row) in enumerate(scores.head(top_n).iterrows(), start=1):
        cid = int(row["candidate_id"])
        rec = {
            "rank": rank,
            "candidate_id": cid,
            "current_role": row["current_role"],
            "match_score": float(row["hybrid_score"]),  # Use hybrid score as the main score
            "skill_match_score": float(row["match_score"]),  # Original skill-only score
            "eligible": bool(row["eligible"]),
            "warnings": row["warnings"],
            "skills_met": int(row["skills_met"]),
            "skills_required": int(row["skills_required"]),
            "total_gap": float(row["total_gap"]),
            "breakdown": breakdown[breakdown["candidate_id"] == cid].to_dict("records"),
        }
        # Add ML prediction if available
        if ml_enabled and row["ml_prediction"] is not None:
            rec["ml_hire_probability"] = float(row["ml_prediction"])
        recs.append(rec)

    return {
        "job": {
            "job_id": int(job_meta.get("job_id")),
            "job_title": job_meta.get("job_title"),
            "department": job_meta.get("department"),
            "min_years_experience": min_exp,
            "education_req": edu_req,
            "job_location": job_meta.get("job_location"),
            "work_status": job_meta.get("work_status"),
        },
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "ml_enabled": ml_enabled,
        "recommendations": recs,
    }


# ---------- candidate -> job ----------
def recommend_jobs(candidate_id: int, top_n: int,
                   job, job_skill, candidate, candidate_skill, skill):

    cand_sk = (
        candidate_skill[candidate_skill["candidate_id"] == candidate_id]
        .merge(skill[["skill_id", "skill_name"]], on="skill_id", how="left")
        [["skill_id", "skill_name", "proficiency_level"]]
    )

    if cand_sk.empty:
        return {
            "candidate": {"candidate_id": int(candidate_id)},
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "error": f"No candidate_skill rows found for candidate_id={candidate_id}.",
            "recommendations": [],
        }

    req = (
        job_skill.merge(skill[["skill_id", "skill_name"]], on="skill_id", how="left")
        [["job_id", "skill_id", "skill_name", "required_level", "importance_weight"]]
    )

    merged = (
        job.merge(req, on="job_id", how="left")
        .merge(cand_sk[["skill_id", "proficiency_level"]], on="skill_id", how="left")
    )

    merged["proficiency_level"] = merged["proficiency_level"].fillna(0)
    merged["meets_required"] = merged["proficiency_level"] >= merged["required_level"]
    merged["gap"] = (merged["required_level"] - merged["proficiency_level"]).clip(lower=0)
    merged["level_ratio"] = np.minimum(merged["proficiency_level"] / merged["required_level"], 1)
    merged["weighted_points"] = merged["level_ratio"] * merged["importance_weight"]

    scores = (
        merged.groupby(
            ["job_id", "job_title", "department",
             "min_years_experience", "education_req",
             "job_location", "work_status"],
            as_index=False
        )
        .agg(
            total_points=("weighted_points", "sum"),
            possible_points=("importance_weight", "sum"),
            skills_met=("meets_required", "sum"),
            skills_required=("skill_id", "count"),
            total_gap=("gap", "sum"),
        )
    )

    scores["match_score"] = scores["total_points"] / scores["possible_points"]

    cand_row = candidate[candidate["candidate_id"] == candidate_id].iloc[0]
    years_exp = cand_row.get("years_exp", 0) or 0
    edu_level = cand_row.get("education_level_id", 0) or 0

    scores["meets_exp_req"] = years_exp >= scores["min_years_experience"]
    scores["meets_edu_req"] = edu_level >= scores["education_req"]
    scores["eligible"] = scores["meets_exp_req"] & scores["meets_edu_req"]

    scores["warnings"] = ""
    scores.loc[~scores["meets_exp_req"], "warnings"] += "Below min years experience; "
    scores.loc[~scores["meets_edu_req"], "warnings"] += "Below education requirement; "
    scores["warnings"] = scores["warnings"].str.strip()

    scores = scores.sort_values(["eligible", "match_score"], ascending=[False, False])

    recs = []
    for rank, (_, row) in enumerate(scores.head(top_n).iterrows(), start=1):
        jid = int(row["job_id"])
        recs.append({
            "rank": rank,
            "job_id": jid,
            "job_title": row["job_title"],
            "department": row["department"],
            "match_score": float(row["match_score"]),
            "eligible": bool(row["eligible"]),
            "warnings": row["warnings"],
            "skills_met": int(row["skills_met"]),
            "skills_required": int(row["skills_required"]),
            "total_gap": float(row["total_gap"]),
            "breakdown": merged[merged["job_id"] == jid][[
                "skill_id", "skill_name",
                "required_level", "importance_weight",
                "proficiency_level", "meets_required",
                "gap", "weighted_points"
            ]].to_dict("records"),
        })

    return {
        "candidate": {
            "candidate_id": int(candidate_id),
            "current_role": cand_row.get("current_role"),
            "years_exp": years_exp,
            "education_level_id": edu_level,
        },
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "recommendations": recs,
    }


# ---------- CSV helper (job -> candidate only) ----------
def recommendations_to_dataframe(results: dict) -> pd.DataFrame:
    rows = []
    job = results.get("job", {})

    for rec in results.get("recommendations", []):
        rows.append({
            "job_id": job.get("job_id"),
            "job_title": job.get("job_title"),
            "candidate_id": rec["candidate_id"],
            "current_role": rec["current_role"],
            "rank": rec["rank"],
            "match_score": rec["match_score"],
            "eligible": rec["eligible"],
            "skills_met": rec["skills_met"],
            "skills_required": rec["skills_required"],
            "total_gap": rec["total_gap"],
            "warnings": rec["warnings"],
        })

    return pd.DataFrame(rows)


# ---------- entrypoint ----------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--excel_path", type=str, default="../data/Dummy_Data.xlsx")
    parser.add_argument("--job_id", type=int)
    parser.add_argument("--candidate_id", type=int)
    parser.add_argument("--top_n", type=int, default=10)
    parser.add_argument("--save_csv", action="store_true")
    parser.add_argument("--csv_path", type=str, default=None)
    parser.add_argument("--no_ml", action="store_true", help="Disable ML-enhanced scoring")

    args = parser.parse_args()

    if not args.job_id and not args.candidate_id:
        parser.error("You must provide either --job_id or --candidate_id")

    if args.job_id and args.candidate_id:
        parser.error("Provide only one of --job_id or --candidate_id")

    job, job_skill, candidate, candidate_skill, skill = load_sheets(args.excel_path)
    job, job_skill, candidate, candidate_skill, skill = clean_tables(
        job, job_skill, candidate, candidate_skill, skill
    )

    # Train ML model (if not disabled and dependencies are available)
    ml_model, ml_scaler = None, None
    if not args.no_ml and SKLEARN_AVAILABLE and PSYCOPG2_AVAILABLE:
        print("Training ML model from historical data...", file=sys.stderr)
        ml_model, ml_scaler = train_ml_model(job_skill, candidate_skill, candidate)
        if ml_model is not None:
            print("ML model trained successfully.", file=sys.stderr)
        else:
            print("ML model not trained (insufficient data or error).", file=sys.stderr)

    if args.job_id:
        results = recommend_candidates(
            args.job_id, args.top_n,
            job, job_skill, candidate, candidate_skill, skill,
            ml_model=ml_model, ml_scaler=ml_scaler
        )
    else:
        results = recommend_jobs(
            args.candidate_id, args.top_n,
            job, job_skill, candidate, candidate_skill, skill
        )

    if args.save_csv and args.job_id:
        df_out = recommendations_to_dataframe(results)
        path = args.csv_path or f"data/job_{args.job_id}_recommendations.csv"
        df_out.to_csv(path, index=False)

    print(json.dumps(results, indent=2, default=str))


if __name__ == "__main__":
    main()
