import express from "express";
import { pool } from "../db";
import { runMLPipeline } from "../services/mlService";
import { generateExplanation } from "../services/explanationService";
import {
  generateSkillGapSummary,
  generateFullUpskillPlan,
} from "../services/skillGapService";

const router = express.Router();

// Type definition for recommendations
type Recommendation = {
  candidate_id: number;
  rank: number;
  current_role: string;
  match_score: number;
  skills_met: number;
  skills_required: number;
  breakdown: any[];
  internal?: boolean;
  name?: string | null;
};

/* -------------------------------------------------------------------------- */
/*                    Job Recommendations                                      */
/* -------------------------------------------------------------------------- */

router.get("/:jobId/recommendations", async (req, res) => {
  try {
    const jobId = Number(req.params.jobId);
    const origin = String(req.query.origin ?? "all").toLowerCase();

    if (Number.isNaN(jobId)) {
      return res.status(400).json({ error: "Invalid job ID" });
    }

    if (!["all", "internal", "external"].includes(origin)) {
      return res.status(400).json({ error: "Invalid origin filter" });
    }

    console.log(
      `📊 Fetching recommendations for job ${jobId} (origin=${origin})...`,
    );

    // Run Python ML pipeline (get full ranked list, NOT pre-filtered)
    const mlOutput = await runMLPipeline(jobId, 15);

    let recommendations: Recommendation[] = mlOutput.recommendations ?? [];

    /* ------------------------- Enrich with internal flag ------------------------- */

    if (recommendations.length > 0) {
      const candidateIds = recommendations.map((r) => r.candidate_id);

      const dbRes = await pool.query(
        `
        SELECT
          candidate_id,
          internal,
          name
        FROM candidate_information
        WHERE candidate_id = ANY($1)
        `,
        [candidateIds],
      );

      const candidateInfoMap = new Map<
        number,
        { internal: boolean; name: string | null }
      >();
      dbRes.rows.forEach((row) => {
        candidateInfoMap.set(Number(row.candidate_id), {
          internal: row.internal,
          name: row.name,
        });
      });

      recommendations = recommendations.map((r) => ({
        ...r,
        internal: candidateInfoMap.get(r.candidate_id)?.internal ?? false,
        name: candidateInfoMap.get(r.candidate_id)?.name ?? null,
      }));
    }

    /* ------------------------- Apply origin filter BEFORE slicing ------------------------- */

    if (origin === "internal") {
      recommendations = recommendations.filter((r) => r.internal === true);
    } else if (origin === "external") {
      recommendations = recommendations.filter((r) => r.internal === false);
    }

    // Take top 5 *after* filtering
    recommendations = recommendations.slice(0, 5);

    // Return same ML shape, just filtered recommendations
    res.json({
      ...mlOutput,
      recommendations,
    });
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({
      error: "Failed to generate recommendations",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/* -------------------------------------------------------------------------- */
/*              On-demand explanation                                          */
/* -------------------------------------------------------------------------- */

router.get(
  "/:jobId/recommendations/:candidateId/explanation",
  async (req, res) => {
    try {
      const jobId = Number(req.params.jobId);
      const candidateId = Number(req.params.candidateId);

      if (Number.isNaN(jobId) || Number.isNaN(candidateId)) {
        return res
          .status(400)
          .json({ error: "Invalid job ID or candidate ID" });
      }

      console.log(
        `🤖 Generating explanation for candidate ${candidateId} on job ${jobId}...`,
      );

      const mlOutput = await runMLPipeline(jobId);

      const recommendation = mlOutput.recommendations.find(
        (r: Recommendation) => r.candidate_id === candidateId,
      );

      if (!recommendation) {
        return res
          .status(404)
          .json({ error: "Candidate not found in recommendations" });
      }

      const explanation = await generateExplanation(
        recommendation,
        mlOutput.job,
      );

      res.json({ explanation });
    } catch (error) {
      console.error("Error generating explanation:", error);
      res.status(500).json({
        error: "Failed to generate explanation",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/* -------------------------------------------------------------------------- */
/*                    Skill Gap Analysis                                       */
/* -------------------------------------------------------------------------- */

router.get("/:jobId/candidates/:candidateId/skill-gap", async (req, res) => {
  try {
    const jobId = Number(req.params.jobId);
    const candidateId = Number(req.params.candidateId);
    const detailed = req.query.detailed === "true";

    if (Number.isNaN(jobId) || Number.isNaN(candidateId)) {
      return res.status(400).json({ error: "Invalid job ID or candidate ID" });
    }

    console.log(
      `🎯 Analyzing skill gaps for candidate ${candidateId} on job ${jobId}...`,
    );

    // Fetch job info
    const jobRes = await pool.query(
      `SELECT job_title, d.department_name
       FROM job j
       LEFT JOIN department d ON d.department_id = j.department
       WHERE j.job_id = $1`,
      [jobId],
    );

    if (jobRes.rowCount === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const { job_title, department_name } = jobRes.rows[0];

    // Fetch skill gaps
    const gapsRes = await pool.query(
      `SELECT 
         s.skill_name,
         js.required_level,
         COALESCE(cs.proficiency_level, 0) as proficiency_level,
         (js.required_level - COALESCE(cs.proficiency_level, 0)) as gap,
         COALESCE(js.importance_weight, 1.0) as importance_weight
       FROM job_skill js
       JOIN skill s ON s.skill_id = js.skill_id
       LEFT JOIN candidate_skill cs ON cs.skill_id = js.skill_id AND cs.candidate_id = $1
       WHERE js.job_id = $2
         AND js.required_level > COALESCE(cs.proficiency_level, 0)
       ORDER BY (js.required_level - COALESCE(cs.proficiency_level, 0)) DESC,
                js.importance_weight DESC`,
      [candidateId, jobId],
    );

    const gapSkills = gapsRes.rows;

    // Generate analysis
    let analysis: string;

    if (detailed) {
      console.log("📚 Generating detailed upskilling plan...");
      analysis = await generateFullUpskillPlan(
        job_title,
        department_name,
        gapSkills,
      );
    } else {
      console.log("📝 Generating quick summary...");
      analysis = await generateSkillGapSummary(
        job_title,
        department_name,
        gapSkills,
      );
    }

    res.json({
      analysis,
      gap_count: gapSkills.length,
      gaps: gapSkills,
    });
  } catch (error) {
    console.error("❌ Error in skill gap analysis:", error);
    res.status(500).json({
      error: "Unable to generate analysis at this time.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
