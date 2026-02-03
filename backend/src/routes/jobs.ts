import express from "express";
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
};

// Main recommendations endpoint - NO explanations generated upfront
router.get("/:jobId/recommendations", async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);

    if (isNaN(jobId)) {
      return res.status(400).json({ error: "Invalid job ID" });
    }

    console.log(`📊 Fetching recommendations for job ${jobId}...`);

    // Run your Python ML pipeline
    const mlOutput = await runMLPipeline(jobId, 5);

    // Return raw ML output WITHOUT explanations
    // This makes the page load instantly
    res.json(mlOutput);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({
      error: "Failed to generate recommendations",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// On-demand explanation endpoint - generates ONE explanation when clicked
router.get(
  "/:jobId/recommendations/:candidateId/explanation",
  async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const candidateId = parseInt(req.params.candidateId);

      if (isNaN(jobId) || isNaN(candidateId)) {
        return res
          .status(400)
          .json({ error: "Invalid job ID or candidate ID" });
      }

      console.log(
        `🤖 Generating explanation for candidate ${candidateId} on job ${jobId}...`,
      );

      // Run ML pipeline to get the candidate's data
      const mlOutput = await runMLPipeline(jobId, 5);

      const recommendation = mlOutput.recommendations.find(
        (r: Recommendation) => r.candidate_id === candidateId,
      );

      if (!recommendation) {
        return res
          .status(404)
          .json({ error: "Candidate not found in recommendations" });
      }

      // Generate explanation for just this one candidate
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
