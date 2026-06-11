import { callAi } from "./ai";

const RUNWAY_API_URL = "https://api.runwayml.com/v1";
const RUNWAY_API_VERSION = "2024-11-06";

export type RunwayTaskStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

export interface RunwayTask {
  id: string;
  status: RunwayTaskStatus;
  outputUrl?: string;
  error?: string;
}

function getRunwayHeaders(): Record<string, string> {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) throw new Error("RUNWAY_API_KEY is not configured");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "X-Runway-Version": RUNWAY_API_VERSION,
  };
}

async function generateSceneImage(sceneDescription: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: `Cinematic product photography style image for ecommerce video b-roll: ${sceneDescription}. Professional lighting, clean composition, 16:9 aspect ratio.`,
      size: "1792x1024",
      quality: "standard",
      n: 1,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DALL-E error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { data: Array<{ url: string }> };
  const url = data.data[0]?.url;
  if (!url) throw new Error("DALL-E did not return an image URL");
  return url;
}

export async function extractScenes(script: string): Promise<string[]> {
  const result = await callAi({
    systemPrompt:
      "Extract exactly 3 distinct visual scene descriptions from this video script for use as b-roll footage. Each scene should be a single descriptive sentence (max 20 words) describing a specific visual shot. Return ONLY a JSON object with key 'scenes' containing an array of 3 strings.",
    userPrompt: script,
    maxTokens: 200,
    model: "gpt-4o-mini",
  });

  try {
    const parsed = JSON.parse(result.content) as { scenes?: string[] };
    const scenes = parsed.scenes ?? [];
    if (scenes.length >= 1) return scenes.slice(0, 3);
  } catch {
    // fall through to defaults
  }

  return [
    "Product displayed on clean white background with professional lighting",
    "Happy customer using the product in natural setting",
    "Close-up detail shot of product quality and features",
  ];
}

export async function createBrollClip(
  sceneDescription: string,
  model: "gen3a_turbo" | "gen4_turbo" = "gen3a_turbo",
): Promise<{ taskId: string }> {
  const imageUrl = await generateSceneImage(sceneDescription);

  const response = await fetch(`${RUNWAY_API_URL}/image_to_video`, {
    method: "POST",
    headers: getRunwayHeaders(),
    body: JSON.stringify({
      model,
      promptImage: imageUrl,
      promptText: sceneDescription,
      duration: 5,
      ratio: "1280:768",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Runway error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { id: string };
  return { taskId: data.id };
}

export async function getTaskStatus(taskId: string): Promise<RunwayTask> {
  const response = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}`, {
    headers: getRunwayHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Runway task status error ${response.status}`);
  }

  const data = (await response.json()) as {
    id: string;
    status: RunwayTaskStatus;
    output?: string[];
    failure?: string;
  };

  return {
    id: data.id,
    status: data.status,
    outputUrl: data.output?.[0],
    error: data.failure,
  };
}
