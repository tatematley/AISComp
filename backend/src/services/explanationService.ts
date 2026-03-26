import Anthropic from "@anthropic-ai/sdk";
import { editWithOpenAI } from "./llmEditorService";

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
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const sortedSkills = [...recommendation.breakdown].sort(
      (a, b) => b.importance_weight - a.importance_weight,
    );

    const strengths = sortedSkills
      .filter((s) => s.meets_required)
      .slice(0, 3)
      .map((s) => s.skill_name);

    const gaps = sortedSkills
      .filter((s) => !s.meets_required)
      .slice(0, 2)
      .map((s) => s.skill_name);

    const draftPrompt = `Rank #${recommendation.rank} candidate (${recommendation.current_role}) for ${jobData.job_title}. ${Math.round(recommendation.match_score * 100)}% match.
Strengths: ${strengths.join(", ") || "None"}
Gaps: ${gaps.join(", ") || "None"}
Write 2 sentences explaining why they're ranked #${recommendation.rank}.
Base the explanation only on job-relevant qualifications, skills, experience, and match data provided here.
Before finalizing, review the explanation for bias or potentially biased language and remove any direct or indirect references, assumptions, or implications related to protected characteristics, including gender, race, ethnicity, age, disability, religion, sexual orientation, nationality, or other non-job-related personal traits.
Do not infer demographic information or use proxies for protected characteristics.
If any phrasing could sound biased, discriminatory, stereotypical, or unfair, rewrite it to be neutral, job-related, and evidence-based.`;

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 150, // ← Increased from 100 to 150
      messages: [{ role: "user", content: draftPrompt }],
    });

    const textContent = message.content.find((block) => block.type === "text");
    const draft =
      textContent?.type === "text" ? textContent.text : "Explanation unavailable";

    return await editWithOpenAI({
      contentType: "recommendation explanation",
      originalPrompt: draftPrompt,
      draft,
    });
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

  // Generate all at once (parallel)
  const explanationPromises = recommendations.map(async (rec) => {
    const explanation = await generateExplanation(rec, jobData);
    return {
      ...rec,
      explanation,
    };
  });

  const withExplanations = await Promise.all(explanationPromises);

  console.log(`✅ AI explanations generated successfully`);
  return withExplanations;
}
