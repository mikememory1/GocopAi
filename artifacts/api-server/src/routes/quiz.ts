import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, quizResultsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { callAi } from "../lib/ai";
import { quizQuestions, computeScores } from "../data/quizQuestions";
import { logger } from "../lib/logger";
import { sendQuizResultEmail } from "../lib/email";

const router = Router();

// GET /api/quiz/questions
router.get("/questions", async (_req, res): Promise<void> => {
  res.json(quizQuestions);
});

// POST /api/quiz/submit
router.post("/submit", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const { answers } = req.body as { answers: Record<string, string> };

  if (!answers || typeof answers !== "object") {
    res.status(400).json({ error: "answers is required" });
    return;
  }

  const { categoryScores, overallScore, stage } = computeScores(answers);

  // Generate AI action plan
  let generatedPlan: string | null = null;
  try {
    const categoryScoreLines = Object.entries(categoryScores)
      .map(([cat, score]) => `- ${cat}: ${score}/100`)
      .join("\n");

    const systemPrompt = `You are a business growth expert. Generate a concise, personalised action plan based on a business maturity assessment. Format your response as JSON with this structure:
{
  "summary": "2-3 sentence summary of their situation",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["area 1", "area 2", "area 3"],
  "sections": [
    {
      "title": "Section Title",
      "priority": "high|medium|low",
      "actions": ["action 1", "action 2", "action 3"]
    }
  ]
}
Keep it practical and specific. 3-4 sections maximum.`;

    const userPrompt = `Business Maturity Assessment Results:
Stage: ${stage}
Overall Score: ${overallScore}/100

Category Scores:
${categoryScoreLines}

Generate a personalised action plan for this business.`;

    const result = await callAi({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 1200,
    });
    generatedPlan = result.content;
  } catch (err) {
    logger.warn({ err }, "Failed to generate quiz action plan, continuing without it");
  }

  // Get user if logged in
  let userId: number | null = null;
  if (auth.userId) {
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, auth.userId))
      .limit(1);
    userId = users[0]?.id ?? null;
  }

  // Save quiz result
  const inserted = await db
    .insert(quizResultsTable)
    .values({
      userId,
      answersJson: answers,
      categoryScoresJson: categoryScores,
      overallScore: String(overallScore),
      stage,
      generatedPlan,
    })
    .returning();

  const quizResult = inserted[0];

  // Fire-and-forget email — do not await so the response isn't delayed
  if (auth.userId) {
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, auth.userId))
      .limit(1);
    const user = users[0];
    if (user?.email) {
      sendQuizResultEmail({
        to: user.email,
        name: user.name,
        stage,
        overallScore,
        categoryScores,
        generatedPlan,
      }).catch((err) => logger.warn({ err }, "Unexpected error in sendQuizResultEmail"));
    }
  }

  res.json({
    id: quizResult.id,
    userId: quizResult.userId,
    overallScore: Number(quizResult.overallScore),
    stage: quizResult.stage,
    categoryScores: quizResult.categoryScoresJson as Record<string, number>,
    generatedPlan: quizResult.generatedPlan,
    createdAt: quizResult.createdAt.toISOString(),
  });
});

// GET /api/quiz/results
router.get("/results", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, auth.userId!))
    .limit(1);

  if (!users[0]) {
    res.json([]);
    return;
  }

  const results = await db
    .select()
    .from(quizResultsTable)
    .where(eq(quizResultsTable.userId, users[0].id))
    .orderBy(desc(quizResultsTable.createdAt));

  res.json(
    results.map((r) => ({
      id: r.id,
      userId: r.userId,
      overallScore: Number(r.overallScore),
      stage: r.stage,
      categoryScores: r.categoryScoresJson as Record<string, number>,
      generatedPlan: r.generatedPlan,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

// GET /api/quiz/results/:id
router.get("/results/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const results = await db
    .select()
    .from(quizResultsTable)
    .where(eq(quizResultsTable.id, id))
    .limit(1);

  if (!results[0]) {
    res.status(404).json({ error: "Quiz result not found" });
    return;
  }

  const r = results[0];
  res.json({
    id: r.id,
    userId: r.userId,
    overallScore: Number(r.overallScore),
    stage: r.stage,
    categoryScores: r.categoryScoresJson as Record<string, number>,
    generatedPlan: r.generatedPlan,
    createdAt: r.createdAt.toISOString(),
  });
});

export default router;
