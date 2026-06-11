export interface OpenAITtsResult {
  audioBase64: string;
  mimeType: string;
  durationEstimate: number;
}

export async function generateOpenAIVoiceover(
  text: string,
  voice: string = "nova",
): Promise<OpenAITtsResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const truncated = text.slice(0, 4096);

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1-hd",
      input: truncated,
      voice,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI TTS error ${response.status}: ${err}`);
  }

  const buffer = await response.arrayBuffer();
  const audioBase64 = Buffer.from(buffer).toString("base64");
  const wordCount = truncated.split(/\s+/).length;
  const durationEstimate = Math.ceil((wordCount / 140) * 60);

  return { audioBase64, mimeType: "audio/mpeg", durationEstimate };
}

export const OPENAI_TTS_VOICES = [
  { id: "alloy", name: "Alloy — neutral, versatile" },
  { id: "echo", name: "Echo — male, clear" },
  { id: "fable", name: "Fable — expressive, British" },
  { id: "onyx", name: "Onyx — deep, authoritative" },
  { id: "nova", name: "Nova — female, friendly" },
  { id: "shimmer", name: "Shimmer — female, soft" },
];
