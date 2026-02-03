import express from "express";
import { pool } from "../db";
import { runMLPipeline } from "../services/mlService";
import { generateExplanation } from "../services/explanationService";

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
          internal
        FROM candidate_information
        WHERE candidate_id = ANY($1)
        `,
        [candidateIds],
      );

      const internalMap = new Map<number, boolean>();
      dbRes.rows.forEach((row) => {
        internalMap.set(Number(row.candidate_id), row.internal);
      });

      recommendations = recommendations.map((r) => ({
        ...r,
        internal: internalMap.get(r.candidate_id) ?? false,
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
/*              On-demand explanation (UNCHANGED)                              */
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

export default router;
