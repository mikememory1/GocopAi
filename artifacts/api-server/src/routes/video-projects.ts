import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, videoProjectsTable, videoJobsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

async function getUserId(clerkId: string): Promise<number | null> {
  const users = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  return users[0]?.id ?? null;
}

function serializeProject(p: typeof videoProjectsTable.$inferSelect) {
  return {
    ...p,
    brollJobIds: (p.brollJobIds as number[]) ?? [],
    createdAt: p.createdAt.toISOString(),
  };
}

// GET /api/video-projects
router.get("/", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const projects = await db.select().from(videoProjectsTable)
    .where(eq(videoProjectsTable.userId, userId))
    .orderBy(videoProjectsTable.createdAt);

  res.json(projects.map(serializeProject));
});

// POST /api/video-projects
router.post("/", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const { name, script, voiceoverJobId, talkingHeadJobId, brollJobIds } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }

  const inserted = await db.insert(videoProjectsTable).values({
    userId,
    name,
    script: script ?? null,
    voiceoverJobId: voiceoverJobId ?? null,
    talkingHeadJobId: talkingHeadJobId ?? null,
    brollJobIds: brollJobIds ?? [],
  }).returning();

  res.status(201).json(serializeProject(inserted[0]));
});

// GET /api/video-projects/:id  (with full job details)
router.get("/:id", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const id = Number(req.params.id);
  const projects = await db.select().from(videoProjectsTable)
    .where(and(eq(videoProjectsTable.id, id), eq(videoProjectsTable.userId, userId))).limit(1);
  if (!projects[0]) { res.status(404).json({ error: "Not found" }); return; }

  const p = projects[0];
  const brollIds = (p.brollJobIds as number[]) ?? [];

  const jobIdsToFetch = [p.voiceoverJobId, p.talkingHeadJobId, ...brollIds].filter((x): x is number => x != null);

  const jobs = jobIdsToFetch.length > 0
    ? await db.select().from(videoJobsTable).where(inArray(videoJobsTable.id, jobIdsToFetch))
    : [];

  const jobMap = Object.fromEntries(jobs.map(j => [j.id, {
    id: j.id,
    jobType: j.jobType,
    status: j.status,
    outputUrl: j.outputUrl ?? null,
    inputText: j.inputText,
    errorMessage: j.errorMessage ?? null,
    createdAt: j.createdAt.toISOString(),
  }]));

  res.json({
    ...serializeProject(p),
    voiceoverJob: p.voiceoverJobId ? (jobMap[p.voiceoverJobId] ?? null) : null,
    talkingHeadJob: p.talkingHeadJobId ? (jobMap[p.talkingHeadJobId] ?? null) : null,
    brollJobs: brollIds.map(id => jobMap[id]).filter(Boolean),
  });
});

// PUT /api/video-projects/:id
router.put("/:id", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const id = Number(req.params.id);
  const { name, script, voiceoverJobId, talkingHeadJobId, brollJobIds } = req.body;

  const existing = await db.select().from(videoProjectsTable)
    .where(and(eq(videoProjectsTable.id, id), eq(videoProjectsTable.userId, userId))).limit(1);
  if (!existing[0]) { res.status(404).json({ error: "Not found" }); return; }

  const updated = await db.update(videoProjectsTable).set({
    ...(name !== undefined && { name }),
    ...(script !== undefined && { script }),
    ...(voiceoverJobId !== undefined && { voiceoverJobId }),
    ...(talkingHeadJobId !== undefined && { talkingHeadJobId }),
    ...(brollJobIds !== undefined && { brollJobIds }),
  }).where(and(eq(videoProjectsTable.id, id), eq(videoProjectsTable.userId, userId))).returning();

  res.json(serializeProject(updated[0]));
});

// DELETE /api/video-projects/:id
router.delete("/:id", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = await getUserId(auth.userId!);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const id = Number(req.params.id);
  await db.delete(videoProjectsTable)
    .where(and(eq(videoProjectsTable.id, id), eq(videoProjectsTable.userId, userId)));
  res.status(204).send();
});

export default router;
