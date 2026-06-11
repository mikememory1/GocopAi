const LUMA_API_URL = "https://api.lumalabs.ai/dream-machine/v1";

export type LumaTaskStatus = "pending" | "dreaming" | "completed" | "failed";

export interface LumaTask {
  id: string;
  status: LumaTaskStatus;
  outputUrl?: string;
  error?: string;
}

function getHeaders(): Record<string, string> {
  const apiKey = process.env.LUMAAI_API_KEY;
  if (!apiKey) throw new Error("LUMAAI_API_KEY is not configured");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
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
      prompt: `Cinematic product photography for ecommerce video b-roll: ${sceneDescription}. Professional lighting, clean composition, 16:9.`,
      size: "1792x1024",
      quality: "standard",
      n: 1,
    }),
  });

  if (!response.ok) throw new Error(`DALL-E error ${response.status}`);
  const data = (await response.json()) as { data: Array<{ url: string }> };
  const url = data.data[0]?.url;
  if (!url) throw new Error("DALL-E returned no image");
  return url;
}

export async function createLumaBrollClip(
  sceneDescription: string,
): Promise<{ taskId: string }> {
  const imageUrl = await generateSceneImage(sceneDescription);

  const response = await fetch(`${LUMA_API_URL}/generations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      prompt: sceneDescription,
      keyframes: {
        frame0: {
          type: "image",
          url: imageUrl,
        },
      },
      duration: 5,
      aspect_ratio: "16:9",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Luma error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { id: string };
  return { taskId: data.id };
}

export async function getLumaTaskStatus(taskId: string): Promise<LumaTask> {
  const response = await fetch(`${LUMA_API_URL}/generations/${taskId}`, {
    headers: getHeaders(),
  });

  if (!response.ok) throw new Error(`Luma status error ${response.status}`);

  const data = (await response.json()) as {
    id: string;
    state: string;
    assets?: { video?: string };
    failure_reason?: string;
  };

  const statusMap: Record<string, LumaTaskStatus> = {
    pending: "pending",
    dreaming: "dreaming",
    completed: "completed",
    failed: "failed",
  };

  return {
    id: data.id,
    status: statusMap[data.state] ?? "dreaming",
    outputUrl: data.assets?.video,
    error: data.failure_reason,
  };
}
