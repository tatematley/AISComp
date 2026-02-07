import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import ResumeUpload, { type ParsedResume } from "../components/ResumeUpload";
import "../styles/EmployeeEdit.css";
import { apiFetch } from "../lib/api";

type Option = { id: number; name: string };
type SkillOption = { id: number; name: string; category: string | null };
type StatusOption = { id: number; name: string }; // ✅

export default function EmployeeAdd() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // dropdowns
  const [pronouns, setPronouns] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [locations, setLocations] = useState<Option[]>([]);
  const [education, setEducation] = useState<Option[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<SkillOption[]>([]);

  // ✅ NEW: statuses dropdown + selected value
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [candidateStatus, setCandidateStatus] = useState<number | "">("");

  // candidate_information
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [applicationDate, setApplicationDate] = useState<string>("");
  const [pronounsId, setPronounsId] = useState<number | "">("");

  // candidate (internal)
  const [currentRole, setCurrentRole] = useState("");
  const [yearsExp, setYearsExp] = useState<string>("");
  const [availabilityHours, setAvailabilityHours] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [locationId, setLocationId] = useState<number | "">("");
  const [educationId, setEducationId] = useState<number | "">("");

  // skills
  const [skillEdits, setSkillEdits] = useState<
    { candidate_skill_id: number; skill_name: string; proficiency_level: number | null }[]
  >([]);
  const [newSkillId, setNewSkillId] = useState<number | "">("");
  const [newSkillLevel, setNewSkillLevel] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const metaRes = await apiFetch(`/api/meta/profile-edit`);

        if (metaRes.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        if (!metaRes.ok) {
          const body = await metaRes.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load dropdowns");
        }

        const metaJson = (await metaRes.json()) as {
          pronouns: Option[];
          departments: Option[];
          locations: Option[];
          education: Option[];
          skills: SkillOption[];

          // ✅ backend key
          candidate_statuses: StatusOption[];
        };

        setPronouns(metaJson.pronouns);
        setDepartments(metaJson.departments);
        setLocations(metaJson.locations);
        setEducation(metaJson.education);
        setSkillsCatalog(metaJson.skills);

        // ✅ NEW
        setStatuses(metaJson.candidate_statuses ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load page");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [navigate]);

  const skillOptionsFiltered = useMemo(() => {
    const existing = new Set(skillEdits.map((s) => s.skill_name.toLowerCase()));
    return skillsCatalog.filter((s) => !existing.has(s.name.toLowerCase()));
  }, [skillsCatalog, skillEdits]);

  const updateSkillLevel = (candidate_skill_id: number, level: number | null) => {
    setSkillEdits((prev) =>
      prev.map((s) =>
        s.candidate_skill_id === candidate_skill_id ? { ...s, proficiency_level: level } : s
      )
    );
  };

  const removeSkill = (candidate_skill_id: number) => {
    setSkillEdits((prev) => prev.filter((s) => s.candidate_skill_id !== candidate_skill_id));
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

  const handleResumeParsed = (data: ParsedResume) => {
    if (data.name) setName(data.name);
    if (data.position) setPosition(data.position);
    if (data.email) setEmail(data.email);
    if (data.phone) setPhone(data.phone);

    if (data.skills.length > 0) {
      const existingNames = new Set(skillEdits.map((s) => s.skill_name.toLowerCase()));
      const newSkills: typeof skillEdits = [];

      for (const s of data.skills) {
        const catalogSkill = skillsCatalog.find(
          (c) => c.name.toLowerCase() === s.skill_name.toLowerCase(),
        );
        if (catalogSkill && !existingNames.has(catalogSkill.name.toLowerCase())) {
          existingNames.add(catalogSkill.name.toLowerCase());
          newSkills.push({
            candidate_skill_id: -Math.floor(Math.random() * 1_000_000),
            skill_name: catalogSkill.name,
            proficiency_level: s.proficiency_level ?? null,
          });
        }
      }

      if (newSkills.length > 0) {
        setSkillEdits((prev) => [...prev, ...newSkills]);
      }
    }
  };

  const onCreate = async () => {
    setSaving(true);
    setError(null);

    try {
      if (!name.trim()) throw new Error("Name is required.");

      const payload = {
        candidate: {
          name: name.trim(),
          position: position || null,
          email: email || null,
          phone_number: phone || null,
          application_date: applicationDate || null,
          pronouns_id: pronounsId === "" ? null : pronounsId,
          internal: true,
        },
        internal: {
          currentrole: currentRole || null,
          years_exp: yearsExp.trim() === "" ? null : Number(yearsExp),
          availability_hours: availabilityHours.trim() === "" ? null : Number(availabilityHours),
          start_date: startDate || null,
          department_id: departmentId === "" ? null : departmentId,
          location_id: locationId === "" ? null : locationId,
          education_level_id: educationId === "" ? null : educationId,

          // ✅ NEW
          candidate_status: candidateStatus === "" ? null : candidateStatus,
        },
        skills: skillEdits.map((s) => ({
          skill_name: s.skill_name,
          proficiency_level: s.proficiency_level,
        })),
      };

      const res = await apiFetch("/api/employees", {
        method: "POST",
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
        throw new Error(body.error || "Failed to create employee");
      }

      const created = (await res.json()) as { candidate_id: number };
      navigate(`/employees/${created.candidate_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create employee");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="profileEditState">Loading…</div>;
  if (error) return <div className="profileEditState error">{error}</div>;

  return (
    <>
      <AdminNavbar />

      <main className="profileEditPage">
        <div className="profileEditShell">
          <div className="profileEditHeaderRow">
            <div className="profileEditTitleBlock">
              <button
                className="profileEditBackLink"
                onClick={() => navigate("/employees")}
                type="button"
              >
                ← Cancel
              </button>

              <h1 className="profileEditTitle">New Employee</h1>
              <p className="profileEditSubtitle">Create an internal employee record.</p>
            </div>

            <button
              className="profileEditSaveTopBtn"
              type="button"
              onClick={onCreate}
              disabled={saving}
            >
              {saving ? "Saving…" : "Create"}
            </button>
          </div>

          <section className="profileEditCard">
            <div className="profileEditGrid">
              <ResumeUpload onParsed={handleResumeParsed} />

              <div className="profileEditField">
                <div className="profileEditLabel">Name</div>
                <input
                  className="profileEditInput"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                <div className="profileEditLabel">Position</div>
                <input
                  className="profileEditInput"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
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

              <div className="profileEditField">
                <div className="profileEditLabel">Email</div>
                <input
                  className="profileEditInput"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Phone</div>
                <input
                  className="profileEditInput"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="profileEditSectionHeader">Internal Details</div>

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

              {/* ✅ NEW: Status */}
              <div className="profileEditField">
                <div className="profileEditLabel">Status</div>
                <select
                  className="profileEditSelect"
                  value={candidateStatus}
                  onChange={(e) =>
                    setCandidateStatus(e.target.value === "" ? "" : Number(e.target.value))
                  }
                >
                  <option value="">—</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Department</div>
                <select
                  className="profileEditSelect"
                  value={departmentId}
                  onChange={(e) =>
                    setDepartmentId(e.target.value === "" ? "" : Number(e.target.value))
                  }
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
                  onChange={(e) =>
                    setLocationId(e.target.value === "" ? "" : Number(e.target.value))
                  }
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
                  onChange={(e) =>
                    setEducationId(e.target.value === "" ? "" : Number(e.target.value))
                  }
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
                />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Availability Hours</div>
                <input
                  className="profileEditInput"
                  value={availabilityHours}
                  onChange={(e) => setAvailabilityHours(e.target.value)}
                />
              </div>

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
                          const raw = e.target.value.trim();
                          if (raw === "") return updateSkillLevel(s.candidate_skill_id, null);

                          const n = Number(raw);
                          if (Number.isNaN(n) || n < 0 || n > 5) return;
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

            <div className="profileEditBottomRow">
              <button
                className="profileEditCancelBtn"
                type="button"
                onClick={() => navigate("/employees")}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="profileEditSaveBtn"
                type="button"
                onClick={onCreate}
                disabled={saving}
              >
                {saving ? "Saving…" : "Create Employee"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
