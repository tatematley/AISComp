import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import "../styles/EmployeeEdit.css";
import { apiFetch } from "../lib/api";
import { isManager } from "../lib/auth";

type SkillRow = {
  candidate_skill_id: number;
  skill_name: string;
  proficiency_level: number | null;
  skill_category: string | null;
};

type ProfileData = {
  candidate: {
    candidate_id: number;
    name: string;
    position: string | null;
    email: string | null;
    phone_number: string | null;
    internal: boolean;
    application_date: string | null;
    pronouns: string | null;
    pronouns_id: number | null;

    // ✅ add these (comes from GET /api/candidates/:id/profile)
    candidate_status: number | null;
    candidate_status_description: string | null;
  };
  internal: null; // applicants won't use internal section
  skills: SkillRow[];
};

type Option = { id: number; name: string };
type SkillOption = { id: number; name: string; category: string | null };
type StatusOption = { id: number; name: string }; // from /api/meta/profile-edit (candidate_statuses)

export default function ApplicantEdit() {
  const { id } = useParams();
  const candidateId = Number(id);
  const navigate = useNavigate();
  const canEdit = isManager();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);

  // dropdowns
  const [pronouns, setPronouns] = useState<Option[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<SkillOption[]>([]);
  const [statuses, setStatuses] = useState<StatusOption[]>([]);

  // form state (candidate_information)
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [applicationDate, setApplicationDate] = useState<string>("");
  const [pronounsId, setPronounsId] = useState<number | "">("");

  // ✅ NEW: candidate_status (lives on candidate table)
  const [candidateStatus, setCandidateStatus] = useState<number | "">("");

  // skills editor
  const [skillEdits, setSkillEdits] = useState<
    { candidate_skill_id: number; skill_name: string; proficiency_level: number | null }[]
  >([]);
  const [newSkillId, setNewSkillId] = useState<number | "">("");
  const [newSkillLevel, setNewSkillLevel] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      if (Number.isNaN(candidateId)) {
        setError("Invalid candidate ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [profileRes, metaRes] = await Promise.all([
          apiFetch(`/api/candidates/${candidateId}/profile`),
          apiFetch(`/api/meta/profile-edit`),
        ]);

        if (profileRes.status === 401 || metaRes.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        if (!profileRes.ok) {
          const body = await profileRes.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load applicant");
        }
        if (!metaRes.ok) {
          const body = await metaRes.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load dropdowns");
        }

        const profileJson = (await profileRes.json()) as ProfileData;

        const metaJson = (await metaRes.json()) as {
          pronouns: Option[];
          skills: SkillOption[];
          candidate_statuses: StatusOption[]; // ✅ IMPORTANT: matches backend key
        };

        // must be applicant for this edit page
        if (profileJson.candidate.internal) {
          navigate(`/employees/${candidateId}/edit`, { replace: true });
          return;
        }

        setProfile(profileJson);

        setPronouns(metaJson.pronouns ?? []);
        setSkillsCatalog(metaJson.skills ?? []);
        setStatuses(metaJson.candidate_statuses ?? []);

        // seed form fields
        setPosition(profileJson.candidate.position ?? "");
        setEmail(profileJson.candidate.email ?? "");
        setPhone(profileJson.candidate.phone_number ?? "");

        setApplicationDate(
          profileJson.candidate.application_date
            ? profileJson.candidate.application_date.slice(0, 10)
            : "",
        );

        setPronounsId(profileJson.candidate.pronouns_id ?? "");

        // ✅ seed candidate_status
        setCandidateStatus(profileJson.candidate.candidate_status ?? "");

        setSkillEdits(
          (profileJson.skills ?? []).map((s) => ({
            candidate_skill_id: s.candidate_skill_id,
            skill_name: s.skill_name,
            proficiency_level: s.proficiency_level,
          })),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load edit page");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [candidateId, navigate]);

  const skillOptionsFiltered = useMemo(() => {
    const existing = new Set(skillEdits.map((s) => s.skill_name.toLowerCase()));
    return skillsCatalog.filter((s) => !existing.has(s.name.toLowerCase()));
  }, [skillsCatalog, skillEdits]);

  const updateSkillLevel = (candidate_skill_id: number, level: number | null) => {
    setSkillEdits((prev) =>
      prev.map((s) =>
        s.candidate_skill_id === candidate_skill_id
          ? { ...s, proficiency_level: level }
          : s,
      ),
    );
  };

  const removeSkill = (candidate_skill_id: number) => {
    setSkillEdits((prev) =>
      prev.filter((s) => s.candidate_skill_id !== candidate_skill_id),
    );
  };

  const addSkill = () => {
    if (newSkillId === "") return;

    const picked = skillsCatalog.find((s) => s.id === newSkillId);
    if (!picked) return;

    const raw = newSkillLevel.trim();
    let lvl: number | null = null;

    if (raw !== "") {
      const n = Number(raw);
      if (Number.isNaN(n) || n < 0 || n > 5) {
        setError("Skill level must be a number between 0 and 5.");
        return;
      }
      lvl = n;
    }

    const tempId = -Math.floor(Math.random() * 1_000_000);

    setSkillEdits((prev) => [
      ...prev,
      { candidate_skill_id: tempId, skill_name: picked.name, proficiency_level: lvl },
    ]);

    setNewSkillId("");
    setNewSkillLevel("");
  };

  const onSave = async () => {
    if (!profile) return;
    if (!canEdit) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        candidate: {
          position,
          email,
          phone_number: phone,
          application_date: applicationDate || null,
          pronouns_id: pronounsId === "" ? null : pronounsId,

          // ✅ NEW: send candidate_status to the applicant PUT route (updates candidate table)
          candidate_status: candidateStatus === "" ? null : candidateStatus,
        },
        skills: skillEdits.map((s) => ({
          candidate_skill_id: s.candidate_skill_id, // negative means "new"
          skill_name: s.skill_name,
          proficiency_level: s.proficiency_level,
        })),
      };

      const res = await apiFetch(`/api/candidates/${candidateId}/applicant`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save changes");
      }

      navigate(`/applicants/${candidateId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="profileEditState">Loading…</div>;
  if (error) return <div className="profileEditState error">{error}</div>;
  if (!profile) return null;

  return (
    <>
      <AdminNavbar />

      <main className="profileEditPage">
        <div className="profileEditShell">
          {/* header */}
          <div className="profileEditHeaderRow">
            <div className="profileEditTitleBlock">
              <button
                className="profileEditBackLink"
                onClick={() => navigate(`/applicants/${candidateId}`)}
                type="button"
              >
                ← Cancel
              </button>

              <h1 className="profileEditTitle">Edit Applicant</h1>
              <p className="profileEditSubtitle">
                <strong>{profile.candidate.name}</strong> • ID{" "}
                {profile.candidate.candidate_id}
              </p>
            </div>

            {canEdit && (
              <button
                className="profileEditSaveTopBtn"
                type="button"
                onClick={onSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            )}
          </div>

          {/* form card */}
          <section className="profileEditCard">
            <div className="profileEditGrid">
              {/* Locked */}
              <div className="profileEditField">
                <div className="profileEditLabel">Name (locked)</div>
                <input
                  className="profileEditInput"
                  value={profile.candidate.name}
                  disabled
                />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Applicant ID (locked)</div>
                <input
                  className="profileEditInput"
                  value={String(profile.candidate.candidate_id)}
                  disabled
                />
              </div>

              {/* Editable */}
              <div className="profileEditField">
                <div className="profileEditLabel">Position</div>
                <input
                  className="profileEditInput"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., Data Analyst"
                  disabled={!canEdit}
                />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Pronouns</div>
                <select
                  className="profileEditSelect"
                  value={pronounsId}
                  onChange={(e) =>
                    setPronounsId(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  disabled={!canEdit}
                >
                  <option value="">—</option>
                  {pronouns.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Email</div>
                <input
                  className="profileEditInput"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  disabled={!canEdit}
                />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Phone</div>
                <input
                  className="profileEditInput"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="555-0101"
                  disabled={!canEdit}
                />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Application Date</div>
                <input
                  className="profileEditInput"
                  type="date"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  disabled={!canEdit}
                />
              </div>

              {/* ✅ NEW: Status dropdown */}
              <div className="profileEditField">
                <div className="profileEditLabel">Status</div>
                <select
                  className="profileEditSelect"
                  value={candidateStatus}
                  onChange={(e) =>
                    setCandidateStatus(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  disabled={!canEdit}
                >
                  <option value="">—</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Skills section */}
              <div className="profileEditSectionHeader">Skills</div>

              <div className="profileEditSkillsAddRow">
                <div className="profileEditField">
                  <div className="profileEditLabel">Add Skill</div>
                  <select
                    className="profileEditSelect"
                    value={newSkillId}
                    onChange={(e) =>
                      setNewSkillId(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    disabled={!canEdit}
                  >
                    <option value="">Select a skill…</option>
                    {skillOptionsFiltered.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.category ? `${s.category} — ` : ""}
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="profileEditField">
                  <div className="profileEditLabel">Level (0–5)</div>
                  <input
                    className="profileEditInput"
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(e.target.value)}
                    placeholder="optional"
                    disabled={!canEdit}
                  />
                </div>

                {canEdit && (
                  <button
                    className="profileEditAddBtn"
                    type="button"
                    onClick={addSkill}
                    disabled={newSkillId === ""}
                  >
                    + Add
                  </button>
                )}
              </div>

              <div className="profileEditSkillsList">
                {skillEdits.length === 0 ? (
                  <div className="profileEditMuted">No skills yet.</div>
                ) : (
                  skillEdits.map((s) => (
                    <div className="profileEditSkillRow" key={s.candidate_skill_id}>
                      <div className="profileEditSkillName">{s.skill_name}</div>

                      <input
                        className="profileEditSkillLevel"
                        value={s.proficiency_level == null ? "" : String(s.proficiency_level)}
                        onChange={(e) => {
                          if (!canEdit) return;

                          const raw = e.target.value.trim();

                          if (raw === "") {
                            updateSkillLevel(s.candidate_skill_id, null);
                            return;
                          }

                          const n = Number(raw);
                          if (Number.isNaN(n) || n < 0 || n > 5) return;

                          updateSkillLevel(s.candidate_skill_id, n);
                        }}
                        placeholder="Lvl"
                        disabled={!canEdit}
                      />

                      {canEdit && (
                        <button
                          className="profileEditRemoveBtn"
                          type="button"
                          onClick={() => removeSkill(s.candidate_skill_id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="profileEditBottomRow">
              <button
                className="profileEditCancelBtn"
                type="button"
                onClick={() => navigate(`/applicants/${candidateId}`)}
                disabled={saving}
              >
                Cancel
              </button>

              {canEdit && (
                <button
                  className="profileEditSaveBtn"
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
