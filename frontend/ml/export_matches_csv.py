import pandas as pd
from recommend import (
    load_sheets,
    clean_tables,
    recommend_candidates
)

EXCEL_PATH = "../../data/Dummy_Data.xlsx"
OUTPUT_CSV = "job_candidate_matches.csv"
TOP_N = 200   # grab more than you need for Tableau

def main():
    job, job_skill, candidate, candidate_skill, skill = load_sheets(EXCEL_PATH)
    job, job_skill, candidate, candidate_skill, skill = clean_tables(
        job, job_skill, candidate, candidate_skill, skill
    )

    all_rows = []

    for job_id in job["job_id"].dropna().unique():
        results = recommend_candidates(
            job_id=int(job_id),
            top_n=TOP_N,
            job=job,
            job_skill=job_skill,
            candidate=candidate,
            candidate_skill=candidate_skill,
            skill=skill,
        )

        job_meta = results["job"]

        for rec in results["recommendations"]:
            all_rows.append({
                "job_id": job_meta["job_id"],
                "job_title": job_meta.get("job_title"),
                "department": job_meta.get("department"),
                "candidate_id": rec["candidate_id"],
                "current_role": rec["current_role"],
                "match_score": rec["match_score"],
                "eligible": rec["eligible"],
                "skills_met": rec["skills_met"],
                "skills_required": rec["skills_required"],
                "total_gap": rec["total_gap"],
                "warnings": rec.get("warnings", "")
            })

    df = pd.DataFrame(all_rows)
    df.to_csv(OUTPUT_CSV, index=False)

    print(f"✅ CSV saved: {OUTPUT_CSV}")
    print(df.head())

if __name__ == "__main__":
    main()
