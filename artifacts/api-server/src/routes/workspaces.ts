import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, workspacesTable, workspaceMembersTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

async function getUser(clerkId: string) {
  const users = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  return users[0] ?? null;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let attempt = 0;
  while (true) {
    const existing = await db.select().from(workspacesTable).where(eq(workspacesTable.slug, slug)).limit(1);
    if (!existing[0]) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
}

function serializeWorkspace(ws: typeof workspacesTable.$inferSelect, role: string) {
  return {
    id: ws.id,
    name: ws.name,
    slug: ws.slug,
    plan: ws.plan ?? null,
    credits: Number(ws.credits),
    logoUrl: ws.logoUrl ?? null,
    primaryColor: ws.primaryColor ?? null,
    role,
    createdAt: ws.createdAt.toISOString(),
  };
}

// GET /api/workspaces
router.get("/", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const user = await getUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const memberships = await db.select().from(workspaceMembersTable)
    .where(eq(workspaceMembersTable.userId, user.id));

  const workspaceIds = memberships.map(m => m.workspaceId);
  if (workspaceIds.length === 0) { res.json([]); return; }

  const workspaces = await db.select().from(workspacesTable)
    .where(or(...workspaceIds.map(id => eq(workspacesTable.id, id))));

  const roleMap = Object.fromEntries(memberships.map(m => [m.workspaceId, m.role]));
  const ownerMap = Object.fromEntries(workspaces
    .filter(ws => ws.ownerId === user.id)
    .map(ws => [ws.id, "owner"]));

  res.json(workspaces.map(ws => serializeWorkspace(ws, ownerMap[ws.id] ?? roleMap[ws.id] ?? "member")));
});

// POST /api/workspaces
router.post("/", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const user = await getUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const { name, logoUrl, primaryColor } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }

  const slug = await uniqueSlug(slugify(name));
  const inserted = await db.insert(workspacesTable).values({
    ownerId: user.id,
    name,
    slug,
    logoUrl: logoUrl ?? null,
    primaryColor: primaryColor ?? null,
  }).returning();

  const ws = inserted[0];
  await db.insert(workspaceMembersTable).values({ workspaceId: ws.id, userId: user.id, role: "owner" });

  res.status(201).json(serializeWorkspace(ws, "owner"));
});

// GET /api/workspaces/:id
router.get("/:id", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const user = await getUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const id = Number(req.params.id);
  const membership = await db.select().from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, id), eq(workspaceMembersTable.userId, user.id))).limit(1);
  if (!membership[0]) { res.status(403).json({ error: "Forbidden" }); return; }

  const ws = (await db.select().from(workspacesTable).where(eq(workspacesTable.id, id)).limit(1))[0];
  if (!ws) { res.status(404).json({ error: "Not found" }); return; }

  const members = await db
    .select({ m: workspaceMembersTable, u: usersTable })
    .from(workspaceMembersTable)
    .innerJoin(usersTable, eq(workspaceMembersTable.userId, usersTable.id))
    .where(eq(workspaceMembersTable.workspaceId, id));

  const role = ws.ownerId === user.id ? "owner" : membership[0].role;
  res.json({
    ...serializeWorkspace(ws, role),
    members: members.map(({ m, u }) => ({
      id: m.id,
      userId: u.id,
      workspaceId: m.workspaceId,
      role: ws.ownerId === u.id ? "owner" : m.role,
      name: u.name ?? null,
      email: u.email,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

// PUT /api/workspaces/:id
router.put("/:id", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const user = await getUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const id = Number(req.params.id);
  const ws = (await db.select().from(workspacesTable).where(eq(workspacesTable.id, id)).limit(1))[0];
  if (!ws || ws.ownerId !== user.id) { res.status(403).json({ error: "Only the owner can edit this workspace" }); return; }

  const { name, logoUrl, primaryColor } = req.body;
  const updated = await db.update(workspacesTable).set({
    ...(name !== undefined && { name }),
    ...(logoUrl !== undefined && { logoUrl }),
    ...(primaryColor !== undefined && { primaryColor }),
  }).where(eq(workspacesTable.id, id)).returning();

  res.json(serializeWorkspace(updated[0], "owner"));
});

// DELETE /api/workspaces/:id
router.delete("/:id", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const user = await getUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const id = Number(req.params.id);
  const ws = (await db.select().from(workspacesTable).where(eq(workspacesTable.id, id)).limit(1))[0];
  if (!ws || ws.ownerId !== user.id) { res.status(403).json({ error: "Only the owner can delete this workspace" }); return; }

  await db.delete(workspaceMembersTable).where(eq(workspaceMembersTable.workspaceId, id));
  await db.delete(workspacesTable).where(eq(workspacesTable.id, id));
  res.status(204).send();
});

// GET /api/workspaces/:id/members
router.get("/:id/members", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const user = await getUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const id = Number(req.params.id);
  const membership = await db.select().from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, id), eq(workspaceMembersTable.userId, user.id))).limit(1);
  if (!membership[0]) { res.status(403).json({ error: "Forbidden" }); return; }

  const ws = (await db.select().from(workspacesTable).where(eq(workspacesTable.id, id)).limit(1))[0];
  const members = await db
    .select({ m: workspaceMembersTable, u: usersTable })
    .from(workspaceMembersTable)
    .innerJoin(usersTable, eq(workspaceMembersTable.userId, usersTable.id))
    .where(eq(workspaceMembersTable.workspaceId, id));

  res.json(members.map(({ m, u }) => ({
    id: m.id,
    userId: u.id,
    workspaceId: m.workspaceId,
    role: ws?.ownerId === u.id ? "owner" : m.role,
    name: u.name ?? null,
    email: u.email,
    createdAt: m.createdAt.toISOString(),
  })));
});

// POST /api/workspaces/:id/members
router.post("/:id/members", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const user = await getUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const id = Number(req.params.id);
  const ws = (await db.select().from(workspacesTable).where(eq(workspacesTable.id, id)).limit(1))[0];
  if (!ws || ws.ownerId !== user.id) { res.status(403).json({ error: "Only the owner can invite members" }); return; }

  const { email, role } = req.body;
  if (!email || !role) { res.status(400).json({ error: "email and role are required" }); return; }

  const invitee = (await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1))[0];
  if (!invitee) { res.status(404).json({ error: "No user found with that email. They must sign up first." }); return; }

  const existing = await db.select().from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, id), eq(workspaceMembersTable.userId, invitee.id))).limit(1);
  if (existing[0]) { res.status(409).json({ error: "User is already a member" }); return; }

  const inserted = await db.insert(workspaceMembersTable).values({
    workspaceId: id,
    userId: invitee.id,
    role,
  }).returning();

  res.status(201).json({
    id: inserted[0].id,
    userId: invitee.id,
    workspaceId: id,
    role,
    name: invitee.name ?? null,
    email: invitee.email,
    createdAt: inserted[0].createdAt.toISOString(),
  });
});

// DELETE /api/workspaces/:id/members/:memberId
router.delete("/:id/members/:memberId", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const user = await getUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const wsId = Number(req.params.id);
  const memberId = Number(req.params.memberId);

  const ws = (await db.select().from(workspacesTable).where(eq(workspacesTable.id, wsId)).limit(1))[0];
  if (!ws || ws.ownerId !== user.id) { res.status(403).json({ error: "Only the owner can remove members" }); return; }

  await db.delete(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.id, memberId), eq(workspaceMembersTable.workspaceId, wsId)));
  res.status(204).send();
});

export default router;
