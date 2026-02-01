import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import "../styles/EmployeeEdit.css";
import { apiFetch } from "../lib/api";
import { isManager } from "../lib/auth";

type Option = { id: number; name: string };
type SkillOption = { id: number; name: string; category: string | null };

type JobSkillRow = {
  jobskill_id: number;
  skill_id: number;
  skill_name: string;
  required_level: number | null;
  importance_weight: number | null;
};

type JobData = {
  job: {
    job_id: number;
    job_title: string;
    job_category: string | null;
    job_description: string | null;
    department: string | null;
    job_status_id: number | null;
    min_years_experience: number | null;
    education_req: string | null;
    job_salary: string | null;
    job_location: string | null;
    work_status: string | null;
    start_date: string | null;
  };
  skills: JobSkillRow[];
};

export default function JobEdit() {
  const { id } = useParams();
  const jobId = Number(id);
  const navigate = useNavigate();
  const canEdit = isManager();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [jobData, setJobData] = useState<JobData | null>(null);

  const [jobStatuses, setJobStatuses] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [locations, setLocations] = useState<Option[]>([]);
  const [education, setEducation] = useState<Option[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<SkillOption[]>([]);

  const [jobTitle, setJobTitle] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [jobStatusId, setJobStatusId] = useState<number | "">("");
  const [minYearsExp, setMinYearsExp] = useState<string>("");
  const [educationReq, setEducationReq] = useState("");
  const [jobSalary, setJobSalary] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [workStatus, setWorkStatus] = useState("");
  const [startDate, setStartDate] = useState<string>("");

  const [skillEdits, setSkillEdits] = useState<JobSkillRow[]>([]);
  const [newSkillId, setNewSkillId] = useState<number | "">("");
  const [newRequiredLevel, setNewRequiredLevel] = useState<string>("");
  const [newImportanceWeight, setNewImportanceWeight] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      if (Number.isNaN(jobId)) {
        setError("Invalid job ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [jobRes, metaRes] = await Promise.all([
          apiFetch(`/api/jobs/${jobId}/edit`),
          apiFetch(`/api/meta/job-edit`),
        ]);

        if (jobRes.status === 401 || metaRes.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        if (!jobRes.ok) {
          const body = await jobRes.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load job");
        }
        if (!metaRes.ok) {
          const body = await metaRes.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load dropdowns");
        }

        const jobJson = (await jobRes.json()) as JobData;
        const metaJson = (await metaRes.json()) as {
          job_statuses: Option[];
          departments: Option[];
          locations: Option[];
          education: Option[];
          skills: SkillOption[];
        };

        setJobData(jobJson);

        setJobStatuses(metaJson.job_statuses);
        setDepartments(metaJson.departments);
        setLocations(metaJson.locations);
        setEducation(metaJson.education);
        setSkillsCatalog(metaJson.skills);

        setJobTitle(jobJson.job.job_title ?? "");
        setJobCategory(jobJson.job.job_category ?? "");
        setJobDescription(jobJson.job.job_description ?? "");
        setDepartment(jobJson.job.department ?? "");
        setJobStatusId(jobJson.job.job_status_id ?? "");
        setMinYearsExp(
          jobJson.job.min_years_experience != null ? String(jobJson.job.min_years_experience) : ""
        );
        setEducationReq(jobJson.job.education_req ?? "");
        setJobSalary(jobJson.job.job_salary ?? "");
        setJobLocation(jobJson.job.job_location ?? "");
        setWorkStatus(jobJson.job.work_status ?? "");
        setStartDate(jobJson.job.start_date ? jobJson.job.start_date.slice(0, 10) : "");

        setSkillEdits(
          (jobJson.skills ?? []).map((s) => ({
            jobskill_id: s.jobskill_id,
            skill_id: s.skill_id,
            skill_name: s.skill_name,
            required_level: s.required_level,
            importance_weight: s.importance_weight,
          }))
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load edit page");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [jobId]);

  const skillOptionsFiltered = useMemo(() => {
    const existing = new Set(skillEdits.map((s) => s.skill_id));
    return skillsCatalog.filter((s) => !existing.has(s.id));
  }, [skillsCatalog, skillEdits]);

  const updateSkill = (
    jobskill_id: number,
    patch: Partial<Pick<JobSkillRow, "required_level" | "importance_weight">>
  ) => {
    setSkillEdits((prev) =>
      prev.map((s) => (s.jobskill_id === jobskill_id ? { ...s, ...patch } : s))
    );
  };

  const removeSkill = (jobskill_id: number) => {
    setSkillEdits((prev) => prev.filter((s) => s.jobskill_id !== jobskill_id));
  };

  const addSkill = () => {
    if (newSkillId === "") return;

    const picked = skillsCatalog.find((s) => s.id === newSkillId);
    if (!picked) return;

    // required level: 0–5 or null
    const requiredText = newRequiredLevel.trim();
    let lvl: number | null = null;

    if (requiredText !== "") {
      const n = Number(requiredText);
      if (Number.isNaN(n) || n < 0 || n > 5) {
        setError("Required level must be a number between 0 and 5.");
        return;
      }
      lvl = n;
    }

    // importance weight: number or null
    const weightText = newImportanceWeight.trim();
    let w: number | null = null;

    if (weightText !== "") {
      const n = Number(weightText);
      if (Number.isNaN(n)) {
        setError("Importance weight must be a number.");
        return;
      }
      w = n;
    }

    const tempId = -Math.floor(Math.random() * 1_000_000);

    setSkillEdits((prev) => [
      ...prev,
      {
        jobskill_id: tempId,
        skill_id: picked.id,
        skill_name: picked.name,
        required_level: lvl,
        importance_weight: w,
      },
    ]);

    setNewSkillId("");
    setNewRequiredLevel("");
    setNewImportanceWeight("");
  };

  const onSave = async () => {
    if (!jobData) return;
    if (!canEdit) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        job: {
          job_title: jobTitle,
          job_category: jobCategory || null,
          job_description: jobDescription || null,
          department: department || null,
          job_status_id: jobStatusId === "" ? null : jobStatusId,
          min_years_experience: minYearsExp.trim() === "" ? null : Number(minYearsExp),
          education_req: educationReq || null,
          job_salary: jobSalary || null,
          job_location: jobLocation || null,
          work_status: workStatus || null,
          start_date: startDate || null,
        },
        skills: skillEdits.map((s) => ({
          jobskill_id: s.jobskill_id,
          skill_id: s.skill_id,
          required_level: s.required_level,
          importance_weight: s.importance_weight,
        })),
      };

      const res = await apiFetch(`/api/jobs/${jobId}`, {
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

      navigate(`/jobs/${jobId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="profileEditState">Loading…</div>;
  if (error) return <div className="profileEditState error">{error}</div>;
  if (!jobData) return null;

  return (
    <>
      <AdminNavbar />

      <main className="profileEditPage">
        <div className="profileEditShell">
          <div className="profileEditHeaderRow">
            <div className="profileEditTitleBlock">
              <button
                className="profileEditBackLink"
                onClick={() => navigate(`/jobs/${jobId}`)}
                type="button"
              >
                ← Cancel
              </button>

              <h1 className="profileEditTitle">Edit Job</h1>
              <p className="profileEditSubtitle">
                <strong>{jobData.job.job_title}</strong> • ID {jobData.job.job_id}
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

          <section className="profileEditCard">
            <div className="profileEditGrid">
              <div className="profileEditField">
                <div className="profileEditLabel">Job Title</div>
                <input
                  className="profileEditInput"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Data Analyst"
                />
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
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
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
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
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
                <div className="profileEditLabel">Work Status</div>
                <input
                  className="profileEditInput"
                  value={workStatus}
                  onChange={(e) => setWorkStatus(e.target.value)}
                  placeholder="e.g., Hybrid / Remote / On-site"
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
                <div className="profileEditLabel">Min Years Experience</div>
                <input
                  className="profileEditInput"
                  value={minYearsExp}
                  onChange={(e) => setMinYearsExp(e.target.value)}
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
                  placeholder="e.g., $70k–$90k"
                />
              </div>

              <div className="profileEditField">
                <div className="profileEditLabel">Job Category</div>
                <input
                  className="profileEditInput"
                  value={jobCategory}
                  onChange={(e) => setJobCategory(e.target.value)}
                  placeholder="e.g., Analytics"
                />
              </div>

              <div className="profileEditSectionHeader">Description</div>

              <div className="profileEditField" style={{ gridColumn: "1 / -1" }}>
                <div className="profileEditLabel">Job Description</div>
                <textarea
                  className="profileEditInput"
                  style={{ height: 140, paddingTop: 12, resize: "vertical" }}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Write the job description…"
                />
              </div>

              <div className="profileEditSectionHeader">Required Skills</div>

              <div
                className="profileEditSkillsAddRow"
                style={{ gridTemplateColumns: "1fr 160px 180px auto" }}
              >
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
                  <div className="profileEditLabel">Required Level (0–5)</div>
                  <input
                    className="profileEditInput"
                    value={newRequiredLevel}
                    onChange={(e) => setNewRequiredLevel(e.target.value)}
                    placeholder="optional"
                  />
                </div>

                <div className="profileEditField">
                  <div className="profileEditLabel">Importance Weight</div>
                  <input
                    className="profileEditInput"
                    value={newImportanceWeight}
                    onChange={(e) => setNewImportanceWeight(e.target.value)}
                    placeholder="optional"
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
                  <div className="profileEditMuted">No required skills yet.</div>
                ) : (
                  skillEdits.map((s) => (
                    <div
                      className="profileEditSkillRow"
                      key={s.jobskill_id}
                      style={{ gridTemplateColumns: "1fr 110px 140px 110px" }}
                    >
                      <div className="profileEditSkillName">{s.skill_name}</div>

                      <input
                        className="profileEditSkillLevel"
                        value={s.required_level == null ? "" : String(s.required_level)}
                        onChange={(e) => {
                          const v = e.target.value.trim();

                          if (v === "") {
                            updateSkill(s.jobskill_id, { required_level: null });
                            return;
                          }

                          const n = Number(v);
                          if (Number.isNaN(n) || n < 0 || n > 5) return;

                          updateSkill(s.jobskill_id, { required_level: n });
                        }}
                        placeholder="Level"
                      />

                      <input
                        className="profileEditSkillLevel"
                        value={s.importance_weight == null ? "" : String(s.importance_weight)}
                        onChange={(e) => {
                          const v = e.target.value.trim();

                          if (v === "") {
                            updateSkill(s.jobskill_id, { importance_weight: null });
                            return;
                          }

                          const n = Number(v);
                          if (Number.isNaN(n)) return;

                          updateSkill(s.jobskill_id, { importance_weight: n });
                        }}
                        placeholder="Weight"
                      />

                      {canEdit && (
                        <button
                          className="profileEditRemoveBtn"
                          type="button"
                          onClick={() => removeSkill(s.jobskill_id)}
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
                onClick={() => navigate(`/jobs/${jobId}`)}
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
