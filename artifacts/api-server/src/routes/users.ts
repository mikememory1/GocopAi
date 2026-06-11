import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { aiGenerationsTable, quizResultsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router = Router();

// GET /api/users/me
router.get("/me", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, auth.userId!))
    .limit(1);

  if (!users[0]) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const u = users[0];
  res.json({
    id: u.id,
    clerkId: u.clerkId,
    email: u.email,
    name: u.name,
    businessName: u.businessName,
    website: u.website,
    role: u.role,
    credits: Number(u.credits),
    stripeCustomerId: u.stripeCustomerId,
    stripeSubscriptionId: u.stripeSubscriptionId,
    currentPlan: u.currentPlan,
    planStatus: u.planStatus,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  });
});

// PATCH /api/users/me
router.patch("/me", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const { name, businessName, website } = req.body as {
    name?: string;
    businessName?: string;
    website?: string;
  };

  const updated = await db
    .update(usersTable)
    .set({ name, businessName, website })
    .where(eq(usersTable.clerkId, auth.userId!))
    .returning();

  if (!updated[0]) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const u = updated[0];
  res.json({
    id: u.id,
    clerkId: u.clerkId,
    email: u.email,
    name: u.name,
    businessName: u.businessName,
    website: u.website,
    role: u.role,
    credits: Number(u.credits),
    stripeCustomerId: u.stripeCustomerId,
    stripeSubscriptionId: u.stripeSubscriptionId,
    currentPlan: u.currentPlan,
    planStatus: u.planStatus,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  });
});

// POST /api/users/me/ensure
router.post("/me/ensure", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Get user info from Clerk token claims
  const claims = auth.sessionClaims;
  const email =
    (claims?.email as string) ||
    (claims?.primary_email_address as string) ||
    `${auth.userId}@unknown.com`;
  const name = (claims?.name as string) || (claims?.full_name as string) || null;

  // Check if this Clerk ID is in the admin list
  const adminIds = (process.env.ADMIN_CLERK_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const isAdmin = adminIds.includes(auth.userId);

  try {
    // Check if user exists
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, auth.userId))
      .limit(1);

    let user = existing[0];

    if (!user) {
      // Create new user — admins get unlimited credits
      const inserted = await db
        .insert(usersTable)
        .values({
          clerkId: auth.userId,
          email,
          name,
          credits: isAdmin ? "999999" : "50",
          role: isAdmin ? "admin" : "user",
          currentPlan: isAdmin ? "agency" : null,
          lastLoginAt: new Date(),
        })
        .returning();
      user = inserted[0];
      req.log.info({ clerkId: auth.userId, isAdmin }, "New user created");
    } else {
      // Update last login — also upgrade admins if not already set
      const updated = await db
        .update(usersTable)
        .set({
          lastLoginAt: new Date(),
          ...(isAdmin && user.role !== "admin" ? {
            role: "admin" as const,
            credits: "999999",
            currentPlan: "agency",
          } : {}),
        })
        .where(eq(usersTable.clerkId, auth.userId))
        .returning();
      user = updated[0];
    }

    res.json({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      businessName: user.businessName,
      website: user.website,
      role: user.role,
      credits: Number(user.credits),
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      currentPlan: user.currentPlan,
      planStatus: user.planStatus,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to ensure user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/me/dashboard
router.get("/me/dashboard", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, auth.userId!))
    .limit(1);

  if (!users[0]) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const user = users[0];

  // Get recent generations
  const recentGenerations = await db
    .select()
    .from(aiGenerationsTable)
    .where(eq(aiGenerationsTable.userId, user.id))
    .orderBy(desc(aiGenerationsTable.createdAt))
    .limit(5);

  // Get last quiz result
  const lastQuizResults = await db
    .select()
    .from(quizResultsTable)
    .where(eq(quizResultsTable.userId, user.id))
    .orderBy(desc(quizResultsTable.createdAt))
    .limit(1);

  // Count total generations
  const allGenerations = await db
    .select()
    .from(aiGenerationsTable)
    .where(eq(aiGenerationsTable.userId, user.id));

  const lastQuiz = lastQuizResults[0];

  res.json({
    credits: Number(user.credits),
    totalGenerations: allGenerations.length,
    recentGenerations: recentGenerations.map((g) => ({
      id: g.id,
      userId: g.userId,
      toolType: g.toolType,
      inputSummary: g.inputSummary,
      output: g.output,
      tokensEstimate: g.tokensEstimate,
      creditsUsed: Number(g.creditsUsed),
      createdAt: g.createdAt.toISOString(),
    })),
    lastQuizResult: lastQuiz
      ? {
          id: lastQuiz.id,
          userId: lastQuiz.userId,
          overallScore: Number(lastQuiz.overallScore),
          stage: lastQuiz.stage,
          categoryScores: lastQuiz.categoryScoresJson as Record<string, number>,
          generatedPlan: lastQuiz.generatedPlan,
          createdAt: lastQuiz.createdAt.toISOString(),
        }
      : null,
    currentPlan: user.currentPlan,
  });
});

export default router;
