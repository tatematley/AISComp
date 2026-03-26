type EditOptions = {
  contentType:
    | "recommendation explanation"
    | "upskilling summary"
    | "upskilling plan";
  originalPrompt: string;
  draft: string;
};

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function getEditorModel() {
  return process.env.OPENAI_EDITOR_MODEL || "gpt-4.1-mini";
}

export async function editWithOpenAI({
  contentType,
  originalPrompt,
  draft,
}: EditOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return draft;
  }

  const biasReviewInstruction =
    " Before finalizing, explicitly review the text for bias or potentially biased language. Remove any direct or indirect references, assumptions, stereotypes, or proxy indicators related to protected characteristics such as gender, race, ethnicity, age, disability, religion, sexual orientation, or nationality. Do not infer demographic information. Keep the output fair, neutral, and evidence-based, and preserve a focus on job-relevant qualifications, skills, experience, or development guidance only when applicable.";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getEditorModel(),
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are an expert editor. Improve clarity, completeness, and professionalism, but do not add new facts. Keep all claims grounded in the provided prompt and draft. Preserve the original format unless the draft is clearly malformed. For every content type, audit the language for fairness and bias, remove biased or potentially biased phrasing, avoid protected-characteristic references or proxies, do not infer demographic information, and keep the output evidence-based and relevant to the task.",
          },
          {
            role: "user",
            content: `Original task:\n${originalPrompt}\n\nClaude draft ${contentType}:\n${draft}\n\nEdit this ${contentType} so it is clearer, more polished, and more comprehensive without inventing facts or changing the meaning.${biasReviewInstruction}`,
          },
        ],
      }),
    });

    const data = (await response.json()) as OpenAIChatResponse;
    const edited = data.choices?.[0]?.message?.content?.trim();

    if (!response.ok || !edited) {
      console.error("OpenAI editor failed:", data);
      return draft;
    }

    return edited;
  } catch (error) {
    console.error("OpenAI editor error:", error);
    return draft;
  }
}
