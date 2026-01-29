import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    name: string | null;
    position: string | null;
    email: string | null;
    phone_number: string | null;
    internal: boolean;
    application_date: string | null;
    pronouns: string | null;
  };
  internal: null;
  skills: Skill[];
};

export default function Applicant() {
  const { id } = useParams();
  const candidateId = Number(id);
  const navigate = useNavigate();
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
          throw new Error(body.error || "Failed to load applicant");
        }
        return res.json();
      })
      .then((json: ProfileData | null) => {
        if (!json) return;

        if (json?.candidate?.internal) {
          navigate(`/employees/${candidateId}`, { replace: true });
          return;
        }
        setData(json);
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
    const ok = window.confirm("Delete this applicant? This can’t be undone.");
    if (!ok) return;

    try {
      const res = await apiFetch(`/api/applicants/${candidateId}`, { method: "DELETE" });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete applicant");
      }

      navigate("/applicants");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete applicant");
    }
  };

  if (loading) return <div className="profileState">Loading…</div>;
  if (error) return <div className="profileState error">{error}</div>;
  if (!data) return null;

  const { candidate, skills } = data;

  return (
    <>
      <AdminNavbar />

      <main className="profilePage">
        <div className="profileShell">
          <div className="profileHeaderRow">
            <div className="profileTitleBlock">
              <button
                className="profileBackLink"
                onClick={() => navigate("/applicants")}
                type="button"
              >
                ← Back to Applicants
              </button>

              <div className="profileTitleRow">
                <h1 className="profileTitle">
                  {candidate.name ?? `Candidate ${candidate.candidate_id}`}
                </h1>
                <span className="profilePill">Applicant</span>
              </div>

              <p className="profileRole">{candidate.position ?? "—"}</p>
            </div>

            {canEdit && (
              <div className="profileActionsRow">
                <button
                  className="profileActionBtn"
                  type="button"
                  onClick={() => navigate(`/applicants/${candidateId}/edit`)}
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

          <section className="profileCard">
            <div className="profileTopGrid">
              <div className="profileLeftCol">
                <div className="profileAvatar">
                  <img
                    src={`/images/profiles/${candidate.name ? toPhotoFile(candidate.name) : "sarah.jpeg"}`}
                    alt={`${candidate.name ?? "Applicant"} profile`}
                    className="profileAvatarImg"
                  />
                </div>
              </div>

              <div className="profileRightCol">
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
                    <div className="profileLabel">Phone</div>
                    <div className="profileValue">{candidate.phone_number || "—"}</div>
                  </div>
                </div>
              </div>
            </div>

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
        </div>
      </main>
    </>
  );
}
