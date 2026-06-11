import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, calendarItemsTable, brandProfilesTable } from "@workspace/db";
import { eq, and, like, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { callAi } from "../lib/ai";

const router = Router();

async function getUserId(clerkId: string): Promise<number | null> {
  const users = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  return users[0]?.id ?? null;
}

function serializeItem(item: typeof calendarItemsTable.$inferSelect) {
  return { ...item, createdAt: item.createdAt.toISOString() };
}

// GET /api/calendar?month=YYYY-MM
router.get("/", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const month = req.query.month as string | undefined;
  let items;
  if (month) {
    items = await db.select().from(calendarItemsTable)
      .where(and(eq(calendarItemsTable.userId, userId), like(calendarItemsTable.scheduledDate, `${month}%`)))
      .orderBy(calendarItemsTable.scheduledDate);
  } else {
    items = await db.select().from(calendarItemsTable)
      .where(eq(calendarItemsTable.userId, userId))
      .orderBy(calendarItemsTable.scheduledDate);
  }
  res.json(items.map(serializeItem));
});

// POST /api/calendar
router.post("/", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const { brandProfileId, scheduledDate, platform, contentType, title, content, status } = req.body;
  if (!scheduledDate || !platform || !contentType) {
    res.status(400).json({ error: "scheduledDate, platform, contentType are required" }); return;
  }

  const inserted = await db.insert(calendarItemsTable).values({
    userId,
    brandProfileId: brandProfileId ?? null,
    scheduledDate,
    platform,
    contentType: contentType ?? "post",
    title: title ?? null,
    content: content ?? null,
    status: status ?? "draft",
  }).returning();

  res.status(201).json(serializeItem(inserted[0]));
});

// PUT /api/calendar/:id
router.put("/:id", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const id = Number(req.params.id);
  const { brandProfileId, scheduledDate, platform, contentType, title, content, status } = req.body;

  const existing = await db.select().from(calendarItemsTable)
    .where(and(eq(calendarItemsTable.id, id), eq(calendarItemsTable.userId, userId))).limit(1);
  if (!existing[0]) { res.status(404).json({ error: "Not found" }); return; }

  const updated = await db.update(calendarItemsTable).set({
    ...(brandProfileId !== undefined && { brandProfileId }),
    ...(scheduledDate !== undefined && { scheduledDate }),
    ...(platform !== undefined && { platform }),
    ...(contentType !== undefined && { contentType }),
    ...(title !== undefined && { title }),
    ...(content !== undefined && { content }),
    ...(status !== undefined && { status }),
  }).where(and(eq(calendarItemsTable.id, id), eq(calendarItemsTable.userId, userId))).returning();

  res.json(serializeItem(updated[0]));
});

// DELETE /api/calendar/:id
router.delete("/:id", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const id = Number(req.params.id);
  await db.delete(calendarItemsTable)
    .where(and(eq(calendarItemsTable.id, id), eq(calendarItemsTable.userId, userId)));
  res.status(204).send();
});

// POST /api/calendar/ai-fill
router.post("/ai-fill", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const users = await db.select().from(usersTable).where(eq(usersTable.clerkId, auth.userId!)).limit(1);
  const user = users[0];
  if (Number(user.credits) < 10) {
    res.status(402).json({ error: "Insufficient credits. Need at least 10." }); return;
  }

  const { month, platforms, postsPerWeek, brandProfileId, topic } = req.body;
  if (!month || !platforms?.length || !postsPerWeek) {
    res.status(400).json({ error: "month, platforms, postsPerWeek are required" }); return;
  }

  let brandContext = "";
  if (brandProfileId) {
    const profiles = await db.select().from(brandProfilesTable)
      .where(and(eq(brandProfilesTable.id, brandProfileId), eq(brandProfilesTable.userId, userId))).limit(1);
    if (profiles[0]) {
      const p = profiles[0];
      brandContext = `\nBrand: ${p.name}\nIndustry: ${p.industry || "ecommerce"}\nProduct: ${p.productDescription || ""}\nAudience: ${p.targetAudience || ""}\nTone: ${p.tone}`;
    }
  }

  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const totalPosts = Math.ceil((postsPerWeek * daysInMonth) / 7);
  const platformList = (platforms as string[]).join(", ");

  const aiResult = await callAi({
    systemPrompt: "You are a social media content strategist. Generate a content calendar plan as valid JSON.",
    userPrompt: `Generate ${totalPosts} social media post ideas for ${month} spread across these platforms: ${platformList}.${brandContext}${topic ? `\nFocus topic: ${topic}` : ""}

Return ONLY a JSON array like:
[
  {"date":"YYYY-MM-DD","platform":"Instagram","contentType":"post","title":"Short title","content":"Full post content ready to publish"},
  ...
]

Spread posts evenly across the month. Vary content types (post, reel, story, carousel). Make content engaging and platform-appropriate.`,
    temperature: 0.8,
    maxTokens: 3000,
  });

  let ideas: Array<{ date: string; platform: string; contentType: string; title: string; content: string }> = [];
  try {
    const jsonMatch = aiResult.content.match(/\[[\s\S]*\]/);
    if (jsonMatch) ideas = JSON.parse(jsonMatch[0]);
  } catch {
    res.status(500).json({ error: "AI returned invalid format" }); return;
  }

  const creditsUsed = Math.ceil(totalPosts * 0.5);
  await db.update(usersTable).set({ credits: sql`${usersTable.credits} - ${creditsUsed}` }).where(eq(usersTable.id, userId));

  const inserted = await db.insert(calendarItemsTable).values(
    ideas.map(idea => ({
      userId,
      brandProfileId: brandProfileId ?? null,
      scheduledDate: idea.date,
      platform: idea.platform,
      contentType: idea.contentType ?? "post",
      title: idea.title ?? null,
      content: idea.content ?? null,
      status: "draft" as const,
    }))
  ).returning();

  res.json({ items: inserted.map(serializeItem), creditsUsed });
});

export default router;
