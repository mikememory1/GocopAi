import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, brandProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

async function getUserId(clerkId: string): Promise<number | null> {
  const users = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  return users[0]?.id ?? null;
}

// GET /api/brand-profiles
router.get("/", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const profiles = await db
    .select()
    .from(brandProfilesTable)
    .where(eq(brandProfilesTable.userId, userId));

  res.json(profiles.map(p => ({
    ...p,
    platforms: (p.platforms as string[]) ?? [],
    createdAt: p.createdAt.toISOString(),
  })));
});

// POST /api/brand-profiles
router.post("/", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const { name, industry, productDescription, targetAudience, tone, platforms, brandValues, competitors, isDefault } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }

  if (isDefault) {
    await db.update(brandProfilesTable).set({ isDefault: false }).where(eq(brandProfilesTable.userId, userId));
  }

  const inserted = await db.insert(brandProfilesTable).values({
    userId,
    name,
    industry: industry ?? null,
    productDescription: productDescription ?? null,
    targetAudience: targetAudience ?? null,
    tone: tone ?? "professional",
    platforms: platforms ?? [],
    brandValues: brandValues ?? null,
    competitors: competitors ?? null,
    isDefault: isDefault ?? false,
  }).returning();

  const p = inserted[0];
  res.status(201).json({ ...p, platforms: (p.platforms as string[]) ?? [], createdAt: p.createdAt.toISOString() });
});

// GET /api/brand-profiles/:id
router.get("/:id", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const id = Number(req.params.id);
  const profiles = await db.select().from(brandProfilesTable)
    .where(and(eq(brandProfilesTable.id, id), eq(brandProfilesTable.userId, userId))).limit(1);

  if (!profiles[0]) { res.status(404).json({ error: "Not found" }); return; }
  const p = profiles[0];
  res.json({ ...p, platforms: (p.platforms as string[]) ?? [], createdAt: p.createdAt.toISOString() });
});

// PUT /api/brand-profiles/:id
router.put("/:id", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const id = Number(req.params.id);
  const { name, industry, productDescription, targetAudience, tone, platforms, brandValues, competitors, isDefault } = req.body;

  const existing = await db.select().from(brandProfilesTable)
    .where(and(eq(brandProfilesTable.id, id), eq(brandProfilesTable.userId, userId))).limit(1);
  if (!existing[0]) { res.status(404).json({ error: "Not found" }); return; }

  if (isDefault) {
    await db.update(brandProfilesTable).set({ isDefault: false }).where(eq(brandProfilesTable.userId, userId));
  }

  const updated = await db.update(brandProfilesTable).set({
    ...(name !== undefined && { name }),
    ...(industry !== undefined && { industry }),
    ...(productDescription !== undefined && { productDescription }),
    ...(targetAudience !== undefined && { targetAudience }),
    ...(tone !== undefined && { tone }),
    ...(platforms !== undefined && { platforms }),
    ...(brandValues !== undefined && { brandValues }),
    ...(competitors !== undefined && { competitors }),
    ...(isDefault !== undefined && { isDefault }),
  }).where(and(eq(brandProfilesTable.id, id), eq(brandProfilesTable.userId, userId))).returning();

  const p = updated[0];
  res.json({ ...p, platforms: (p.platforms as string[]) ?? [], createdAt: p.createdAt.toISOString() });
});

// DELETE /api/brand-profiles/:id
router.delete("/:id", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const id = Number(req.params.id);
  await db.delete(brandProfilesTable)
    .where(and(eq(brandProfilesTable.id, id), eq(brandProfilesTable.userId, userId)));
  res.status(204).send();
});

export default router;
