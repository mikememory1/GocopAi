const HEYGEN_API_URL = "https://api.heygen.com";

export type HeyGenJobStatus = "pending" | "processing" | "completed" | "failed";

export interface HeyGenJob {
  id: string;
  status: HeyGenJobStatus;
  resultUrl?: string;
  error?: string;
}

function getHeaders(): Record<string, string> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) throw new Error("HEYGEN_API_KEY is not configured");
  return {
    "X-Api-Key": apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function createHeyGenTalkingHead(
  script: string,
): Promise<{ jobId: string }> {
  const response = await fetch(`${HEYGEN_API_URL}/v2/video/generate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: "Daisy-inskirt-20220818",
            avatar_style: "normal",
          },
          voice: {
            type: "text",
            input_text: script.slice(0, 1500),
            voice_id: "2d5b0e6cf36f460aa7fc47e3eee4ba54",
          },
          background: {
            type: "color",
            value: "#FAFAFA",
          },
        },
      ],
      dimension: { width: 1280, height: 720 },
      aspect_ratio: null,
      test: false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HeyGen error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { data: { video_id: string } };
  return { jobId: data.data.video_id };
}

export async function getHeyGenJobStatus(jobId: string): Promise<HeyGenJob> {
  const response = await fetch(
    `${HEYGEN_API_URL}/v1/video_status.get?video_id=${jobId}`,
    { headers: getHeaders() },
  );

  if (!response.ok) {
    throw new Error(`HeyGen status error ${response.status}`);
  }

  const data = (await response.json()) as {
    data: {
      video_id: string;
      status: string;
      video_url?: string;
      error?: string;
    };
  };

  const statusMap: Record<string, HeyGenJobStatus> = {
    pending: "pending",
    processing: "processing",
    completed: "completed",
    failed: "failed",
  };

  return {
    id: data.data.video_id,
    status: statusMap[data.data.status] ?? "processing",
    resultUrl: data.data.video_url,
    error: data.data.error,
  };
}
