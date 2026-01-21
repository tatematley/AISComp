import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  const result = await pool.query("SELECT NOW() as now");
  res.json({ ok: true, dbTime: result.rows[0].now });
});

const port = Number(process.env.PORT) || 5050;

// ROUTES 

app.get("/", (_req, res) => {
  res.send("Right HR backend is running ✅");
});

// employees.tsx Route — INTERNAL ONLY
app.get("/api/candidates", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        candidate_id,
        name,
        position,
        email,
        phone_number
      FROM candidate_information
      WHERE internal = true
      ORDER BY candidate_id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/candidates failed:", err);
    res.status(500).json({ error: "Failed to load candidates" });
  }
});


// Jobs.tsx Route 
app.get("/api/jobs", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        j.job_id,
        j.job_title,
        j.job_category,
        j.job_description,
        j.work_status,

        -- readable values
        d.department_name AS department,
        l.location_name   AS job_location,
        js.job_status     AS job_status,

        -- keep id too if you still want it (optional)
        j.job_status_id

      FROM job j
      LEFT JOIN department d
        ON d.department_id = j.department
      LEFT JOIN location l
        ON l.location_id = j.job_location
      LEFT JOIN job_status js
        ON js.job_status_id = j.job_status_id

      ORDER BY j.job_id;
    `);

    res.json(result.rows);
  } catch (err: any) {
    console.error("GET /api/jobs failed:", err?.message);
    res.status(500).json({ error: err?.message ?? "Failed to load jobs" });
  }
});

// GET single job detail + required skills
app.get("/api/jobs/:id", async (req, res) => {
  const jobId = Number(req.params.id);

  if (Number.isNaN(jobId)) {
    return res.status(400).json({ error: "Invalid job id" });
  }

  try {
    // Job info (same shape/joins as your /api/jobs list)
    const jobRes = await pool.query(
      `
      SELECT
        j.job_id,
        j.job_title,
        j.job_category,
        j.job_description,
        j.work_status,

        d.department_name AS department,
        l.location_name   AS job_location,
        js.job_status     AS job_status,

        j.job_status_id
      FROM job j
      LEFT JOIN department d
        ON d.department_id = j.department
      LEFT JOIN location l
        ON l.location_id = j.job_location
      LEFT JOIN job_status js
        ON js.job_status_id = j.job_status_id
      WHERE j.job_id = $1
      `,
      [jobId]
    );

    if (jobRes.rowCount === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Required skills for the job
    // NOTE: This assumes you have a join table named job_skill with:
    // jobskill_id, job_id, skill_id, required_level

    const skillsRes = await pool.query(
      `
      SELECT
        jsk.jobskill_id,
        s.skill_name,
        jsk.required_level,
        sc.skill_category
      FROM job_skill jsk
      JOIN skill s ON s.skill_id = jsk.skill_id
      LEFT JOIN skill_category sc ON sc.skill_category_id = s.skill_category_id
      WHERE jsk.job_id = $1
      ORDER BY sc.skill_category, s.skill_name
      `,
      [jobId]
    );

    res.json({
      job: jobRes.rows[0],
      skills: skillsRes.rows,
    });
  } catch (err: any) {
    console.error("GET /api/jobs/:id failed:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "Failed to load job" });
  }
});


// applicants.tsx Route
app.get("/api/applicants", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        candidate_id,
        name,
        position,
        email,
        phone_number,
        application_date
      FROM candidate_information
      WHERE internal = false
      ORDER BY application_date DESC NULLS LAST, candidate_id;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/applicants failed:", err);
    res.status(500).json({ error: "Failed to load applicants" });
  }
});


// GET single candidate profile
app.get("/api/candidates/:id/profile", async (req, res) => {
  const candidateId = Number(req.params.id);

  if (Number.isNaN(candidateId)) {
    return res.status(400).json({ error: "Invalid candidate id" });
  }

  try {
    // Candidate info (public-facing core profile info)
    const candidateRes = await pool.query(
      `
      SELECT
        ci.candidate_id,
        ci.name,
        ci.position,
        ci.email,
        ci.phone_number,
        ci.internal,
        ci.application_date,
        p.pronouns
      FROM candidate_information ci
      LEFT JOIN pronoun p
        ON p.pronoun_id = ci.pronouns_id
      WHERE ci.candidate_id = $1
      `,
      [candidateId]
    );

    if (candidateRes.rowCount === 0) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // Internal candidate info (comes from candidate table in YOUR DB)
    const internalRes = await pool.query(
      `
      SELECT
        c.currentrole,
        c.years_exp,
        c.availability_hours,
        c.start_date,
        d.department_name,
        l.location_name,
        e.education_level
      FROM candidate c
      LEFT JOIN department d ON d.department_id = c.department_id
      LEFT JOIN location l ON l.location_id = c.location_id
      LEFT JOIN education e ON e.education_id = c.education_level_id
      WHERE c.candidate_id = $1
      `,
      [candidateId]
    );

    // Skills
    const skillsRes = await pool.query(
      `
      SELECT
        cs.candidate_skill_id,
        s.skill_name,
        cs.proficiency_level,
        sc.skill_category
      FROM candidate_skill cs
      JOIN skill s ON s.skill_id = cs.skill_id
      LEFT JOIN skill_category sc
        ON sc.skill_category_id = s.skill_category_id
      WHERE cs.candidate_id = $1
      ORDER BY sc.skill_category, s.skill_name
      `,
      [candidateId]
    );

    const candidate = candidateRes.rows[0];

    res.json({
      candidate,
      internal: candidate.internal ? (internalRes.rows[0] ?? null) : null,
      skills: skillsRes.rows,
    });
  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});




// EDIT ROUTES // 

// dropdown options for ProfileEdit (one request)
app.get("/api/meta/profile-edit", async (_req, res) => {
  try {
    const [pronouns, departments, locations, education, skills] = await Promise.all([
      pool.query(`SELECT pronoun_id AS id, pronouns AS name FROM pronoun ORDER BY pronoun_id`),
      pool.query(`SELECT department_id AS id, department_name AS name FROM department ORDER BY department_name`),
      pool.query(`SELECT location_id AS id, location_name AS name FROM location ORDER BY location_name`),
      pool.query(`SELECT education_id AS id, education_level AS name FROM education ORDER BY education_id`),
      pool.query(`
        SELECT
          s.skill_id AS id,
          s.skill_name AS name,
          sc.skill_category AS category
        FROM skill s
        LEFT JOIN skill_category sc ON sc.skill_category_id = s.skill_category_id
        ORDER BY sc.skill_category NULLS LAST, s.skill_name
      `),
    ]);

    res.json({
      pronouns: pronouns.rows,
      departments: departments.rows,
      locations: locations.rows,
      education: education.rows,
      skills: skills.rows,
    });
  } catch (err) {
    console.error("GET /api/meta/profile-edit failed:", err);
    res.status(500).json({ error: "Failed to load dropdowns" });
  }
});

app.put("/api/candidates/:id/profile", async (req, res) => {
  const candidateId = Number(req.params.id);
  if (Number.isNaN(candidateId)) {
    return res.status(400).json({ error: "Invalid candidate id" });
  }

  const { candidate, internal, skills } = req.body ?? {};

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Ensure candidate exists + is internal
    const check = await client.query(
      `SELECT internal FROM candidate_information WHERE candidate_id = $1`,
      [candidateId]
    );

    if (check.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Candidate not found" });
    }
    if (check.rows[0].internal !== true) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Only internal employees can be edited here." });
    }

    // Update candidate_information (safe fields only)
    await client.query(
      `
      UPDATE candidate_information
      SET
        position = $2,
        email = $3,
        phone_number = $4,
        application_date = $5,
        pronouns_id = $6
      WHERE candidate_id = $1
      `,
      [
        candidateId,
        candidate?.position ?? null,
        candidate?.email ?? null,
        candidate?.phone_number ?? null,
        candidate?.application_date ?? null,
        candidate?.pronouns_id ?? null,
      ]
    );

    // Update internal candidate table (candidate)
    await client.query(
      `
      UPDATE candidate
      SET
        currentrole = $2,
        years_exp = $3,
        availability_hours = $4,
        start_date = $5,
        department_id = $6,
        location_id = $7,
        education_level_id = $8
      WHERE candidate_id = $1
      `,
      [
        candidateId,
        internal?.currentrole ?? null,
        internal?.years_exp ?? null,
        internal?.availability_hours ?? null,
        internal?.start_date ?? null,
        internal?.department_id ?? null,
        internal?.location_id ?? null,
        internal?.education_level_id ?? null,
      ]
    );

    // Skills: delete + reinsert based on skill_name
    // (simple + reliable for now)
    await client.query(`DELETE FROM candidate_skill WHERE candidate_id = $1`, [candidateId]);

    if (Array.isArray(skills) && skills.length > 0) {
      for (const s of skills) {
        const skillName = s?.skill_name;
        if (!skillName) continue;

        const skillIdRes = await client.query(
          `SELECT skill_id FROM skill WHERE skill_name = $1`,
          [skillName]
        );
        if (skillIdRes.rowCount === 0) continue;

        await client.query(
          `
          INSERT INTO candidate_skill (candidate_id, skill_id, proficiency_level)
          VALUES ($1, $2, $3)
          `,
          [candidateId, skillIdRes.rows[0].skill_id, s?.proficiency_level ?? null]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("PUT /api/candidates/:id/profile failed:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "Failed to save profile" });
  } finally {
    client.release();
  }
});



app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
