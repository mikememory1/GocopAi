import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { callAi } from "../lib/ai";

const router = Router();

// POST /api/competitor/analyse
router.post("/analyse", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const users = await db.select().from(usersTable).where(eq(usersTable.clerkId, auth.userId!)).limit(1);
  const user = users[0];
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const creditsNeeded = 5;
  if (Number(user.credits) < creditsNeeded) {
    res.status(402).json({ error: `Insufficient credits. Need ${creditsNeeded}.` }); return;
  }

  const { competitorUrl, yourProduct, yourAudience } = req.body;
  if (!competitorUrl) { res.status(400).json({ error: "competitorUrl is required" }); return; }

  const contextBlock = [
    yourProduct ? `Your product: ${yourProduct}` : "",
    yourAudience ? `Your target audience: ${yourAudience}` : "",
  ].filter(Boolean).join("\n");

  const aiResult = await callAi({
    systemPrompt: "You are an elite marketing strategist and competitive intelligence analyst. Return ONLY valid JSON.",
    userPrompt: `Analyse this competitor and generate a counter-strategy.

Competitor URL: ${competitorUrl}
${contextBlock}

Based on the URL and domain, infer their likely:
- Business model, product category, positioning
- Target audience and messaging style
- Marketing strengths and weaknesses

Return ONLY this JSON structure (no markdown, no extra text):
{
  "summary": "2-3 sentence overview of who they are and what they do",
  "strengths": ["strength1", "strength2", "strength3", "strength4"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "opportunities": ["opportunity1", "opportunity2", "opportunity3"],
  "counterStrategy": "3-4 sentence strategic recommendation to compete and win",
  "adAngles": ["angle1", "angle2", "angle3", "angle4", "angle5"],
  "contentIdeas": ["idea1", "idea2", "idea3", "idea4", "idea5"]
}`,
    temperature: 0.7,
    maxTokens: 2000,
  });

  let parsed;
  try {
    const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    res.status(500).json({ error: "AI returned invalid format" }); return;
  }

  await db.update(usersTable)
    .set({ credits: sql`${usersTable.credits} - ${creditsNeeded}` })
    .where(eq(usersTable.id, user.id));

  res.json({ ...parsed, creditsUsed: creditsNeeded });
});

export default router;
