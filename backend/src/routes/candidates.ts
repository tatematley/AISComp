import express from "express";
import { runCandidateMLPipeline } from "../services/candidateMLService";
import { generateSkillGapAnalysis } from "../services/skillGapService";

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

// On-demand AI analysis for a specific job's skill gaps
router.get(
  "/:candidateId/job-recommendations/:jobId/ai-analysis",
  async (req, res) => {
    try {
      const candidateId = parseInt(req.params.candidateId);
      const jobId = parseInt(req.params.jobId);

      if (isNaN(candidateId) || isNaN(jobId)) {
        return res.status(400).json({ error: "Invalid candidate or job ID" });
      }

      console.log(
        `🤖 Generating AI analysis for candidate ${candidateId}, job ${jobId}...`,
      );

      // Re-run ML to get the breakdown for this job
      const mlOutput = await runCandidateMLPipeline(candidateId, 5);

      const recommendation = mlOutput.recommendations.find(
        (r: any) => r.job_id === jobId,
      );

      if (!recommendation) {
        return res
          .status(404)
          .json({ error: "Job not found in recommendations" });
      }

      // Pull out just the gap skills
      const gapSkills: SkillBreakdown[] = recommendation.breakdown.filter(
        (s: SkillBreakdown) => !s.meets_required,
      );

      // Generate AI analysis
      const analysis = await generateSkillGapAnalysis(
        recommendation.job_title,
        recommendation.department,
        gapSkills,
      );

      res.json({ analysis });
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      res.status(500).json({
        error: "Failed to generate AI analysis",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
