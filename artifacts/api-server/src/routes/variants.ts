import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, aiGenerationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { callAi, estimateCredits } from "../lib/ai";

const router = Router();

const ANGLE_LABELS = [
  "Benefit-led",
  "Problem-first",
  "Social proof",
  "Urgency / FOMO",
  "Curiosity / Intrigue",
];

// POST /api/ai/variants
router.post("/", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const users = await db.select().from(usersTable).where(eq(usersTable.clerkId, auth.userId!)).limit(1);
  const user = users[0];
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const { toolType, inputs, count, angles } = req.body as {
    toolType: string;
    inputs: Record<string, string>;
    count: number;
    angles?: string[];
  };

  if (!toolType || !inputs || !count) {
    res.status(400).json({ error: "toolType, inputs, count are required" }); return;
  }

  const variantCount = Math.min(Math.max(count, 2), 5);
  const creditsPerVariant = estimateCredits(toolType, 500);
  const totalCredits = creditsPerVariant * variantCount;

  if (Number(user.credits) < totalCredits) {
    res.status(402).json({ error: `Insufficient credits. Need ~${totalCredits}.` }); return;
  }

  const variantAngles = angles?.length === variantCount
    ? angles
    : ANGLE_LABELS.slice(0, variantCount);

  const inputContext = Object.entries(inputs)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const promises = variantAngles.map(async (angle, idx) => {
    const result = await callAi({
      systemPrompt: `You are an expert copywriter. Write a single high-quality ${toolType.replace(/_/g, " ")} variation using the "${angle}" angle. Return only the copy — no labels, no preamble.`,
      userPrompt: `Context:\n${inputContext}\n\nAngle: ${angle}\n\nWrite the copy now.`,
      temperature: 0.85,
      maxTokens: 1000,
    });

    const savedGen = await db.insert(aiGenerationsTable).values({
      userId: user.id,
      toolType: `${toolType}_variant`,
      inputSummary: `Variant ${idx + 1}: ${angle} — ${Object.values(inputs).slice(0, 2).join(", ").slice(0, 80)}`,
      output: result.content,
      tokensEstimate: result.tokensEstimate,
      creditsUsed: String(creditsPerVariant),
    }).returning();

    return { id: savedGen[0].id, angle, output: result.content };
  });

  const variants = await Promise.all(promises);

  await db.update(usersTable)
    .set({ credits: sql`${usersTable.credits} - ${totalCredits}` })
    .where(eq(usersTable.id, user.id));

  res.json({ variants, creditsUsed: totalCredits });
});

export default router;
