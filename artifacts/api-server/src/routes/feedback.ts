import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, aiGenerationsTable, generationFeedbackTable } from "@workspace/db";
import { eq, and, count, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

async function getUserId(clerkId: string): Promise<number | null> {
  const users = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  return users[0]?.id ?? null;
}

// POST /api/ai/feedback
router.post("/", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const { generationId, rating, note } = req.body;
  if (!generationId || !rating) { res.status(400).json({ error: "generationId and rating are required" }); return; }
  if (!["liked", "disliked"].includes(rating)) { res.status(400).json({ error: "rating must be liked or disliked" }); return; }

  const gen = await db.select().from(aiGenerationsTable)
    .where(and(eq(aiGenerationsTable.id, generationId), eq(aiGenerationsTable.userId, userId))).limit(1);
  if (!gen[0]) { res.status(404).json({ error: "Generation not found" }); return; }

  const existing = await db.select().from(generationFeedbackTable)
    .where(and(eq(generationFeedbackTable.generationId, generationId), eq(generationFeedbackTable.userId, userId))).limit(1);

  if (existing[0]) {
    await db.update(generationFeedbackTable)
      .set({ rating, note: note ?? null })
      .where(eq(generationFeedbackTable.id, existing[0].id));
    res.status(201).json({ id: existing[0].id });
    return;
  }

  const inserted = await db.insert(generationFeedbackTable).values({
    userId,
    generationId,
    rating,
    note: note ?? null,
  }).returning();

  res.status(201).json({ id: inserted[0].id });
});

// GET /api/ai/feedback/stats
router.get("/stats", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const allFeedback = await db
    .select({
      rating: generationFeedbackTable.rating,
      toolType: aiGenerationsTable.toolType,
    })
    .from(generationFeedbackTable)
    .innerJoin(aiGenerationsTable, eq(generationFeedbackTable.generationId, aiGenerationsTable.id))
    .where(eq(generationFeedbackTable.userId, userId));

  const totalLiked = allFeedback.filter(f => f.rating === "liked").length;
  const totalDisliked = allFeedback.filter(f => f.rating === "disliked").length;
  const total = totalLiked + totalDisliked;

  const byTool: Record<string, { liked: number; disliked: number }> = {};
  for (const f of allFeedback) {
    if (!byTool[f.toolType]) byTool[f.toolType] = { liked: 0, disliked: 0 };
    if (f.rating === "liked") byTool[f.toolType].liked++;
    else byTool[f.toolType].disliked++;
  }

  const topToolTypes = Object.entries(byTool)
    .map(([toolType, { liked, disliked }]) => ({ toolType, liked, disliked }))
    .sort((a, b) => (b.liked + b.disliked) - (a.liked + a.disliked))
    .slice(0, 10);

  res.json({
    totalLiked,
    totalDisliked,
    likeRate: total > 0 ? Math.round((totalLiked / total) * 100) / 100 : 0,
    topToolTypes,
  });
});

export default router;
