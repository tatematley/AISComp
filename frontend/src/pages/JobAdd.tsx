import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import "../styles/EmployeeEdit.css";
import { apiFetch } from "../lib/api";
import { isManager } from "../lib/auth";

type Option = { id: number; name: string };
type SkillOption = { id: number; name: string; category: string | null };

// ✅ NEW
type JobGroupOption = { id: number; name: string };

export default function JobAdd() {
  const navigate = useNavigate();
  const canEdit = isManager();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // dropdowns (from /api/meta/job-edit)
  const [jobStatuses, setJobStatuses] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [locations, setLocations] = useState<Option[]>([]);
  const [education, setEducation] = useState<Option[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<SkillOption[]>([]);

  // ✅ NEW: job groups
  const [jobGroups, setJobGroups] = useState<JobGroupOption[]>([]);
  const [jobGroupId, setJobGroupId] = useState<number | "">("");

  // job fields
  const [jobTitle, setJobTitle] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [workStatus, setWorkStatus] = useState("");
  const [departmentName, setDepartmentName] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");
  const [jobStatusId, setJobStatusId] = useState<number | "">("");
  const [minYearsExperience, setMinYearsExperience] = useState<string>("");
  const [educationReq, setEducationReq] = useState<string>("");
  const [jobSalary, setJobSalary] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");

  // required skills editor
  const [jobSkillEdits, setJobSkillEdits] = useState<
    {
      temp_id: number;
      skill_id: number;
      skill_name: string;
      required_level: number | null;
      importance_weight: number | null;
    }[]
  >([]);
  const [newSkillId, setNewSkillId] = useState<number | "">("");
  const [newReqLevel, setNewReqLevel] = useState<string>("");
  const [newWeight, setNewWeight] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const metaRes = await apiFetch("/api/meta/job-edit");

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

        const meta = (await metaRes.json()) as {
          job_statuses: Option[];
          departments: Option[];
          locations: Option[];
          education: Option[];
          skills: SkillOption[];

          // ✅ NEW
          job_groups: JobGroupOption[];
        };

        setJobStatuses(meta.job_statuses);
        setDepartments(meta.departments);
        setLocations(meta.locations);
        setEducation(meta.education);
        setSkillsCatalog(meta.skills);

        // ✅ NEW
        setJobGroups(meta.job_groups ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load page");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [navigate]);

  const availableSkillOptions = useMemo(() => {
    const used = new Set(jobSkillEdits.map((s) => s.skill_id));
    return skillsCatalog.filter((s) => !used.has(s.id));
  }, [skillsCatalog, jobSkillEdits]);

  const addRequiredSkill = () => {
    if (newSkillId === "") return;

    const picked = skillsCatalog.find((s) => s.id === newSkillId);
    if (!picked) return;

    // required_level: null or 0-5
    const rawLvl = newReqLevel.trim();
    let lvl: number | null = null;
    if (rawLvl !== "") {
      const n = Number(rawLvl);
      if (Number.isNaN(n) || n < 0 || n > 5) {
        setError("Required level must be a number between 0 and 5.");
        return;
      }
      lvl = n;
    }

    // weight: null or number
    const rawW = newWeight.trim();
    let w: number | null = null;
    if (rawW !== "") {
      const n = Number(rawW);
      if (Number.isNaN(n)) {
        setError("Importance weight must be a number.");
        return;
      }
      w = n;
    }

    const tempId = -Math.floor(Math.random() * 1_000_000);

    setJobSkillEdits((prev) => [
      ...prev,
      {
        temp_id: tempId,
        skill_id: picked.id,
        skill_name: picked.name,
        required_level: lvl,
        importance_weight: w,
      },
    ]);

    setNewSkillId("");
    setNewReqLevel("");
    setNewWeight("");
  };

  const removeRequiredSkill = (temp_id: number) => {
    setJobSkillEdits((prev) => prev.filter((s) => s.temp_id !== temp_id));
  };

  const onCreate = async () => {
    if (!canEdit) return;

    setSaving(true);
    setError(null);

    try {
      if (!jobTitle.trim()) throw new Error("Job title is required.");

      const payload = {
        job: {
          job_title: jobTitle.trim(),
          job_category: jobCategory || null,
          job_description: jobDescription || null,
          work_status: workStatus || null,
          department: departmentName || null,
          job_location: locationName || null,
          job_status_id: jobStatusId === "" ? null : jobStatusId,

          // ✅ NEW
          job_group_id: jobGroupId === "" ? null : jobGroupId,

          min_years_experience:
            minYearsExperience.trim() === "" ? null : Number(minYearsExperience),
          education_req: educationReq || null,
          job_salary: jobSalary.trim() === "" ? null : Number(jobSalary),
          start_date: startDate || null,
        },
        skills: jobSkillEdits.map((s) => ({
          skill_id: s.skill_id,
          required_level: s.required_level,
          importance_weight: s.importance_weight,
        })),
      };

      if (
        payload.job.min_years_experience !== null &&
        Number.isNaN(payload.job.min_years_experience)
      ) {
        throw new Error("Min years experience must be a number.");
      }
      if (payload.job.job_salary !== null && Number.isNaN(payload.job.job_salary)) {
        throw new Error("Salary must be a number.");
      }

      const res = await apiFetch("/api/jobs", {
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
        throw new Error(body.error || "Failed to create job");
      }

      const created = (await res.json()) as { job_id: number };
      navigate(`/jobs/${created.job_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create job");
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
                onClick={() => navigate("/jobs")}
                type="button"
              >
                ← Cancel
              </button>

              <h1 className="profileEditTitle">New Job</h1>
              <p className="profileEditSubtitle">Create a job posting and required skills.</p>
            </div>

            {canEdit && (
              <button
                className="profileEditSaveTopBtn"
                type="button"
                onClick={onCreate}
                disabled={saving}
              >
                {saving ? "Saving…" : "Create"}
              </button>
            )}
          </div>

          <section className="profileEditCard">
            <div className="profileEditGrid">
              <div className="profileEditField">
                <div className="profileEditLabel">Job Title</div>
                <input
                  className="profileEditInput"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Job Category</div>
                <input
                  className="profileEditInput"
                  value={jobCategory}
                  onChange={(e) => setJobCategory(e.target.value)}
                />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Work Status</div>
                <input
                  className="profileEditInput"
                  value={workStatus}
                  onChange={(e) => setWorkStatus(e.target.value)}
                  placeholder="e.g., Remote / Hybrid / In-office"
                />
              </div>

              {/* ✅ NEW: Job Group */}
              <div className="profileEditField">
                <div className="profileEditLabel">Job Group</div>
                <select
                  className="profileEditSelect"
                  value={jobGroupId}
                  onChange={(e) =>
                    setJobGroupId(e.target.value === "" ? "" : Number(e.target.value))
                  }
                >
                  <option value="">—</option>
                  {jobGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Job Status</div>
                <select
                  className="profileEditSelect"
                  value={jobStatusId}
                  onChange={(e) =>
                    setJobStatusId(e.target.value === "" ? "" : Number(e.target.value))
                  }
                >
                  <option value="">—</option>
                  {jobStatuses.map((s) => (
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
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                >
                  <option value="">—</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Location</div>
                <select
                  className="profileEditSelect"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                >
                  <option value="">—</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.name}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Min Years Experience</div>
                <input
                  className="profileEditInput"
                  value={minYearsExperience}
                  onChange={(e) => setMinYearsExperience(e.target.value)}
                  placeholder="e.g., 2"
                />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Education Requirement</div>
                <select
                  className="profileEditSelect"
                  value={educationReq}
                  onChange={(e) => setEducationReq(e.target.value)}
                >
                  <option value="">—</option>
                  {education.map((ed) => (
                    <option key={ed.id} value={ed.name}>
                      {ed.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Salary</div>
                <input
                  className="profileEditInput"
                  value={jobSalary}
                  onChange={(e) => setJobSalary(e.target.value)}
                  placeholder="number only"
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

              <div className="profileEditField" style={{ gridColumn: "1 / -1" }}>
                <div className="profileEditLabel">Job Description</div>
                <input
                  className="profileEditInput"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="(kept as a single-line input to match your current CSS)"
                />
              </div>

              <div className="profileEditSectionHeader">Required Skills</div>

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
                    {availableSkillOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.category ? `${s.category} — ` : ""}
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="profileEditField">
                  <div className="profileEditLabel">Required Level (0–5)</div>
                  <input
                    className="profileEditInput"
                    value={newReqLevel}
                    onChange={(e) => setNewReqLevel(e.target.value)}
                    placeholder="optional"
                  />
                </div>

                {canEdit && (
                  <button
                    className="profileEditAddBtn"
                    type="button"
                    onClick={addRequiredSkill}
                    disabled={newSkillId === ""}
                  >
                    + Add
                  </button>
                )}
              </div>

              <div className="profileEditField" style={{ gridColumn: "1 / -1" }}>
                <div className="profileEditLabel">Importance Weight (optional)</div>
                <input
                  className="profileEditInput"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="number (optional)"
                />
              </div>

              <div className="profileEditSkillsList">
                {jobSkillEdits.length === 0 ? (
                  <div className="profileEditMuted">No required skills yet.</div>
                ) : (
                  jobSkillEdits.map((s) => (
                    <div className="profileEditSkillRow" key={s.temp_id}>
                      <div className="profileEditSkillName">{s.skill_name}</div>
                      <div className="profileEditMuted">
                        {s.required_level == null ? "Lvl —" : `Lvl ${s.required_level}`}{" "}
                        {s.importance_weight == null ? "" : `• W ${s.importance_weight}`}
                      </div>

                      {canEdit && (
                        <button
                          className="profileEditRemoveBtn"
                          type="button"
                          onClick={() => removeRequiredSkill(s.temp_id)}
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
                onClick={() => navigate("/jobs")}
                disabled={saving}
              >
                Cancel
              </button>

              {canEdit && (
                <button
                  className="profileEditSaveBtn"
                  type="button"
                  onClick={onCreate}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Create Job"}
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
