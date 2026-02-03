import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import CandidateCard from "../components/CandidateCard";
import "../styles/Job.css";
import { apiFetch } from "../lib/api";
import { isManager } from "../lib/auth";

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
};

type JobData = {
  job: {
    job_id: number;
    job_title: string;
    job_category: string | null;
    job_description: string | null;
    work_status: string | null;
    department: string | null;
    job_location: string | null;
    job_status: string | null;
    job_status_id: number | null;
  };
  skills: JobSkill[];
  recommendations?: Recommendation[];
};

export default function Job() {
  const { id } = useParams();
  const jobId = Number(id);
  const navigate = useNavigate();
  const canEdit = isManager();

  const [data, setData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    const ok = window.confirm("Delete this job? This can’t be undone.");
    if (!ok) return;

    try {
      const res = await apiFetch(`/api/jobs/${jobId}`, { method: "DELETE" });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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

  // Fetch job details
  useEffect(() => {
    if (Number.isNaN(jobId)) {
      setError("Invalid job ID");
      setLoading(false);
      return;
    }

    apiFetch(`/api/jobs/${jobId}`)
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return null;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load job");
        }

        return res.json();
      })
      .then((json) => {
        if (json) setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [jobId, navigate]);

  // Fetch recommendations separately
  useEffect(() => {
    if (Number.isNaN(jobId) || !data) return;

    setLoadingRecs(true);

    fetch(`http://localhost:5050/api/jobs/${jobId}/recommendations`)
      .then(async (res) => {
        if (!res.ok) {
          console.error("Failed to load recommendations");
          return null;
        }
        return res.json();
      })
      .then((mlData) => {
        if (mlData && mlData.recommendations) {
          setData((prev) =>
            prev ? { ...prev, recommendations: mlData.recommendations } : prev,
          );
        }
      })
      .catch((e) => console.error("Error loading recommendations:", e))
      .finally(() => setLoadingRecs(false));
  }, [jobId, data?.job.job_id]);

  if (loading) return <div className="jobState">Loading…</div>;
  if (error) return <div className="jobState error">{error}</div>;
  if (!data) return null;

  const { job, skills, recommendations } = data;

  return (
    <>
      <AdminNavbar />

      <main className="jobPage">
        <div className="jobShell">
          {/* Header row */}
          <div className="jobHeaderRow">
            <div className="jobTitleBlock">
              <button
                className="jobBackLink"
                onClick={() => navigate("/jobs")}
                type="button"
              >
                ← Back to Jobs
              </button>

              <div className="jobTitleRow">
                <h1 className="jobTitle">{job.job_title}</h1>
                {job.job_status && (
                  <span className="jobPill">{job.job_status}</span>
                )}
              </div>

              <p className="jobRole">
                {job.department || "—"}
                {job.job_location ? ` • ${job.job_location}` : ""}
                {job.work_status ? ` • ${job.work_status}` : ""}
              </p>
            </div>

            {canEdit && (
              <div className="jobActionsRow">
                <button
                  className="profileActionBtn"
                  type="button"
                  onClick={() => navigate(`/jobs/${jobId}/edit`)}
                >
                  Edit
                </button>

                <button
                  className="jobActionBtn danger"
                  type="button"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Main card */}
          <section className="jobCard">
            <div className="jobInfoGrid">
              <div className="jobInfoItem">
                <div className="jobLabel">Category</div>
                <div className="jobValue">{job.job_category || "—"}</div>
              </div>

              <div className="jobInfoItem">
                <div className="jobLabel">Status</div>
                <div className="jobValue">{job.job_status || "—"}</div>
              </div>

              <div className="jobInfoItem">
                <div className="jobLabel">Department</div>
                <div className="jobValue">{job.department || "—"}</div>
              </div>

              <div className="jobInfoItem">
                <div className="jobLabel">Location</div>
                <div className="jobValue">{job.job_location || "—"}</div>
              </div>
            </div>

            {job.job_description && (
              <>
                <div className="jobDivider" />
                <div className="jobDescription">
                  <div className="jobLabel">Description</div>
                  <p className="jobDescriptionText">{job.job_description}</p>
                </div>
              </>
            )}

            {/* Skills */}
            <div className="jobDivider" />

            <div className="jobSectionHeader">
              <h2 className="jobSectionTitle">Required Skills</h2>
              <div className="jobSectionMeta">{skills.length} total</div>
            </div>

            {skills.length === 0 ? (
              <div className="jobMuted">No required skills listed.</div>
            ) : (
              <div className="jobSkillsWrap">
                {skills.map((s) => (
                  <div key={s.job_skill_id} className="jobSkillPill">
                    <span className="jobSkillName">{s.skill_name}</span>
                    {s.proficiency_level != null && (
                      <span className="jobSkillLevel">
                        Lvl {s.proficiency_level}
                      </span>
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
              {recommendations && recommendations.length > 0 && (
                <div className="jobSectionMeta">
                  {recommendations.length} matches
                </div>
              )}
            </div>

            {loadingRecs ? (
              <p className="jobMuted">Loading recommendations...</p>
            ) : !recommendations || recommendations.length === 0 ? (
              <p className="jobMuted">
                No recommendations available for this position.
              </p>
            ) : (
              <div className="jobPlaceholderRow">
                {recommendations.map((rec) => (
                  <CandidateCard
                    key={rec.candidate_id}
                    recommendation={rec}
                    jobTitle={job.job_title}
                    jobId={jobId} // ← Add this
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
