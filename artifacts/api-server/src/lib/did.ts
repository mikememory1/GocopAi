const DID_API_URL = "https://api.d-id.com";

const DEFAULT_PRESENTER_IMAGE =
  "https://clips-presenters.d-id.com/amy/thumbnail/amy.jpeg";

export type DIDJobStatus = "created" | "started" | "done" | "error";

export interface DIDTalkJob {
  id: string;
  status: DIDJobStatus;
  resultUrl?: string;
  error?: string;
}

function getAuthHeader(): string {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) throw new Error("DID_API_KEY is not configured");
  return `Basic ${apiKey}`;
}

export async function createTalkingHead(
  script: string,
  presenterImageUrl: string = DEFAULT_PRESENTER_IMAGE,
): Promise<{ jobId: string }> {
  const response = await fetch(`${DID_API_URL}/talks`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      source_url: presenterImageUrl,
      script: {
        type: "text",
        input: script.slice(0, 1000),
        provider: {
          type: "microsoft",
          voice_id: "en-US-JennyNeural",
        },
      },
      config: {
        fluent: true,
        pad_audio: 0.5,
        driver_expressions: {
          expressions: [{ expression: "happy", intensity: 0.6 }],
        },
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`D-ID error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { id: string };
  return { jobId: data.id };
}

export async function getTalkStatus(jobId: string): Promise<DIDTalkJob> {
  const response = await fetch(`${DID_API_URL}/talks/${jobId}`, {
    headers: {
      Authorization: getAuthHeader(),
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`D-ID status error ${response.status}`);
  }

  const data = (await response.json()) as {
    id: string;
    status: DIDJobStatus;
    result_url?: string;
    error?: { description?: string };
  };

  return {
    id: data.id,
    status: data.status,
    resultUrl: data.result_url,
    error: data.error?.description,
  };
}
