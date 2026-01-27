import express from "express";
import { generateAllExplanations } from "../services/explanationService";
import { runMLPipeline } from "../services/mlService";

const router = express.Router();

/**
 * GET /api/jobs/:jobId/recommendations
 * Returns job recommendations with AI explanations
 */
router.get("/:jobId/recommendations", async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);

    if (isNaN(jobId)) {
      return res.status(400).json({ error: "Invalid job ID" });
    }

    // Run your existing ML pipeline
    // This returns the JSON structure you showed me
    const mlOutput = await runMLPipeline(jobId);

    // Generate explanations for all recommendations
    const recommendationsWithExplanations = await generateAllExplanations(
      mlOutput.recommendations,
      mlOutput.job,
    );

    // Return the enhanced data
    res.json({
      ...mlOutput,
      recommendations: recommendationsWithExplanations,
    });
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

export default router;
