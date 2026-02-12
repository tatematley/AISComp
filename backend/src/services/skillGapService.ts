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

// FAST - Just summary (2-3 seconds)
export async function generateSkillGapSummary(
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
      .slice(0, 3)
      .map((s) => `${s.skill_name} (gap: ${s.gap} levels)`)
      .join(", ");

    const prompt = `An employee wants to move into a ${jobTitle} role in ${department}. Their top skill gaps are: ${skillsList}.

Write a brief, encouraging 2-3 sentence summary of their upskilling journey. Focus on estimated timeline and keep it motivating.`;

    console.log("🤖 Calling Claude 3.5 Haiku for summary...");
    const startTime = Date.now();

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // ← UPDATED
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    console.log(`✅ Summary generated in ${Date.now() - startTime}ms`);

    const textContent = message.content.find((block) => block.type === "text");
    return textContent?.type === "text"
      ? textContent.text
      : "Your personalized upskilling plan is ready.";
  } catch (error) {
    console.error("❌ Error generating summary:", error);
    return "Unable to generate summary at this time.";
  }
}

// DETAILED - Full plan with resources (only when requested)
export async function generateFullUpskillPlan(
  jobTitle: string,
  department: string,
  gapSkills: SkillGap[],
): Promise<string> {
  try {
    if (gapSkills.length === 0) {
      return "You have demonstrated proficiency in all required skills for this position. Continue building practical experience and consider mentoring others to deepen your expertise.";
    }

    const skillsList = gapSkills
      .sort((a, b) => b.importance_weight - a.importance_weight)
      .map(
        (s) =>
          `- ${s.skill_name}: Currently Level ${s.proficiency_level}, need Level ${s.required_level} (gap: ${s.gap})`,
      )
      .join("\n");

    const prompt = `An employee wants to move into a ${jobTitle} role in the ${department} department. They have ${gapSkills.length} skill gap(s):

${skillsList}

Create a comprehensive upskilling plan with this structure:

For each skill gap (in priority order):

1. ${gapSkills[0]?.skill_name || "Skill"} (Gap: ${gapSkills[0]?.gap || "X"})

Explanation: [1-2 sentences on why this skill is critical for the ${jobTitle} role]

Actionable Step: [One specific action they can take right now]

Learning Resources:
  • [Specific course or resource with real URL from Coursera, Udemy, LinkedIn Learning, etc.]
  • [Hands-on project suggestion]
  • [Documentation or book recommendation]

Timeline: [Realistic estimate like "4-6 weeks with 5 hours/week"]

---

Continue this format for all ${gapSkills.length} skills. Make it encouraging, specific, and actionable.`;

    console.log("🤖 Calling Claude 3.5 Haiku for full plan...");
    const startTime = Date.now();

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // ← UPDATED
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }],
    });

    console.log(`✅ Full plan generated in ${Date.now() - startTime}ms`);

    const textContent = message.content.find((block) => block.type === "text");
    return textContent?.type === "text"
      ? textContent.text
      : "Full plan unavailable.";
  } catch (error) {
    console.error("❌ Error generating full plan:", error);
    return "Unable to generate detailed plan at this time.";
  }
}
