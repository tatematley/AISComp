import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import CandidateCard from "../components/CandidateCard";
import "../styles/Job.css";
import { apiFetch } from "../lib/api";
import { isManager } from "../lib/auth";

/* ======================= Types ======================= */

type JobSkill = {
  job_skill_id: number;
  skill_name: string;
  proficiency_level: number | null;
  skill_category: string | null;
};

type SkillBreakdown = {
  skill_name: string;
  required_level: number;
  proficiency_level: number;
  meets_required: boolean;
  importance_weight: number;
  gap: number;
};

type Recommendation = {
  rank: number;
  candidate_id: number;
  current_role: string;
  match_score: number;
  eligible: boolean;
  skills_met: number;
  skills_required: number;
  total_gap: number;
  breakdown: SkillBreakdown[];
  internal: boolean;
};

type JobData = {
  job: {
    job_id: number;
    job_title: string;
    job_category: string | null;
    job_group: string | null;
    job_description: string | null;
    work_status: string | null;
    department: string | null;
    job_location: string | null;
    job_status: string | null;
    job_status_id: number | null;
    start_date?: string | null;
  };
  skills: JobSkill[];
  recommendations?: Recommendation[];
};

/* ======================= Component ======================= */

export default function Job() {
  const { id } = useParams();
  const jobId = Number(id);
  const navigate = useNavigate();
  const canEdit = isManager();

  const [data, setData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [error, setError] = useState("");

  const [recFilter, setRecFilter] = useState<"all" | "internal" | "external">(
    "all",
  );

  const job = data?.job;
  const skills = data?.skills ?? [];
  const recommendations = data?.recommendations ?? [];

  /* ======================= Delete ======================= */

  const handleDelete = async () => {
    if (!window.confirm("Delete this job? This can’t be undone.")) return;

    try {
      const res = await apiFetch(`/api/jobs/${jobId}`, { method: "DELETE" });

      if (res.status === 401) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete job");
      }

      navigate("/jobs");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete job");
    }
  };

  /* ======================= Fetch Job ======================= */

  useEffect(() => {
    if (Number.isNaN(jobId)) {
      setError("Invalid job ID");
      setLoading(false);
      return;
    }

    apiFetch(`/api/jobs/${jobId}`)
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.clear();
          navigate("/login");
          return null;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load job");
        }

        return res.json();
      })
      .then((json) => json && setData(json))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [jobId, navigate]);

  /* ======================= Fetch Recommendations ======================= */

  useEffect(() => {
    if (!job) return;

    setLoadingRecs(true);

    apiFetch(`/api/jobs/${jobId}/recommendations?origin=${recFilter}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((mlData) => {
        if (mlData?.recommendations) {
          setData((prev) =>
            prev ? { ...prev, recommendations: mlData.recommendations } : prev,
          );
        }
      })
      .catch((e) => console.error("Error loading recommendations:", e))
      .finally(() => setLoadingRecs(false));
  }, [jobId, job, recFilter]);

  /* ======================= Early exits ======================= */

  if (loading) return <div className="jobState">Loading…</div>;
  if (error) return <div className="jobState error">{error}</div>;
  if (!job) return null;

  /* ======================= Render ======================= */

  return (
  <>
    <AdminNavbar />

    <main className="jobPage">
      <div className="jobShell">
        {/* Header */}
        <div className="jobHeaderRow">
          <div className="jobTitleBlock">
            <button className="jobBackLink" onClick={() => navigate("/jobs")}>
              ← Back to Jobs
            </button>

            <div className="jobTitleRow">
              <h1 className="jobTitle">{job.job_title}</h1>
              {job.job_status && <span className="jobPill">{job.job_status}</span>}
            </div>

            <p className="jobRole">
              {job.department}
              {job.job_location && ` • ${job.job_location}`}
              {job.work_status && ` • ${job.work_status}`}
            </p>
          </div>

          {canEdit && (
            <div className="jobActionsRow">
              <button
                className="profileActionBtn"
                onClick={() => navigate(`/jobs/${jobId}/edit`)}
              >
                Edit
              </button>
              <button className="jobActionBtn danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          )}
        </div>

        {/* ✅ Main card: Job Details + Skills (Profile-style) */}
        <section className="jobCard jobMainCard">
          {/* Job Details header */}
          <div className="jobSectionHeader">
            <h2 className="jobSectionTitle">Job Details</h2>
          </div>

          {/* Details grid */}
          <div className="jobDetailsGrid">
            <div className="jobDetailItem">
              <div className="jobDetailLabel">Group</div>
              <div className="jobDetailValue">{job.job_group ?? "—"}</div>
            </div>

            <div className="jobDetailItem">
              <div className="jobDetailLabel">Category</div>
              <div className="jobDetailValue">{job.job_category ?? "—"}</div>
            </div>

            <div className="jobDetailItem">
              <div className="jobDetailLabel">Department</div>
              <div className="jobDetailValue">{job.department ?? "—"}</div>
            </div>

            <div className="jobDetailItem">
              <div className="jobDetailLabel">Location</div>
              <div className="jobDetailValue">{job.job_location ?? "—"}</div>
            </div>

            <div className="jobDetailItem">
              <div className="jobDetailLabel">Work Status</div>
              <div className="jobDetailValue">{job.work_status ?? "—"}</div>
            </div>

            {"start_date" in job && (
              <div className="jobDetailItem">
                <div className="jobDetailLabel">Start Date</div>
                <div className="jobDetailValue">
                  {job.start_date ? new Date(job.start_date).toLocaleDateString() : "—"}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="jobDescriptionBlock">
            <div className="jobDetailLabel">Description</div>
            <div className="jobDescriptionText">{job.job_description ?? "—"}</div>
          </div>

          {/* Divider like Profile */}
          <div className="jobDivider" />

          {/* Skills header */}
          <div className="jobSectionHeader">
            <h2 className="jobSectionTitle">Required Skills</h2>
            <div className="jobSectionMeta">{skills.length} total</div>
          </div>

          {/* Skills pills */}
          {skills.length === 0 ? (
            <div className="jobMuted">No skills added yet.</div>
          ) : (
            <div className="jobSkillsWrap">
              {skills.map((s) => (
                <div key={s.job_skill_id} className="jobSkillPill">
                  <span className="jobSkillName">{s.skill_name}</span>
                  {s.proficiency_level != null && (
                    <span className="jobSkillLevel">Lvl {s.proficiency_level}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recommended Candidates */}
        <section className="jobCard">
          <div className="jobSectionHeader">
            <h2 className="jobSectionTitle">Recommended Candidates</h2>
            <div className="jobSectionMeta">{recommendations.length} matches</div>
          </div>

          <div className="applicantSegmented">
            {["all", "internal", "external"].map((f) => (
              <button
                key={f}
                className={`segment ${recFilter === f ? "active" : ""}`}
                onClick={() => setRecFilter(f as "all" | "internal" | "external")}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {loadingRecs ? (
            <div className="jobPlaceholderRow">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="candidateSkeleton" />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <p className="jobMuted">No matching candidates.</p>
          ) : (
            <div className="jobPlaceholderRow">
              {recommendations.map((rec) => (
                <CandidateCard
                  key={rec.candidate_id}
                  recommendation={rec}
                  jobTitle={job.job_title}
                  jobId={jobId}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  </>
);
}