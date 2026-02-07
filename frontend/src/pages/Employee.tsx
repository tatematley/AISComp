import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import "../styles/Profile.css";
import { apiFetch } from "../lib/api";
import { isManager } from "../lib/auth";

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
    candidate_status?: {
      candidate_status_description: string | null;
    } | null;
  };
  internal: {
    currentrole: string | null;
    years_exp: number | null;
    availability_hours: number | null;
    start_date: string | null;
    department_name: string | null;
    location_name: string | null;
    education_level: string | null;
    candidate_status_description?: string | null;
  } | null;
  skills: Skill[];
};

export default function Employee() {
  const { id } = useParams();
  const candidateId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const canEdit = isManager();

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const toPhotoFile = (fullName: string) =>
    `${fullName
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .slice(0, 2)
      .join("_")}.jpeg`;

  // ✅ DELETE HANDLER (added)
  const handleDelete = async () => {
    const ok = window.confirm("Delete this employee? This can’t be undone.");
    if (!ok) return;

    try {
      const res = await apiFetch(`/api/employees/${candidateId}`, { method: "DELETE" });
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

      navigate(from ?? "/employees");
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
          onClick={() => navigate(`/applicants/${candidateId}`, { state: location.state })}
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
                onClick={() => navigate(from ?? "/employees")}
                type="button"
              >
                ← Back to Employees
              </button>
              <div className="profileTitleRow">
                <h1 className="profileTitle">{candidate.name}</h1>
                {candidate.internal && <span className="profilePill">Internal</span>}
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
                    <div className="profileValue">{candidate.pronouns || "—"}</div>
                  </div>

                  <div className="profileInfoItem">
                    <div className="profileLabel">Applied</div>
                    <div className="profileValue">
                      {candidate.application_date
                        ? new Date(candidate.application_date).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>

                  <div className="profileInfoItem">
                    <div className="profileLabel">Email</div>
                    <div className="profileValue">{candidate.email || "—"}</div>
                  </div>

                  <div className="profileInfoItem">
                    <div className="profileLabel">Status</div>
                    <div className="profileValue">{internal?.candidate_status_description || "—"}</div>
                  </div>

                  <div className="profileInfoItem">
                    <div className="profileLabel">Phone</div>
                    <div className="profileValue">{candidate.phone_number || "—"}</div>
                  </div>
                </div>

                {/* Internal info */}
                {internal && (
                  <div className="profileInternalBlock">
                    <div className="profileInfoGrid profileInternalGrid">
                      <div className="profileInfoItem">
                        <div className="profileLabel">Role</div>
                        <div className="profileValue">{internal.currentrole || "—"}</div>
                      </div>

                      <div className="profileInfoItem">
                        <div className="profileLabel">Department</div>
                        <div className="profileValue">{internal.department_name || "—"}</div>
                      </div>

                      <div className="profileInfoItem">
                        <div className="profileLabel">Location</div>
                        <div className="profileValue">{internal.location_name || "—"}</div>
                      </div>

                      <div className="profileInfoItem">
                        <div className="profileLabel">Education</div>
                        <div className="profileValue">{internal.education_level || "—"}</div>
                      </div>

                      <div className="profileInfoItem">
                        <div className="profileLabel">Experience</div>
                        <div className="profileValue">
                          {internal.years_exp != null ? `${internal.years_exp} yrs` : "—"}
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
                      <span className="profileSkillLevel">Lvl {s.proficiency_level}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recommenders placeholder */}
          <section className="profileCard">
            <h2 className="profileSectionTitle">Recommended Fits</h2>
            <p className="profileMuted">
              Coming soon: recommended roles, top matching jobs, and next-skill suggestions.
            </p>

            <div className="profilePlaceholderRow">
              <div className="profilePlaceholderCard" />
              <div className="profilePlaceholderCard" />
              <div className="profilePlaceholderCard" />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
