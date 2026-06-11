import { logger } from "./logger";

export interface AiCallOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AiCallResult {
  content: string;
  tokensEstimate: number;
}

export async function callAi(options: AiCallOptions): Promise<AiCallResult> {
  const {
    systemPrompt,
    userPrompt,
    temperature = 0.7,
    maxTokens = 1500,
    model = "gpt-4o-mini",
  } = options;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error({ status: response.status, error: errorText }, "OpenAI API error");
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage?: { total_tokens?: number };
  };

  const content = data.choices[0]?.message?.content ?? "";
  const tokensEstimate = data.usage?.total_tokens ?? Math.ceil(content.length / 4);

  return { content, tokensEstimate };
}

export function estimateCredits(toolType: string, tokensEstimate: number): number {
  const baseCredits: Record<string, number> = {
    video_script: 3,
    video_hook: 1,
    video_outline: 2,
    seo_outline: 2,
    seo_meta: 1,
    seo_keywords: 1,
    social_post: 1,
    social_carousel: 2,
    social_calendar: 2,
    ads_copy: 2,
    ads_headline: 1,
    ads_angle: 1,
    blog_draft: 5,
    blog_intro: 1,
    blog_conclusion: 1,
    generic: 2,
  };
  const base = baseCredits[toolType] ?? 2;
  const tokenMultiplier = tokensEstimate > 1000 ? 1.5 : 1;
  return Math.ceil(base * tokenMultiplier * 10) / 10;
}
