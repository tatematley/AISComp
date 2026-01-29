// server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { Request, Response, NextFunction } from "express";
import jobRoutes from "./routes/jobs";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = Number(process.env.PORT) || 5050;

console.log("✅ server.ts starting up...");
process.on("uncaughtException", (err) => {
  console.error("❌ uncaughtException:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("❌ unhandledRejection:", reason);
});



type AuthedUser = {
  user_id: number;
  username: string;
  role: string; // "manager" | "employee"
};

const ROLES = {
  MANAGER: "manager",
  EMPLOYEE: "employee",
} as const;


type AuthedRequest = Request & { user?: AuthedUser };

function signToken(user: AuthedUser) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing");
  return jwt.sign(user, secret, { expiresIn: "2h" });
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  console.log("AUTH header:", req.headers.authorization);

  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Missing auth token" });

  try {
    const secret = process.env.JWT_SECRET!;
    const payload = jwt.verify(token, secret) as AuthedUser;
    console.log("JWT payload:", payload);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}


function requireRole(...allowed: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role?.trim().toLowerCase();
    if (!role) return res.status(401).json({ error: "Unauthorized" });
    if (!allowed.includes(role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
/* ----------------------------- Login Endpoint ----------------------------- */

app.post("/api/auth/login", async (req, res) => {
  const username = String(req.body?.username ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    // Pull user + role
    const result = await pool.query(
      `
      SELECT
        u.user_id,
        u.username,
        u.password,
        r.user_role
      FROM app_user u
      JOIN user_roles r ON r.user_role_id = u.user_role_id
      WHERE LOWER(u.username) = $1
      `,
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const row = result.rows[0];

    // Compare password
    const ok = await bcrypt.compare(password, row.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const user = {
      user_id: Number(row.user_id),
      username: String(row.username),
      role: String(row.user_role).trim().toLowerCase(),
    };


    const token = signToken(user);

    return res.json({ token, user });
  } catch (err) {
    console.error("POST /api/auth/login failed:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});


/* ----------------------------- Health + Root ----------------------------- */

app.get("/health", async (_req, res) => {
  const result = await pool.query("SELECT NOW() as now");
  res.json({ ok: true, dbTime: result.rows[0].now });
});

app.get("/", (_req, res) => {
  res.send("Right HR backend is running ✅");
});

/* ----------------------------- Employees + Applicants ----------------------------- */

// INTERNAL employees list (Employees.tsx)
app.get("/api/candidates", requireAuth, requireRole("manager", "employee"), async (_req, res) => {
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

// EXTERNAL applicants list (Applicants.tsx)
app.get("/api/applicants", requireAuth, requireRole("manager", "employee"), async (_req, res) => {
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
      ORDER BY application_date DESC NULLS LAST, candidate_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/applicants failed:", err);
    res.status(500).json({ error: "Failed to load applicants" });
  }
});

// CREATE applicant (non-internal candidate_information + optional candidate_skill)
app.post("/api/applicants", requireAuth, requireRole("manager"), async (req, res) => {
  const { candidate, skills } = req.body ?? {};
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const name = String(candidate?.name ?? "").trim();
    if (!name) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Name is required." });
    }

    // 1) Create base candidate row to generate candidate_id
    const candRes = await client.query(
      `INSERT INTO candidate DEFAULT VALUES RETURNING candidate_id`,
    );
    const candidateId = Number(candRes.rows[0].candidate_id);

    // 2) Insert candidate_information using that candidate_id
    await client.query(
      `
      INSERT INTO candidate_information
        (candidate_id, name, position, email, phone_number, internal, application_date, pronouns_id)
      VALUES
        ($1, $2, $3, $4, $5, false, $6, $7)
      `,
      [
        candidateId,
        name,
        candidate?.position ?? null,
        candidate?.email ?? null,
        candidate?.phone_number ?? null,
        candidate?.application_date ?? null,
        candidate?.pronouns_id ?? null,
      ],
    );

    // 3) Optional skills (unchanged)
    if (Array.isArray(skills) && skills.length > 0) {
      const insertedSkillIds = new Set<number>();

      for (const s of skills) {
        const skillName = String(s?.skill_name ?? "").trim();
        if (!skillName) continue;

        const skillRes = await client.query(
          `SELECT skill_id FROM skill WHERE skill_name = $1`,
          [skillName],
        );
        if (skillRes.rowCount === 0) continue;

        const skillId = Number(skillRes.rows[0].skill_id);
        if (insertedSkillIds.has(skillId)) continue;
        insertedSkillIds.add(skillId);

        const lvl =
          s?.proficiency_level === null || s?.proficiency_level === undefined
            ? null
            : Number(s.proficiency_level);

        if (lvl !== null && (Number.isNaN(lvl) || lvl < 0 || lvl > 5)) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "Skill level must be a number between 0 and 5 (or null).",
          });
        }

        await client.query(
          `
          INSERT INTO candidate_skill (candidate_id, skill_id, proficiency_level)
          VALUES ($1, $2, $3)
          `,
          [candidateId, skillId, lvl],
        );
      }
    }

    await client.query("COMMIT");
    return res.status(201).json({ candidate_id: candidateId });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("POST /api/applicants failed:", err?.message ?? err);
    return res
      .status(500)
      .json({ error: err?.message ?? "Failed to create applicant" });
  } finally {
    client.release();
  }
});

// Shared “detail” endpoint used by Employee.tsx / Applicant.tsx
app.get("/api/candidates/:id/profile", requireAuth, requireRole("manager", "employee"), async (req, res) => {
  const candidateId = Number(req.params.id);
  if (Number.isNaN(candidateId)) {
    return res.status(400).json({ error: "Invalid candidate id" });
  }

  try {
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
      LEFT JOIN pronoun p ON p.pronoun_id = ci.pronouns_id
      WHERE ci.candidate_id = $1
      `,
      [candidateId],
    );

    if (candidateRes.rowCount === 0) {
      return res.status(404).json({ error: "Candidate not found" });
    }

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
      [candidateId],
    );

    const skillsRes = await pool.query(
      `
      SELECT
        cs.candidate_skill_id,
        s.skill_name,
        cs.proficiency_level,
        sc.skill_category
      FROM candidate_skill cs
      JOIN skill s ON s.skill_id = cs.skill_id
      LEFT JOIN skill_category sc ON sc.skill_category_id = s.skill_category_id
      WHERE cs.candidate_id = $1
      ORDER BY sc.skill_category, s.skill_name
      `,
      [candidateId],
    );

    const candidate = candidateRes.rows[0];

    res.json({
      candidate,
      internal: candidate.internal ? (internalRes.rows[0] ?? null) : null,
      skills: skillsRes.rows,
    });
  } catch (err) {
    console.error("GET /api/candidates/:id/profile failed:", err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

/* ----------------------------- Profile edit meta ----------------------------- */

app.get("/api/meta/profile-edit", requireAuth, requireRole("manager"), async (_req, res) => {
  try {
    const [pronouns, departments, locations, education, skills] =
      await Promise.all([
        pool.query(
          `SELECT pronoun_id AS id, pronouns AS name FROM pronoun ORDER BY pronoun_id`,
        ),
        pool.query(
          `SELECT department_id AS id, department_name AS name FROM department ORDER BY department_name`,
        ),
        pool.query(
          `SELECT location_id AS id, location_name AS name FROM location ORDER BY location_name`,
        ),
        pool.query(
          `SELECT education_id AS id, education_level AS name FROM education ORDER BY education_id`,
        ),
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

/* ----------------------------- Employee Edit (internal only) ----------------------------- */

app.put("/api/candidates/:id/profile", requireAuth, requireRole("manager"), async (req, res) => {
  const candidateId = Number(req.params.id);
  if (Number.isNaN(candidateId)) {
    return res.status(400).json({ error: "Invalid candidate id" });
  }

  const { candidate, internal, skills } = req.body ?? {};
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const check = await client.query(
      `SELECT internal FROM candidate_information WHERE candidate_id = $1`,
      [candidateId],
    );

    if (check.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Candidate not found" });
    }

    if (check.rows[0].internal !== true) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Only internal employees can be edited here." });
    }

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
      ],
    );

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
      ],
    );

    await client.query(`DELETE FROM candidate_skill WHERE candidate_id = $1`, [
      candidateId,
    ]);

    if (Array.isArray(skills) && skills.length > 0) {
      const insertedSkillIds = new Set<number>();

      for (const s of skills) {
        const skillName = String(s?.skill_name ?? "").trim();
        if (!skillName) continue;

        const skillRes = await client.query(
          `SELECT skill_id FROM skill WHERE skill_name = $1`,
          [skillName],
        );
        if (skillRes.rowCount === 0) continue;

        const skillId = Number(skillRes.rows[0].skill_id);
        if (insertedSkillIds.has(skillId)) continue;
        insertedSkillIds.add(skillId);

        await client.query(
          `
          INSERT INTO candidate_skill (candidate_id, skill_id, proficiency_level)
          VALUES ($1, $2, $3)
          `,
          [candidateId, skillId, s?.proficiency_level ?? null],
        );
      }
    }

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error(
      "PUT /api/candidates/:id/profile failed:",
      err?.message ?? err,
    );
    res.status(500).json({ error: err?.message ?? "Failed to save profile" });
  } finally {
    client.release();
  }
});

/* ----------------------------- Applicant Edit (non-internal only) ----------------------------- */

app.put("/api/candidates/:id/applicant", requireAuth, requireRole("manager"), async (req, res) => {
  const candidateId = Number(req.params.id);
  if (Number.isNaN(candidateId)) {
    return res.status(400).json({ error: "Invalid candidate id" });
  }

  const { candidate, skills } = req.body ?? {};
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const check = await client.query(
      `SELECT internal FROM candidate_information WHERE candidate_id = $1`,
      [candidateId],
    );

    if (check.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Candidate not found" });
    }

    if (check.rows[0].internal === true) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "This is an internal employee (use the employee edit route).",
      });
    }

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
      ],
    );

    await client.query(`DELETE FROM candidate_skill WHERE candidate_id = $1`, [
      candidateId,
    ]);

    if (Array.isArray(skills) && skills.length > 0) {
      const insertedSkillIds = new Set<number>();

      for (const s of skills) {
        const skillName = String(s?.skill_name ?? "").trim();
        if (!skillName) continue;

        const skillRes = await client.query(
          `SELECT skill_id FROM skill WHERE skill_name = $1`,
          [skillName],
        );
        if (skillRes.rowCount === 0) continue;

        const skillId = Number(skillRes.rows[0].skill_id);
        if (insertedSkillIds.has(skillId)) continue;
        insertedSkillIds.add(skillId);

        await client.query(
          `
          INSERT INTO candidate_skill (candidate_id, skill_id, proficiency_level)
          VALUES ($1, $2, $3)
          `,
          [candidateId, skillId, s?.proficiency_level ?? null],
        );
      }
    }

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error(
      "PUT /api/candidates/:id/applicant failed:",
      err?.message ?? err,
    );
    res.status(500).json({ error: err?.message ?? "Failed to save applicant" });
  } finally {
    client.release();
  }
});

/* ----------------------------- Jobs ----------------------------- */

// Jobs list
app.get("/api/jobs", requireAuth, requireRole("manager", "employee"), async (_req, res) => {
  try {
    const result = await pool.query(`
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
      LEFT JOIN department d ON d.department_id = j.department
      LEFT JOIN location l   ON l.location_id = j.job_location
      LEFT JOIN job_status js ON js.job_status_id = j.job_status_id
      ORDER BY j.job_id
    `);
    res.json(result.rows);
  } catch (err: any) {
    console.error("GET /api/jobs failed:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "Failed to load jobs" });
  }
});

// Job detail
app.get("/api/jobs/:id", requireAuth, requireRole("manager", "employee"), async (req, res) => {
  const jobId = Number(req.params.id);
  if (Number.isNaN(jobId))
    return res.status(400).json({ error: "Invalid job id" });

  try {
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
      LEFT JOIN department d ON d.department_id = j.department
      LEFT JOIN location l   ON l.location_id = j.job_location
      LEFT JOIN job_status js ON js.job_status_id = j.job_status_id
      WHERE j.job_id = $1
      `,
      [jobId],
    );

    if (jobRes.rowCount === 0)
      return res.status(404).json({ error: "Job not found" });

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
      [jobId],
    );

    res.json({ job: jobRes.rows[0], skills: skillsRes.rows });
  } catch (err: any) {
    console.error("GET /api/jobs/:id failed:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "Failed to load job" });
  }
});

// CREATE employee (internal candidate_information + candidate internal row + optional candidate_skill)
// CREATE employee (internal candidate_information + candidate internal row + optional candidate_skill)
app.post("/api/employees", requireAuth, requireRole("manager"), async (req, res) => {
  const { candidate, internal, skills } = req.body ?? {};
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const name = String(candidate?.name ?? "").trim();
    if (!name) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Name is required." });
    }

    // 1) create candidate row FIRST to generate candidate_id
    const candRes = await client.query(
      `
      INSERT INTO candidate
        (currentrole, years_exp, availability_hours, start_date, department_id, location_id, education_level_id)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING candidate_id
      `,
      [
        internal?.currentrole ?? null,
        internal?.years_exp ?? null,
        internal?.availability_hours ?? null,
        internal?.start_date ?? null,
        internal?.department_id ?? null,
        internal?.location_id ?? null,
        internal?.education_level_id ?? null,
      ],
    );

    const candidateId = Number(candRes.rows[0].candidate_id);

    // 2) insert candidate_information using candidate_id
    await client.query(
      `
      INSERT INTO candidate_information
        (candidate_id, name, position, email, phone_number, internal, application_date, pronouns_id)
      VALUES
        ($1, $2, $3, $4, $5, true, $6, $7)
      `,
      [
        candidateId,
        name,
        candidate?.position ?? null,
        candidate?.email ?? null,
        candidate?.phone_number ?? null,
        candidate?.application_date ?? null,
        candidate?.pronouns_id ?? null,
      ],
    );

    // 3) optional skills (unchanged)
    if (Array.isArray(skills) && skills.length > 0) {
      const insertedSkillIds = new Set<number>();

      for (const s of skills) {
        const skillName = String(s?.skill_name ?? "").trim();
        if (!skillName) continue;

        const skillRes = await client.query(
          `SELECT skill_id FROM skill WHERE skill_name = $1`,
          [skillName],
        );
        if (skillRes.rowCount === 0) continue;

        const skillId = Number(skillRes.rows[0].skill_id);
        if (insertedSkillIds.has(skillId)) continue;
        insertedSkillIds.add(skillId);

        const lvl =
          s?.proficiency_level === null || s?.proficiency_level === undefined
            ? null
            : Number(s.proficiency_level);

        if (lvl !== null && (Number.isNaN(lvl) || lvl < 0 || lvl > 5)) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "Skill level must be a number between 0 and 5 (or null).",
          });
        }

        await client.query(
          `
          INSERT INTO candidate_skill (candidate_id, skill_id, proficiency_level)
          VALUES ($1, $2, $3)
          `,
          [candidateId, skillId, lvl],
        );
      }
    }

    await client.query("COMMIT");
    return res.status(201).json({ candidate_id: candidateId });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("POST /api/employees failed:", err?.message ?? err);
    return res
      .status(500)
      .json({ error: err?.message ?? "Failed to create employee" });
  } finally {
    client.release();
  }
});

// ✅ FIXED: meta job-edit education uses `education` table
app.get("/api/meta/job-edit", requireAuth, requireRole("manager"), async (_req, res) => {
  try {
    const [jobStatuses, departments, locations, education, skills] =
      await Promise.all([
        pool.query(
          `SELECT job_status_id AS id, job_status AS name FROM job_status ORDER BY job_status`,
        ),
        pool.query(
          `SELECT department_id AS id, department_name AS name FROM department ORDER BY department_name`,
        ),
        pool.query(
          `SELECT location_id AS id, location_name AS name FROM location ORDER BY location_name`,
        ),
        pool.query(
          `SELECT education_id AS id, education_level AS name FROM education ORDER BY education_id`,
        ),
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
      job_statuses: jobStatuses.rows,
      departments: departments.rows,
      locations: locations.rows,
      education: education.rows,
      skills: skills.rows,
    });
  } catch (err: any) {
    console.error("GET /api/meta/job-edit failed:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "Failed to load dropdowns" });
  }
});

// JobEdit page data
app.get("/api/jobs/:id/edit", requireAuth, requireRole("manager"), async (req, res) => {
  const jobId = Number(req.params.id);
  if (Number.isNaN(jobId))
    return res.status(400).json({ error: "Invalid job id" });

  try {
    const jobRes = await pool.query(
      `
      SELECT
        j.job_id,
        j.job_title,
        j.job_category,
        j.job_description,
        d.department_name AS department,
        js.job_status_id,
        j.min_years_experience,
        j.education_req,
        j.job_salary,
        l.location_name AS job_location,
        j.work_status,
        j.start_date
      FROM job j
      LEFT JOIN department d ON d.department_id = j.department
      LEFT JOIN location l ON l.location_id = j.job_location
      LEFT JOIN job_status js ON js.job_status_id = j.job_status_id
      WHERE j.job_id = $1
      `,
      [jobId],
    );

    if (jobRes.rowCount === 0)
      return res.status(404).json({ error: "Job not found" });

    const skillsRes = await pool.query(
      `
      SELECT
        jsk.jobskill_id,
        jsk.skill_id,
        s.skill_name,
        jsk.required_level,
        jsk.importance_weight
      FROM job_skill jsk
      JOIN skill s ON s.skill_id = jsk.skill_id
      WHERE jsk.job_id = $1
      ORDER BY s.skill_name
      `,
      [jobId],
    );

    res.json({ job: jobRes.rows[0], skills: skillsRes.rows });
  } catch (err: any) {
    console.error("GET /api/jobs/:id/edit failed:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "Failed to load job" });
  }
});

// CREATE job + required skills
// CREATE job + required skills
app.post("/api/jobs", requireAuth, requireRole("manager"), async (req, res) => {
  const { job, skills } = req.body ?? {};
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Look up department/location/education IDs from names
    const depName = job?.department ?? null;
    const locName = job?.job_location ?? null;
    const eduName = job?.education_req ?? null;

    let departmentId: number | null = null;
    let locationId: number | null = null;
    let educationId: number | null = null;

    if (depName) {
      const depRes = await client.query(
        `SELECT department_id FROM department WHERE department_name = $1`,
        [depName],
      );
      departmentId = depRes.rowCount
        ? Number(depRes.rows[0].department_id)
        : null;
    }

    if (locName) {
      const locRes = await client.query(
        `SELECT location_id FROM location WHERE location_name = $1`,
        [locName],
      );
      locationId = locRes.rowCount ? Number(locRes.rows[0].location_id) : null;
    }

    // ✅ education: "Bachelor's Degree" -> education.education_id
    if (eduName) {
      const eduRes = await client.query(
        `SELECT education_id FROM education WHERE education_level = $1`,
        [eduName],
      );
      educationId = eduRes.rowCount
        ? Number(eduRes.rows[0].education_id)
        : null;
    }

    // Insert job
    const insertRes = await client.query(
      `
      INSERT INTO job
        (job_title, job_category, job_description, work_status, department, job_location,
         job_status_id, min_years_experience, education_req, job_salary, start_date)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING job_id
      `,
      [
        job?.job_title ?? null,
        job?.job_category ?? null,
        job?.job_description ?? null,
        job?.work_status ?? null,
        departmentId,
        locationId,
        job?.job_status_id ?? null,
        job?.min_years_experience ?? null,
        educationId, // ✅ CHANGED (was job?.education_req)
        job?.job_salary ?? null,
        job?.start_date ?? null,
      ],
    );

    const jobId = Number(insertRes.rows[0].job_id);

    // Insert required skills (optional)
    if (Array.isArray(skills) && skills.length > 0) {
      const insertedSkillIds = new Set<number>();

      for (const s of skills) {
        const skillId = Number(s?.skill_id);
        if (!skillId || Number.isNaN(skillId)) continue;
        if (insertedSkillIds.has(skillId)) continue;
        insertedSkillIds.add(skillId);

        const reqLevel =
          s?.required_level === null || s?.required_level === undefined
            ? null
            : Number(s.required_level);

        if (
          reqLevel !== null &&
          (Number.isNaN(reqLevel) || reqLevel < 0 || reqLevel > 5)
        ) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "required_level must be a number between 0 and 5 (or null).",
          });
        }

        const weight =
          s?.importance_weight === null || s?.importance_weight === undefined
            ? null
            : Number(s.importance_weight);

        if (weight !== null && Number.isNaN(weight)) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "importance_weight must be a number (or null).",
          });
        }

        await client.query(
          `
          INSERT INTO job_skill (job_id, skill_id, required_level, importance_weight)
          VALUES ($1, $2, $3, $4)
          `,
          [jobId, skillId, reqLevel, weight],
        );
      }
    }

    await client.query("COMMIT");
    return res.status(201).json({ job_id: jobId });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("POST /api/jobs failed:", err?.message ?? err);
    return res
      .status(500)
      .json({ error: err?.message ?? "Failed to create job" });
  } finally {
    client.release();
  }
});

// Update job + required skills
app.put("/api/jobs/:id", requireAuth, requireRole("manager"), async (req, res) => {
  const jobId = Number(req.params.id);
  if (Number.isNaN(jobId))
    return res.status(400).json({ error: "Invalid job id" });

  const { job, skills } = req.body ?? {};
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const check = await client.query(
      `SELECT job_id FROM job WHERE job_id = $1`,
      [jobId],
    );
    if (check.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Job not found" });
    }

    const depName = job?.department ?? null;
    const locName = job?.job_location ?? null;

    let departmentId: number | null = null;
    let locationId: number | null = null;

    if (depName) {
      const depRes = await client.query(
        `SELECT department_id FROM department WHERE department_name = $1`,
        [depName],
      );
      departmentId = depRes.rowCount
        ? Number(depRes.rows[0].department_id)
        : null;
    }

    if (locName) {
      const locRes = await client.query(
        `SELECT location_id FROM location WHERE location_name = $1`,
        [locName],
      );
      locationId = locRes.rowCount ? Number(locRes.rows[0].location_id) : null;
    }

    await client.query(
      `
      UPDATE job
      SET
        job_title = $2,
        job_category = $3,
        job_description = $4,
        work_status = $5,
        department = $6,
        job_location = $7,
        job_status_id = $8,
        min_years_experience = $9,
        education_req = $10,
        job_salary = $11,
        start_date = $12
      WHERE job_id = $1
      `,
      [
        jobId,
        job?.job_title ?? null,
        job?.job_category ?? null,
        job?.job_description ?? null,
        job?.work_status ?? null,
        departmentId,
        locationId,
        job?.job_status_id ?? null,
        job?.min_years_experience ?? null,
        job?.education_req ?? null,
        job?.job_salary ?? null,
        job?.start_date ?? null,
      ],
    );

    await client.query(`DELETE FROM job_skill WHERE job_id = $1`, [jobId]);

    if (Array.isArray(skills) && skills.length > 0) {
      const insertedSkillIds = new Set<number>();

      for (const s of skills) {
        const skillId = Number(s?.skill_id);
        if (!skillId || Number.isNaN(skillId)) continue;

        if (insertedSkillIds.has(skillId)) continue;
        insertedSkillIds.add(skillId);

        const reqLevel =
          s?.required_level === null || s?.required_level === undefined
            ? null
            : Number(s.required_level);

        if (
          reqLevel !== null &&
          (Number.isNaN(reqLevel) || reqLevel < 0 || reqLevel > 5)
        ) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "required_level must be a number between 0 and 5 (or null).",
          });
        }

        const weight =
          s?.importance_weight === null || s?.importance_weight === undefined
            ? null
            : Number(s.importance_weight);

        if (weight !== null && Number.isNaN(weight)) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "importance_weight must be a number (or null).",
          });
        }

        await client.query(
          `
          INSERT INTO job_skill (job_id, skill_id, required_level, importance_weight)
          VALUES ($1, $2, $3, $4)
          `,
          [jobId, skillId, reqLevel, weight],
        );
      }
    }

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("PUT /api/jobs/:id failed:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "Failed to save job" });
  } finally {
    client.release();
  }
});

// Delete job + required skills
app.delete("/api/jobs/:id", requireAuth, requireRole("manager"), async (req, res) => {
  const jobId = Number(req.params.id);
  if (Number.isNaN(jobId))
    return res.status(400).json({ error: "Invalid job id" });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`DELETE FROM job_skill WHERE job_id = $1`, [jobId]);

    const delJob = await client.query(
      `DELETE FROM job WHERE job_id = $1 RETURNING job_id`,
      [jobId],
    );

    if (delJob.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Job not found" });
    }

    await client.query("COMMIT");
    res.sendStatus(204);
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("DELETE /api/jobs/:id failed:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "Failed to delete job" });
  } finally {
    client.release();
  }
});


app.delete("/api/employees/:id", requireAuth, requireRole("manager"), async (req, res) => {
  const candidateId = Number(req.params.id);
  if (Number.isNaN(candidateId)) {
    return res.status(400).json({ error: "Invalid candidate id" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // optional: ensure it's an employee (internal = true)
    const check = await client.query(
      `SELECT internal FROM candidate_information WHERE candidate_id = $1`,
      [candidateId],
    );

    if (check.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Employee not found" });
    }

    if (check.rows[0].internal !== true) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "That candidate is not an employee." });
    }

    await client.query(`DELETE FROM candidate_skill WHERE candidate_id = $1`, [
      candidateId,
    ]);
    await client.query(
      `DELETE FROM candidate_information WHERE candidate_id = $1`,
      [candidateId],
    );

    const delCandidate = await client.query(
      `DELETE FROM candidate WHERE candidate_id = $1 RETURNING candidate_id`,
      [candidateId],
    );

    if (delCandidate.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Employee not found" });
    }

    await client.query("COMMIT");
    return res.sendStatus(204);
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("DELETE /api/employees/:id failed:", err?.message ?? err);
    return res
      .status(500)
      .json({ error: err?.message ?? "Failed to delete employee" });
  } finally {
    client.release();
  }
});


app.delete("/api/applicants/:id", requireAuth, requireRole("manager"), async (req, res) => {
  const candidateId = Number(req.params.id);
  if (Number.isNaN(candidateId)) {
    return res.status(400).json({ error: "Invalid candidate id" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // optional: ensure it's an applicant (internal = false)
    const check = await client.query(
      `SELECT internal FROM candidate_information WHERE candidate_id = $1`,
      [candidateId],
    );

    if (check.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Applicant not found" });
    }

    if (check.rows[0].internal !== false) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "That candidate is not an applicant." });
    }

    await client.query(`DELETE FROM candidate_skill WHERE candidate_id = $1`, [
      candidateId,
    ]);
    await client.query(
      `DELETE FROM candidate_information WHERE candidate_id = $1`,
      [candidateId],
    );

    const delCandidate = await client.query(
      `DELETE FROM candidate WHERE candidate_id = $1 RETURNING candidate_id`,
      [candidateId],
    );

    if (delCandidate.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Applicant not found" });
    }

    await client.query("COMMIT");
    return res.sendStatus(204);
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("DELETE /api/applicants/:id failed:", err?.message ?? err);
    return res
      .status(500)
      .json({ error: err?.message ?? "Failed to delete applicant" });
  } finally {
    client.release();
  }
});

app.use("/api/jobs", jobRoutes);

/* ----------------------------- Start ----------------------------- */

console.log("✅ about to listen, port =", port);


app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
