import express from "express";
import { Router } from "express";
import { pool } from "../db";
import { runCandidateMLPipeline } from "../services/candidateMLService";
import {
  generateSkillGapSummary,
  generateFullUpskillPlan,
} from "../services/skillGapService";

const router = express.Router();

type SkillBreakdown = {
  skill_id: number;
  skill_name: string;
  required_level: number;
  importance_weight: number;
  proficiency_level: number;
  meets_required: boolean;
  gap: number;
};

// INTERNAL employees list (Employees.tsx)
router.get("/", async (_req, res) => {
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

router.get("/:candidateId/job-recommendations", async (req, res) => {
  try {
    const candidateId = parseInt(req.params.candidateId);

    if (isNaN(candidateId)) {
      return res.status(400).json({ error: "Invalid candidate ID" });
    }

    console.log(
      `📊 Fetching job recommendations for candidate ${candidateId}...`,
    );

    const mlOutput = await runCandidateMLPipeline(candidateId, 5);

    res.json(mlOutput);
  } catch (error) {
    console.error("Error getting job recommendations:", error);
    res.status(500).json({
      error: "Failed to generate job recommendations",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Quick summary only - FAST
router.get(
  "/:candidateId/job-recommendations/:jobId/ai-summary",
  async (req, res) => {
    try {
      const candidateId = parseInt(req.params.candidateId);
      const jobId = parseInt(req.params.jobId);

      if (isNaN(candidateId) || isNaN(jobId)) {
        return res.status(400).json({ error: "Invalid candidate or job ID" });
      }

      console.log(
        `🤖 Generating quick summary for candidate ${candidateId}, job ${jobId}...`,
      );

      const mlOutput = await runCandidateMLPipeline(candidateId, 5);

      const recommendation = mlOutput.recommendations.find(
        (r: any) => r.job_id === jobId,
      );

      if (!recommendation) {
        return res
          .status(404)
          .json({ error: "Job not found in recommendations" });
      }

      const gapSkills: SkillBreakdown[] = recommendation.breakdown.filter(
        (s: SkillBreakdown) => !s.meets_required,
      );

      const summary = await generateSkillGapSummary(
        recommendation.job_title,
        recommendation.department,
        gapSkills,
      );

      res.json({ summary });
    } catch (error) {
      console.error("Error generating summary:", error);
      res.status(500).json({
        error: "Failed to generate summary",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Full plan - only when user clicks "See Full Plan"
router.get(
  "/:candidateId/job-recommendations/:jobId/ai-full-plan",
  async (req, res) => {
    try {
      const candidateId = parseInt(req.params.candidateId);
      const jobId = parseInt(req.params.jobId);

      if (isNaN(candidateId) || isNaN(jobId)) {
        return res.status(400).json({ error: "Invalid candidate or job ID" });
      }

      console.log(
        `🤖 Generating full plan for candidate ${candidateId}, job ${jobId}...`,
      );

      const mlOutput = await runCandidateMLPipeline(candidateId, 5);

      const recommendation = mlOutput.recommendations.find(
        (r: any) => r.job_id === jobId,
      );

      if (!recommendation) {
        return res
          .status(404)
          .json({ error: "Job not found in recommendations" });
      }

      const gapSkills: SkillBreakdown[] = recommendation.breakdown.filter(
        (s: SkillBreakdown) => !s.meets_required,
      );

      const fullPlan = await generateFullUpskillPlan(
        recommendation.job_title,
        recommendation.department,
        gapSkills,
      );

      res.json({
        fullPlan,
        jobTitle: recommendation.job_title,
        department: recommendation.department,
      });
    } catch (error) {
      console.error("Error generating full plan:", error);
      res.status(500).json({
        error: "Failed to generate full plan",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
