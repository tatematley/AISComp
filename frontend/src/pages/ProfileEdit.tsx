import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import "../styles/ProfileEdit.css";

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
    position: string;
    email: string;
    phone_number: string;
    internal: boolean;
    application_date: string | null;
    pronouns: string | null;
    pronouns_id: number | null;
  };
  internal: {
    currentrole: string | null;
    years_exp: number | null;
    availability_hours: number | null;
    start_date: string | null;
    department_id: number | null;
    location_id: number | null;
    education_level_id: number | null;

    department_name: string | null;
    location_name: string | null;
    education_level: string | null;
  } | null;
  skills: SkillRow[];
};

type Option = { id: number; name: string };
type SkillOption = { id: number; name: string; category: string | null };

export default function ProfileEdit() {
  const { id } = useParams();
  const candidateId = Number(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);

  // dropdown data
  const [pronouns, setPronouns] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [locations, setLocations] = useState<Option[]>([]);
  const [education, setEducation] = useState<Option[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<SkillOption[]>([]);

  // form state (candidate_information)
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [applicationDate, setApplicationDate] = useState<string>(""); // yyyy-mm-dd
  const [pronounsId, setPronounsId] = useState<number | "">("");

  // internal (candidate table)
  const [currentRole, setCurrentRole] = useState("");
  const [yearsExp, setYearsExp] = useState<string>("");
  const [availabilityHours, setAvailabilityHours] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [locationId, setLocationId] = useState<number | "">("");
  const [educationId, setEducationId] = useState<number | "">("");

  // skills editor
  const [skillEdits, setSkillEdits] = useState<
    { candidate_skill_id: number; skill_name: string; proficiency_level: number | null }[]
  >([]);
  const [newSkillId, setNewSkillId] = useState<number | "">("");
  const [newSkillLevel, setNewSkillLevel] = useState<string>("");

  // load everything
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
          fetch(`http://localhost:5050/api/candidates/${candidateId}/profile`),
          fetch(`http://localhost:5050/api/meta/profile-edit`),
        ]);

        if (!profileRes.ok) {
          const body = await profileRes.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load profile");
        }
        if (!metaRes.ok) {
          const body = await metaRes.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load dropdowns");
        }

        const profileJson = (await profileRes.json()) as ProfileData;
        const metaJson = (await metaRes.json()) as {
          pronouns: Option[];
          departments: Option[];
          locations: Option[];
          education: Option[];
          skills: SkillOption[];
        };

        // must be internal for this edit page
        if (!profileJson.candidate.internal) {
          throw new Error("This candidate is not an internal employee.");
        }

        setProfile(profileJson);

        setPronouns(metaJson.pronouns);
        setDepartments(metaJson.departments);
        setLocations(metaJson.locations);
        setEducation(metaJson.education);
        setSkillsCatalog(metaJson.skills);

        // seed form state
        setPosition(profileJson.candidate.position ?? "");
        setEmail(profileJson.candidate.email ?? "");
        setPhone(profileJson.candidate.phone_number ?? "");

        setApplicationDate(
          profileJson.candidate.application_date
            ? profileJson.candidate.application_date.slice(0, 10)
            : ""
        );

        setPronounsId(profileJson.candidate.pronouns_id ?? "");

        setCurrentRole(profileJson.internal?.currentrole ?? "");
        setYearsExp(profileJson.internal?.years_exp != null ? String(profileJson.internal.years_exp) : "");
        setAvailabilityHours(
          profileJson.internal?.availability_hours != null ? String(profileJson.internal.availability_hours) : ""
        );
        setStartDate(profileJson.internal?.start_date ? profileJson.internal.start_date.slice(0, 10) : "");

        setDepartmentId(profileJson.internal?.department_id ?? "");
        setLocationId(profileJson.internal?.location_id ?? "");
        setEducationId(profileJson.internal?.education_level_id ?? "");

        setSkillEdits(
          profileJson.skills.map((s) => ({
            candidate_skill_id: s.candidate_skill_id,
            skill_name: s.skill_name,
            proficiency_level: s.proficiency_level,
          }))
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load edit page");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [candidateId]);

  const skillOptionsFiltered = useMemo(() => {
    // hide skills already on candidate (by name)
    const existing = new Set(skillEdits.map((s) => s.skill_name.toLowerCase()));
    return skillsCatalog.filter((s) => !existing.has(s.name.toLowerCase()));
  }, [skillsCatalog, skillEdits]);

  const updateSkillLevel = (candidate_skill_id: number, level: number | null) => {
    setSkillEdits((prev) =>
      prev.map((s) => (s.candidate_skill_id === candidate_skill_id ? { ...s, proficiency_level: level } : s))
    );
  };

  const removeSkill = (candidate_skill_id: number) => {
    setSkillEdits((prev) => prev.filter((s) => s.candidate_skill_id !== candidate_skill_id));
  };

  const addSkill = () => {
    if (newSkillId === "") return;

    const picked = skillsCatalog.find((s) => s.id === newSkillId);
    if (!picked) return;

    const lvl = newSkillLevel.trim() === "" ? null : Number(newSkillLevel);
    if (newSkillLevel.trim() !== "" && (Number.isNaN(lvl) || lvl < 0 || lvl > 5)) {
      setError("Skill level must be a number between 0 and 5.");
      return;
    }

    // new skills don't have candidate_skill_id yet; use negative temp ids for React keys
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
        },
        internal: {
          currentrole: currentRole || null,
          years_exp: yearsExp.trim() === "" ? null : Number(yearsExp),
          availability_hours: availabilityHours.trim() === "" ? null : Number(availabilityHours),
          start_date: startDate || null,
          department_id: departmentId === "" ? null : departmentId,
          location_id: locationId === "" ? null : locationId,
          education_level_id: educationId === "" ? null : educationId,
        },
        skills: skillEdits.map((s) => ({
          candidate_skill_id: s.candidate_skill_id, // negative means "new"
          skill_name: s.skill_name,
          proficiency_level: s.proficiency_level,
        })),
      };

      const res = await fetch(
        `http://localhost:5050/api/candidates/${candidateId}/profile`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save changes");
      }

      // go back to profile detail
      navigate(`/employees/${candidateId}`);
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
                onClick={() => navigate(`/employees/${candidateId}`)}
                type="button"
              >
                ← Cancel
              </button>

              <h1 className="profileEditTitle">Edit Employee</h1>
              <p className="profileEditSubtitle">
                <strong>{profile.candidate.name}</strong> (locked) • ID {profile.candidate.candidate_id}
              </p>
            </div>

            <button
              className="profileEditSaveTopBtn"
              type="button"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>

          {/* form card */}
          <section className="profileEditCard">
            <div className="profileEditGrid">
              {/* Locked */}
              <div className="profileEditField">
                <div className="profileEditLabel">Name (locked)</div>
                <input className="profileEditInput" value={profile.candidate.name} disabled />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Employee ID (locked)</div>
                <input className="profileEditInput" value={String(profile.candidate.candidate_id)} disabled />
              </div>

              {/* Editable candidate_information */}
              <div className="profileEditField">
                <div className="profileEditLabel">Position</div>
                <input
                  className="profileEditInput"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., Data Analyst"
                />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Pronouns</div>
                <select
                  className="profileEditSelect"
                  value={pronounsId}
                  onChange={(e) => setPronounsId(e.target.value === "" ? "" : Number(e.target.value))}
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
                  placeholder="name@company.com"
                />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Phone</div>
                <input
                  className="profileEditInput"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="555-0101"
                />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Application Date</div>
                <input
                  className="profileEditInput"
                  type="date"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                />
              </div>

              <div className="profileEditField profileEditSpacer" />

              {/* Internal section */}
              <div className="profileEditSectionHeader">
                Internal Details
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Current Role</div>
                <input
                  className="profileEditInput"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Start Date</div>
                <input
                  className="profileEditInput"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Department</div>
                <select
                  className="profileEditSelect"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="">—</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Location</div>
                <select
                  className="profileEditSelect"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="">—</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Education</div>
                <select
                  className="profileEditSelect"
                  value={educationId}
                  onChange={(e) => setEducationId(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="">—</option>
                  {education.map((ed) => (
                    <option key={ed.id} value={ed.id}>
                      {ed.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Years Experience</div>
                <input
                  className="profileEditInput"
                  value={yearsExp}
                  onChange={(e) => setYearsExp(e.target.value)}
                  placeholder="e.g., 3"
                />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Availability Hours</div>
                <input
                  className="profileEditInput"
                  value={availabilityHours}
                  onChange={(e) => setAvailabilityHours(e.target.value)}
                  placeholder="e.g., 25"
                />
              </div>

              {/* Skills section */}
              <div className="profileEditSectionHeader">
                Skills
              </div>

              <div className="profileEditSkillsAddRow">
                <div className="profileEditField">
                  <div className="profileEditLabel">Add Skill</div>
                  <select
                    className="profileEditSelect"
                    value={newSkillId}
                    onChange={(e) => setNewSkillId(e.target.value === "" ? "" : Number(e.target.value))}
                  >
                    <option value="">Select a skill…</option>
                    {skillOptionsFiltered.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.category ? `${s.category} — ` : ""}{s.name}
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
                  />
                </div>

                <button
                  className="profileEditAddBtn"
                  type="button"
                  onClick={addSkill}
                  disabled={newSkillId === ""}
                >
                  + Add
                </button>
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
                          const v = e.target.value.trim();
                          const n = v === "" ? null : Number(v);
                          if (v !== "" && (Number.isNaN(n) || n < 0 || n > 5)) return;
                          updateSkillLevel(s.candidate_skill_id, n);
                        }}
                        placeholder="Lvl"
                      />

                      <button
                        className="profileEditRemoveBtn"
                        type="button"
                        onClick={() => removeSkill(s.candidate_skill_id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* bottom action row */}
            <div className="profileEditBottomRow">
              <button
                className="profileEditCancelBtn"
                type="button"
                onClick={() => navigate(`/employees/${candidateId}`)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="profileEditSaveBtn"
                type="button"
                onClick={onSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
