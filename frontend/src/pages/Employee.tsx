import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import "../styles/Profile.css";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { isManager } from "../lib/auth";
import JobRecommendationCard from "../components/JobRecommendationCard";

type Skill = {
  candidate_skill_id: number;
  skill_name: string;
  proficiency_level: number | null;
  skill_category: string | null;
};

type ProfileData = {
  candidate: {
    candidate_id: number;
    name: string;
    position: string;
    email: string;
    phone_number: string;
    internal: boolean;
    application_date: string | null;
    pronouns: string | null;
  };
  internal: {
    currentrole: string | null;
    years_exp: number | null;
    availability_hours: number | null;
    start_date: string | null;
    department_name: string | null;
    location_name: string | null;
    education_level: string | null;
  } | null;
  skills: Skill[];
};

type JobRecommendation = {
  rank: number;
  job_id: number;
  job_title: string;
  department: string;
  match_score: number;
  eligible: boolean;
  warnings: string;
  skills_met: number;
  skills_required: number;
  total_gap: number;
  breakdown: any[];
};

export default function Employee() {
  const { id } = useParams();
  const candidateId = Number(id);
  const navigate = useNavigate();
  const canEdit = isManager();

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [jobRecs, setJobRecs] = useState<JobRecommendation[]>([]);
  const [loadingJobRecs, setLoadingJobRecs] = useState(false);
  const [jobRecsError, setJobRecsError] = useState("");
  const [showAllJobRecs, setShowAllJobRecs] = useState(false);

  // Fetch profile
  useEffect(() => {
    if (Number.isNaN(candidateId)) {
      setError("Invalid candidate ID");
      setLoading(false);
      return;
    }

    apiFetch(`/api/candidates/${candidateId}/profile`)
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return null;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load profile");
        }
        return res.json();
      })
      .then((json) => {
        if (json) setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [candidateId, navigate]);

  // Fetch job recommendations
  useEffect(() => {
    if (Number.isNaN(candidateId)) return;

    setLoadingJobRecs(true);
    apiFetch(`/api/candidates/${candidateId}/job-recommendations`)
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return null;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load recommendations");
        }
        return res.json();
      })
      .then((json) => {
        if (json?.recommendations) setJobRecs(json.recommendations);
      })
      .catch((e) => setJobRecsError(e.message))
      .finally(() => setLoadingJobRecs(false));
  }, [candidateId, navigate]);

  const toPhotoFile = (fullName: string) =>
    `${fullName.trim().toLowerCase().split(/\s+/).slice(0, 2).join("_")}.jpeg`;

  // ✅ DELETE HANDLER
  const handleDelete = async () => {
    const ok = window.confirm("Delete this employee? This can't be undone.");
    if (!ok) return;

    try {
      const res = await apiFetch(`/api/employees/${candidateId}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete employee");
      }

      navigate("/employees");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete employee");
    }
  };

  if (loading) return <div className="profileState">Loading…</div>;
  if (error) return <div className="profileState error">{error}</div>;
  if (!data) return null;

  const { candidate, internal, skills } = data;

  if (!candidate.internal) {
    return (
      <div className="profileState error">
        This record is an applicant. Go to{" "}
        <button
          className="profileBackLink"
          onClick={() => navigate(`/applicants/${candidateId}`)}
        >
          Applicant page
        </button>
        .
      </div>
    );
  }

  return (
    <>
      <AdminNavbar />

      <main className="profilePage">
        <div className="profileShell">
          {/* Top header row */}
          <div className="profileHeaderRow">
            <div className="profileTitleBlock">
              <button
                className="profileBackLink"
                onClick={() => navigate("/employees")}
                type="button"
              >
                ← Back to Employees
              </button>
              <div className="profileTitleRow">
                <h1 className="profileTitle">{candidate.name}</h1>
                {candidate.internal && (
                  <span className="profilePill">Internal</span>
                )}
              </div>

              {/* bigger role */}
              <p className="profileRole">{candidate.position}</p>
            </div>

            {canEdit && (
              <div className="profileActionsRow">
                <button
                  className="profileActionBtn"
                  type="button"
                  onClick={() => navigate(`/employees/${candidateId}/edit`)}
                >
                  Edit
                </button>

                <button
                  className="profileActionBtn danger"
                  type="button"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Main card */}
          <section className="profileCard">
            <div className="profileTopGrid">
              <div className="profileLeftCol">
                <div className="profileAvatar">
                  <img
                    src={`/images/profiles/${toPhotoFile(candidate.name)}`}
                    alt={`${candidate.name} profile`}
                    className="profileAvatarImg"
                  />
                </div>
              </div>

              <div className="profileRightCol">
                {/* General info */}
                <div className="profileInfoGrid">
                  <div className="profileInfoItem">
                    <div className="profileLabel">Pronouns</div>
                    <div className="profileValue">
                      {candidate.pronouns || "—"}
                    </div>
                  </div>

                  <div className="profileInfoItem">
                    <div className="profileLabel">Applied</div>
                    <div className="profileValue">
                      {candidate.application_date
                        ? new Date(
                            candidate.application_date,
                          ).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>

                  <div className="profileInfoItem">
                    <div className="profileLabel">Email</div>
                    <div className="profileValue">{candidate.email || "—"}</div>
                  </div>

                  <div className="profileInfoItem">
                    <div className="profileLabel">Phone</div>
                    <div className="profileValue">
                      {candidate.phone_number || "—"}
                    </div>
                  </div>
                </div>

                {/* Internal info */}
                {internal && (
                  <div className="profileInternalBlock">
                    <div className="profileInfoGrid profileInternalGrid">
                      <div className="profileInfoItem">
                        <div className="profileLabel">Role</div>
                        <div className="profileValue">
                          {internal.currentrole || "—"}
                        </div>
                      </div>

                      <div className="profileInfoItem">
                        <div className="profileLabel">Department</div>
                        <div className="profileValue">
                          {internal.department_name || "—"}
                        </div>
                      </div>

                      <div className="profileInfoItem">
                        <div className="profileLabel">Location</div>
                        <div className="profileValue">
                          {internal.location_name || "—"}
                        </div>
                      </div>

                      <div className="profileInfoItem">
                        <div className="profileLabel">Education</div>
                        <div className="profileValue">
                          {internal.education_level || "—"}
                        </div>
                      </div>

                      <div className="profileInfoItem">
                        <div className="profileLabel">Experience</div>
                        <div className="profileValue">
                          {internal.years_exp != null
                            ? `${internal.years_exp} yrs`
                            : "—"}
                        </div>
                      </div>

                      <div className="profileInfoItem">
                        <div className="profileLabel">Availability</div>
                        <div className="profileValue">
                          {internal.availability_hours != null
                            ? `${internal.availability_hours} hrs`
                            : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="profileDivider" />

            <div className="profileSectionHeader">
              <h2 className="profileSectionTitle">Skills</h2>
              <div className="profileSectionMeta">{skills.length} total</div>
            </div>

            {skills.length === 0 ? (
              <div className="profileMuted">No skills added yet.</div>
            ) : (
              <div className="profileSkillsWrap">
                {skills.map((s) => (
                  <div key={s.candidate_skill_id} className="profileSkillPill">
                    <span className="profileSkillName">{s.skill_name}</span>
                    {s.proficiency_level != null && (
                      <span className="profileSkillLevel">
                        Lvl {s.proficiency_level}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Job Recommendations */}
          <section className="profileCard">
            <div className="profileSectionHeader">
              <h2 className="profileSectionTitle">Recommended Fits</h2>
              {jobRecs.length > 0 && (
                <div className="profileSectionMeta">
                  {jobRecs.length} matches
                </div>
              )}
            </div>

            {loadingJobRecs && (
              <p className="profileMuted">Loading recommendations...</p>
            )}

            {!loadingJobRecs && jobRecsError && (
              <p className="profileMuted">{jobRecsError}</p>
            )}

            {!loadingJobRecs && !jobRecsError && jobRecs.length === 0 && (
              <p className="profileMuted">No job recommendations available.</p>
            )}

            {!loadingJobRecs && !jobRecsError && jobRecs.length > 0 && (
              <>
                <div className="jobRecommendationsGrid">
                  {(showAllJobRecs ? jobRecs : jobRecs.slice(0, 3)).map(
                    (rec) => (
                      <JobRecommendationCard
                        key={rec.job_id}
                        recommendation={rec}
                        candidateId={candidateId}
                      />
                    ),
                  )}
                </div>

                {jobRecs.length > 3 && (
                  <button
                    className="jobRecsShowMore"
                    onClick={() => setShowAllJobRecs(!showAllJobRecs)}
                  >
                    {showAllJobRecs
                      ? "Show Less"
                      : `Show ${jobRecs.length - 3} More`}
                  </button>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
