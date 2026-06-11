import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, videoJobsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { generateVoiceover, getAvailableVoices } from "../lib/elevenlabs";
import { generateOpenAIVoiceover, OPENAI_TTS_VOICES } from "../lib/openai-tts";
import { createTalkingHead, getTalkStatus } from "../lib/did";
import { createHeyGenTalkingHead, getHeyGenJobStatus } from "../lib/heygen";
import { createBrollClip, getTaskStatus, extractScenes } from "../lib/runway";
import { createLumaBrollClip, getLumaTaskStatus } from "../lib/luma";

const router = Router();

async function getUser(clerkId: string) {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);
  return users[0] ?? null;
}

// POST /api/video/voiceover
router.post("/voiceover", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const { text, voiceId, provider = "elevenlabs" } = req.body as {
    text: string;
    voiceId?: string;
    provider?: "elevenlabs" | "openai";
  };

  if (!text?.trim()) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    res.status(503).json({ error: "OpenAI is not configured. Add OPENAI_API_KEY to your secrets." });
    return;
  }
  if (provider === "elevenlabs" && !process.env.ELEVENLABS_API_KEY) {
    res.status(503).json({ error: "ElevenLabs is not configured. Add ELEVENLABS_API_KEY to your secrets." });
    return;
  }

  const user = await getUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (Number(user.credits) < 5) {
    res.status(402).json({ error: "Insufficient credits. Voiceover costs 5 credits." });
    return;
  }

  try {
    const result = provider === "openai"
      ? await generateOpenAIVoiceover(text, voiceId ?? "nova")
      : await generateVoiceover(text, voiceId);

    await db
      .update(usersTable)
      .set({ credits: sql`${usersTable.credits} - 5` })
      .where(eq(usersTable.id, user.id));

    res.json({
      audioBase64: result.audioBase64,
      mimeType: result.mimeType,
      durationEstimate: result.durationEstimate,
      creditsUsed: 5,
    });
  } catch (err: unknown) {
    req.log.error({ err }, "Voiceover generation failed");
    res.status(500).json({ error: err instanceof Error ? err.message : "Voiceover generation failed" });
  }
});

// GET /api/video/voices
router.get("/voices", requireAuth, async (req, res): Promise<void> => {
  const voices: Array<{ voice_id: string; name: string; category: string }> = [];

  if (process.env.OPENAI_API_KEY) {
    OPENAI_TTS_VOICES.forEach((v) =>
      voices.push({ voice_id: `openai:${v.id}`, name: v.name, category: "openai" }),
    );
  }

  if (process.env.ELEVENLABS_API_KEY) {
    try {
      const el = await getAvailableVoices();
      el.forEach((v) => voices.push({ ...v, category: `elevenlabs:${v.category}` }));
    } catch {
      // ignore
    }
  }

  res.json({ voices });
});

// POST /api/video/talking-head
router.post("/talking-head", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const { script, presenterImageUrl, provider = "did" } = req.body as {
    script: string;
    presenterImageUrl?: string;
    provider?: "did" | "heygen";
  };

  if (!script?.trim()) {
    res.status(400).json({ error: "script is required" });
    return;
  }

  if (provider === "heygen" && !process.env.HEYGEN_API_KEY) {
    res.status(503).json({ error: "HeyGen is not configured. Add HEYGEN_API_KEY to your secrets." });
    return;
  }
  if (provider === "did" && !process.env.DID_API_KEY) {
    res.status(503).json({ error: "D-ID is not configured. Add DID_API_KEY to your secrets." });
    return;
  }

  const user = await getUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (Number(user.credits) < 10) {
    res.status(402).json({ error: "Insufficient credits. Talking head costs 10 credits." });
    return;
  }

  try {
    const { jobId: externalId } = provider === "heygen"
      ? await createHeyGenTalkingHead(script)
      : await createTalkingHead(script, presenterImageUrl);

    const inserted = await db
      .insert(videoJobsTable)
      .values({
        userId: user.id,
        jobType: `talking_head_${provider}`,
        status: "processing",
        inputText: script.slice(0, 500),
        externalJobId: externalId,
      })
      .returning();

    await db
      .update(usersTable)
      .set({ credits: sql`${usersTable.credits} - 10` })
      .where(eq(usersTable.id, user.id));

    res.json({ jobId: inserted[0]!.id, externalJobId: externalId, creditsUsed: 10 });
  } catch (err: unknown) {
    req.log.error({ err }, "Talking head creation failed");
    res.status(500).json({ error: err instanceof Error ? err.message : "Talking head creation failed" });
  }
});

// POST /api/video/broll
router.post("/broll", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const { script, provider = "runway_gen3" } = req.body as {
    script: string;
    provider?: "runway_gen3" | "runway_gen4" | "luma";
  };

  if (!script?.trim()) {
    res.status(400).json({ error: "script is required" });
    return;
  }
  if ((provider === "runway_gen3" || provider === "runway_gen4") && !process.env.RUNWAY_API_KEY) {
    res.status(503).json({ error: "Runway is not configured. Add RUNWAY_API_KEY to your secrets." });
    return;
  }
  if (provider === "luma" && !process.env.LUMAAI_API_KEY) {
    res.status(503).json({ error: "Luma AI is not configured. Add LUMAAI_API_KEY to your secrets." });
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    res.status(503).json({ error: "OpenAI is not configured. Add OPENAI_API_KEY to your secrets." });
    return;
  }

  const user = await getUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (Number(user.credits) < 15) {
    res.status(402).json({ error: "Insufficient credits. B-roll generation costs 15 credits." });
    return;
  }

  try {
    const scenes = await extractScenes(script);
    const jobs: Array<{ jobId: number; scene: string; externalJobId: string }> = [];

    for (const scene of scenes) {
      let taskId: string;
      if (provider === "luma") {
        ({ taskId } = await createLumaBrollClip(scene));
      } else {
        const model = provider === "runway_gen4" ? "gen4_turbo" : "gen3a_turbo";
        ({ taskId } = await createBrollClip(scene, model));
      }

      const inserted = await db
        .insert(videoJobsTable)
        .values({
          userId: user.id,
          jobType: `broll_${provider}`,
          status: "processing",
          inputText: scene,
          externalJobId: taskId,
        })
        .returning();
      jobs.push({ jobId: inserted[0]!.id, scene, externalJobId: taskId });
    }

    await db
      .update(usersTable)
      .set({ credits: sql`${usersTable.credits} - 15` })
      .where(eq(usersTable.id, user.id));

    res.json({ jobs, scenes, creditsUsed: 15 });
  } catch (err: unknown) {
    req.log.error({ err }, "B-roll generation failed");
    res.status(500).json({ error: err instanceof Error ? err.message : "B-roll generation failed" });
  }
});

// GET /api/video/jobs/:id
router.get("/jobs/:id", requireAuth, async (req, res): Promise<void> => {
  const jobId = Number(req.params.id);
  if (isNaN(jobId)) { res.status(400).json({ error: "Invalid job id" }); return; }

  const jobs = await db
    .select()
    .from(videoJobsTable)
    .where(eq(videoJobsTable.id, jobId))
    .limit(1);

  const job = jobs[0];
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  if (job.status === "processing" && job.externalJobId) {
    try {
      let newStatus = job.status;
      let outputUrl: string | null = null;
      let errorMsg: string | null = null;

      if (job.jobType.startsWith("talking_head_heygen")) {
        const s = await getHeyGenJobStatus(job.externalJobId);
        if (s.status === "completed" || s.status === "failed") {
          newStatus = s.status === "completed" ? "completed" : "failed";
          outputUrl = s.resultUrl ?? null;
          errorMsg = s.error ?? null;
        }
      } else if (job.jobType.startsWith("talking_head")) {
        const s = await getTalkStatus(job.externalJobId);
        if (s.status === "done" || s.status === "error") {
          newStatus = s.status === "done" ? "completed" : "failed";
          outputUrl = s.resultUrl ?? null;
          errorMsg = s.error ?? null;
        }
      } else if (job.jobType.startsWith("broll_luma")) {
        const s = await getLumaTaskStatus(job.externalJobId);
        if (s.status === "completed" || s.status === "failed") {
          newStatus = s.status;
          outputUrl = s.outputUrl ?? null;
          errorMsg = s.error ?? null;
        }
      } else if (job.jobType.startsWith("broll")) {
        const s = await getTaskStatus(job.externalJobId);
        if (s.status === "SUCCEEDED" || s.status === "FAILED") {
          newStatus = s.status === "SUCCEEDED" ? "completed" : "failed";
          outputUrl = s.outputUrl ?? null;
          errorMsg = s.error ?? null;
        }
      }

      if (newStatus !== job.status) {
        await db
          .update(videoJobsTable)
          .set({ status: newStatus, outputUrl, errorMessage: errorMsg, updatedAt: new Date() })
          .where(eq(videoJobsTable.id, jobId));
        job.status = newStatus;
        job.outputUrl = outputUrl;
      }
    } catch (err) {
      req.log.warn({ err }, "Failed to poll external job status");
    }
  }

  res.json({
    id: job.id,
    jobType: job.jobType,
    status: job.status,
    outputUrl: job.outputUrl,
    inputText: job.inputText,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt.toISOString(),
  });
});

export default router;
