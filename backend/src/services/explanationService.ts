import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type SkillBreakdown = {
  skill_name: string;
  required_level: number;
  proficiency_level: number;
  meets_required: boolean;
  importance_weight: number;
  gap: number;
};

type Recommendation = {
  rank: number;
  candidate_id: number;
  current_role: string;
  match_score: number;
  skills_met: number;
  skills_required: number;
  breakdown: SkillBreakdown[];
};

type JobData = {
  job_id: number;
  job_title: string;
  department: string;
};

export async function generateExplanation(
  recommendation: Recommendation,
  jobData: JobData,
): Promise<string> {
  try {
    // Sort skills by importance to identify key factors
    const sortedSkills = [...recommendation.breakdown].sort(
      (a, b) => b.importance_weight - a.importance_weight,
    );

    // Get top 3-4 most important skills
    const topSkills = sortedSkills.slice(0, 4);

    // Identify strengths (skills they have that are important)
    const strengths = topSkills.filter((s) => s.meets_required).slice(0, 3);

    // Identify gaps (important skills they lack)
    const gaps = topSkills.filter((s) => !s.meets_required).slice(0, 2);

    // Build human-readable summary
    const strengthsText =
      strengths.length > 0
        ? strengths
            .map((s) => `${s.skill_name} (level ${s.proficiency_level})`)
            .join(", ")
        : "None";

    const gapsText =
      gaps.length > 0 ? gaps.map((s) => s.skill_name).join(", ") : "None";

    // Create prompt for Claude
    const prompt = `You are an HR assistant explaining why a candidate was recommended for a job.

Job: ${jobData.job_title}
Department: ${jobData.department}
Candidate: ${recommendation.current_role} (ID: ${recommendation.candidate_id})
Rank: #${recommendation.rank} out of 5 candidates
Match Score: ${(recommendation.match_score * 100).toFixed(0)}%
Skills Met: ${recommendation.skills_met}/${recommendation.skills_required}

Key Strengths: ${strengthsText}
Notable Gaps: ${gapsText}

Write a clear, professional 2-3 sentence explanation for an HR manager about why this candidate was recommended and ranked #${recommendation.rank}. Be specific about their matching skills. If they have gaps, mention them constructively. Keep it concise and actionable.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const textContent = message.content.find((block) => block.type === "text");
    return textContent?.type === "text"
      ? textContent.text
      : "Explanation unavailable";
  } catch (error) {
    console.error("Error generating explanation:", error);
    return "Unable to generate explanation at this time.";
  }
}

export async function generateAllExplanations(
  recommendations: Recommendation[],
  jobData: JobData,
): Promise<Recommendation[]> {
  console.log(
    `🤖 Generating AI explanations for ${recommendations.length} candidates in parallel...`,
  );

  // Generate ALL explanations at the same time (parallel)
  const explanationPromises = recommendations.map(async (rec) => {
    const explanation = await generateExplanation(rec, jobData);
    return {
      ...rec,
      explanation,
    };
  });

  // Wait for all to complete
  const withExplanations = await Promise.all(explanationPromises);

  console.log(`✅ AI explanations generated successfully`);
  return withExplanations;
}
