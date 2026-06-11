import { Router } from "express";
import { db, usersTable, aiGenerationsTable, quizResultsTable } from "@workspace/db";
import { eq, desc, ilike, or, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router = Router();

// All admin routes require admin role
router.use(requireAdmin);

// GET /api/admin/users
router.get("/users", async (req, res): Promise<void> => {
  const search = req.query.search as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  let users;
  if (search) {
    users = await db
      .select()
      .from(usersTable)
      .where(
        or(
          ilike(usersTable.email, `%${search}%`),
          ilike(usersTable.name, `%${search}%`),
        ),
      )
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset);
  } else {
    users = await db
      .select()
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset);
  }

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(usersTable);
  const total = Number(totalResult[0]?.count ?? 0);

  res.json({
    users: users.map((u) => ({
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
    })),
    total,
  });
});

// PATCH /api/admin/users/:id/credits
router.patch("/users/:id/credits", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { amount } = req.body as { amount: number };
  if (typeof amount !== "number") {
    res.status(400).json({ error: "amount must be a number" });
    return;
  }

  const updated = await db
    .update(usersTable)
    .set({ credits: String(amount) })
    .where(eq(usersTable.id, id))
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

// PATCH /api/admin/users/:id/role
router.patch("/users/:id/role", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { role } = req.body as { role: "user" | "admin" };
  if (role !== "user" && role !== "admin") {
    res.status(400).json({ error: "role must be 'user' or 'admin'" });
    return;
  }

  const updated = await db
    .update(usersTable)
    .set({ role })
    .where(eq(usersTable.id, id))
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

// GET /api/admin/generations
router.get("/generations", async (req, res): Promise<void> => {
  const userId = req.query.user_id ? Number(req.query.user_id) : undefined;
  const toolType = req.query.tool_type as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  let results = await db
    .select()
    .from(aiGenerationsTable)
    .orderBy(desc(aiGenerationsTable.createdAt))
    .limit(limit);

  if (userId) {
    results = results.filter((g) => g.userId === userId);
  }
  if (toolType) {
    results = results.filter((g) => g.toolType === toolType);
  }

  res.json(
    results.map((g) => ({
      id: g.id,
      userId: g.userId,
      toolType: g.toolType,
      inputSummary: g.inputSummary,
      output: g.output,
      tokensEstimate: g.tokensEstimate,
      creditsUsed: Number(g.creditsUsed),
      createdAt: g.createdAt.toISOString(),
    })),
  );
});

// GET /api/admin/stats
router.get("/stats", async (_req, res): Promise<void> => {
  const [totalUsersResult, totalGenerationsResult, creditsResult] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(usersTable),
      db.select({ count: sql<number>`count(*)` }).from(aiGenerationsTable),
      db.select({ sum: sql<string>`coalesce(sum(credits_used), 0)` }).from(aiGenerationsTable),
    ]);

  const totalUsers = Number(totalUsersResult[0]?.count ?? 0);
  const totalGenerations = Number(totalGenerationsResult[0]?.count ?? 0);
  const creditsIssued = Number(creditsResult[0]?.sum ?? 0);

  // Quiz stats by stage
  const allQuizResults = await db.select().from(quizResultsTable);
  const quizStats: Record<string, number> = {};
  for (const r of allQuizResults) {
    quizStats[r.stage] = (quizStats[r.stage] ?? 0) + 1;
  }

  // Generations by tool type
  const allGenerations = await db.select().from(aiGenerationsTable);
  const generationsByTool: Record<string, number> = {};
  for (const g of allGenerations) {
    generationsByTool[g.toolType] = (generationsByTool[g.toolType] ?? 0) + 1;
  }

  res.json({
    totalUsers,
    totalGenerations,
    creditsIssued,
    quizStats,
    generationsByTool,
  });
});

export default router;
