import { db, socialAccountsTable, scheduledPostsTable } from "@workspace/db";
import { eq, and, lte, inArray } from "drizzle-orm";
import { dispatchPost, type Platform } from "./socialPlatforms";
import { logger } from "./logger";

const POLL_INTERVAL_MS = 30_000;

async function processDuePosts() {
  const now = new Date();

  let duePosts: (typeof scheduledPostsTable.$inferSelect)[];
  try {
    duePosts = await db
      .select()
      .from(scheduledPostsTable)
      .where(
        and(
          eq(scheduledPostsTable.status, "pending"),
          lte(scheduledPostsTable.scheduledAt, now),
        ),
      );
  } catch (err) {
    logger.error({ err }, "Scheduler: failed to query due posts");
    return;
  }

  if (duePosts.length === 0) return;

  logger.info({ count: duePosts.length }, "Scheduler: processing due posts");

  await Promise.allSettled(
    duePosts.map(async (post) => {
      await db
        .update(scheduledPostsTable)
        .set({ status: "publishing" })
        .where(eq(scheduledPostsTable.id, post.id));

      const accounts = await db
        .select()
        .from(socialAccountsTable)
        .where(
          and(
            eq(socialAccountsTable.userId, post.userId),
            inArray(socialAccountsTable.platform, post.platforms as Platform[]),
          ),
        );

      const mediaUrl = post.mediaObjectPath
        ? `${process.env.REPLIT_APP_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN}`}/api/storage/objects/${post.mediaObjectPath.replace(/^\/objects\//, "")}`
        : undefined;

      const results: Record<string, { success: boolean; id?: string; error?: string }> = {};

      await Promise.allSettled(
        (post.platforms as Platform[]).map(async (platform) => {
          const account = accounts.find((a) => a.platform === platform);
          if (!account) {
            results[platform] = { success: false, error: "Account not connected" };
            return;
          }
          try {
            const result = await dispatchPost(platform, {
              text: post.caption,
              mediaUrl,
              mediaType: post.mediaType as "image" | "video" | undefined,
              accessToken: account.accessToken,
              platformUserId: account.platformUserId ?? undefined,
              platformPageId: account.platformPageId ?? undefined,
              metadata: account.metadata ?? undefined,
            });
            results[platform] = { success: true, id: result.id };
          } catch (err: any) {
            results[platform] = { success: false, error: err.message };
          }
        }),
      );

      const anySuccess = Object.values(results).some((r) => r.success);
      const allFailed = Object.values(results).every((r) => !r.success);

      await db
        .update(scheduledPostsTable)
        .set({
          status: allFailed ? "failed" : "published",
          publishResults: results,
          errorMessage: allFailed ? "All platforms failed" : undefined,
        })
        .where(eq(scheduledPostsTable.id, post.id));

      logger.info({ postId: post.id, results }, "Scheduler: post processed");
    }),
  );
}

export function startScheduler() {
  logger.info("Scheduler: started");
  setInterval(() => {
    processDuePosts().catch((err) =>
      logger.error({ err }, "Scheduler: unhandled error"),
    );
  }, POLL_INTERVAL_MS);
  processDuePosts().catch((err) =>
    logger.error({ err }, "Scheduler: initial run error"),
  );
}
