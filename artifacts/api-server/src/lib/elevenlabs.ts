const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel - clear, professional

export interface VoiceoverResult {
  audioBase64: string;
  mimeType: string;
  durationEstimate: number;
}

export async function generateVoiceover(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID,
): Promise<VoiceoverResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not configured");

  const truncatedText = text.slice(0, 4900);

  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: truncatedText,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs error ${response.status}: ${err}`);
  }

  const buffer = await response.arrayBuffer();
  const audioBase64 = Buffer.from(buffer).toString("base64");
  const wordsPerMinute = 140;
  const wordCount = truncatedText.split(/\s+/).length;
  const durationEstimate = Math.ceil((wordCount / wordsPerMinute) * 60);

  return { audioBase64, mimeType: "audio/mpeg", durationEstimate };
}

export async function getAvailableVoices(): Promise<
  Array<{ voice_id: string; name: string; category: string }>
> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not configured");

  const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
    headers: { "xi-api-key": apiKey },
  });

  if (!response.ok) throw new Error(`ElevenLabs voices error ${response.status}`);

  const data = (await response.json()) as {
    voices: Array<{ voice_id: string; name: string; category: string }>;
  };
  return data.voices.filter((v) =>
    ["premade", "professional"].includes(v.category),
  );
}
