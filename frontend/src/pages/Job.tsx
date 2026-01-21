import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import "../styles/Job.css";

type JobSkill = {
  job_skill_id: number;
  skill_name: string;
  proficiency_level: number | null;
  skill_category: string | null;
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
};

export default function Job() {
  const { id } = useParams();
  const jobId = Number(id);
  const navigate = useNavigate();

  const [data, setData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (Number.isNaN(jobId)) {
      setError("Invalid job ID");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:5050/api/jobs/${jobId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load job");
        }
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) return <div className="jobState">Loading…</div>;
  if (error) return <div className="jobState error">{error}</div>;
  if (!data) return null;

  const { job, skills } = data;

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
                {job.job_status && <span className="jobPill">{job.job_status}</span>}
              </div>

              <p className="jobRole">
                {job.department || "—"}
                {job.job_location ? ` • ${job.job_location}` : ""}
                {job.work_status ? ` • ${job.work_status}` : ""}
              </p>
            </div>

            <div className="jobActionsRow">
              <button className="jobActionBtn" type="button">
                Edit
              </button>
              <button className="jobActionBtn danger" type="button">
                Delete
              </button>
            </div>
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
                      <span className="jobSkillLevel">Lvl {s.proficiency_level}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recommenders placeholder */}
          <section className="jobCard">
            <h2 className="jobSectionTitle">Recommended Candidates</h2>
            <p className="jobMuted">
              Coming soon: best matches, skill-gap notes, and ranked recommendations.
            </p>

            <div className="jobPlaceholderRow">
              <div className="jobPlaceholderCard" />
              <div className="jobPlaceholderCard" />
              <div className="jobPlaceholderCard" />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
