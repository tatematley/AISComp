import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type SkillGap = {
  skill_name: string;
  required_level: number;
  proficiency_level: number;
  gap: number;
  importance_weight: number;
};

export async function generateSkillGapAnalysis(
  jobTitle: string,
  department: string,
  gapSkills: SkillGap[],
): Promise<string> {
  try {
    if (gapSkills.length === 0) {
      return "Great news — you meet all the skill requirements for this role! Focus on gaining experience to strengthen your candidacy.";
    }

    const skillsList = gapSkills
      .sort((a, b) => b.importance_weight - a.importance_weight)
      .map(
        (s) =>
          `- ${s.skill_name}: Currently Level ${s.proficiency_level}, need Level ${s.required_level} (gap: ${s.gap})`,
      )
      .join("\n");

    const prompt = `An employee wants to move into a ${jobTitle} role in the ${department} department. They have the following skill gaps:

${skillsList}

For each skill gap, provide:
1. A brief explanation of what they need to learn (1-2 sentences)
2. One specific, actionable step they can take right now
3. A real learning resource URL (use well-known platforms like Coursera, LinkedIn Learning, freeCodeCamp, MDN, the official docs, etc.)

Format your response as a clear, encouraging list. Keep it concise and practical.`;

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = message.content.find((block) => block.type === "text");
    return textContent?.type === "text"
      ? textContent.text
      : "Analysis unavailable.";
  } catch (error) {
    console.error("Error generating skill gap analysis:", error);
    return "Unable to generate analysis at this time.";
  }
}
