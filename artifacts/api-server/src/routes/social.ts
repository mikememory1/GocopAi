import { Router } from "express";
import { getAuth } from "@clerk/express";
import crypto from "crypto";
import axios from "axios";
import { db, usersTable, socialAccountsTable, scheduledPostsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { PLATFORM_CONFIGS, dispatchPost, type Platform } from "../lib/socialPlatforms";

const router = Router();

const BASE_URL = process.env.REPLIT_APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;

function getRedirectUri(platform: Platform) {
  return `${BASE_URL}/api/social/callback/${platform}`;
}

async function getDbUser(clerkId: string) {
  const rows = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  return rows[0] ?? null;
}

// GET /api/social/accounts — list connected accounts
router.get("/accounts", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const user = await getDbUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const accounts = await db
    .select({
      id: socialAccountsTable.id,
      platform: socialAccountsTable.platform,
      platformUsername: socialAccountsTable.platformUsername,
      platformPageName: socialAccountsTable.platformPageName,
      createdAt: socialAccountsTable.createdAt,
    })
    .from(socialAccountsTable)
    .where(eq(socialAccountsTable.userId, user.id));

  res.json({ accounts });
});

// GET /api/social/connect/:platform — start OAuth flow
router.get("/connect/:platform", requireAuth, async (req, res) => {
  const platform = req.params.platform as Platform;
  const config = PLATFORM_CONFIGS[platform];
  if (!config) { res.status(400).json({ error: "Unknown platform" }); return; }

  const auth = getAuth(req);
  const clientId = process.env[config.clientIdEnv];
  if (!clientId) { res.status(503).json({ error: `${config.name} integration not configured` }); return; }

  // Telegram doesn't use OAuth — handled separately
  if (platform === "telegram") {
    res.status(400).json({ error: "Telegram uses bot token — add via settings" });
    return;
  }

  const state = Buffer.from(JSON.stringify({ userId: auth.userId, platform })).toString("base64url");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(platform),
    response_type: "code",
    scope: config.scopes.join(platform === "tiktok" ? "," : " "),
    state,
  });

  if (platform === "twitter") {
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
    params.set("code_challenge", codeChallenge);
    params.set("code_challenge_method", "S256");
    res.cookie(`tw_cv_${auth.userId}`, codeVerifier, { httpOnly: true, maxAge: 600_000, sameSite: "lax" });
  }

  if (platform === "youtube") {
    params.set("access_type", "offline");
    params.set("prompt", "consent");
  }

  res.redirect(`${config.authUrl}?${params.toString()}`);
});

// GET /api/social/callback/:platform — OAuth callback
router.get("/callback/:platform", async (req, res) => {
  const platform = req.params.platform as Platform;
  const config = PLATFORM_CONFIGS[platform];
  if (!config) { res.status(400).send("Unknown platform"); return; }

  const { code, state, error } = req.query as Record<string, string>;
  if (error) { res.redirect(`/app/publish?error=${encodeURIComponent(error)}`); return; }
  if (!code || !state) { res.status(400).send("Missing code or state"); return; }

  let clerkId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    clerkId = decoded.userId;
  } catch {
    res.status(400).send("Invalid state"); return;
  }

  const clientId = process.env[config.clientIdEnv]!;
  const clientSecret = process.env[config.clientSecretEnv]!;
  const redirectUri = getRedirectUri(platform);

  try {
    let accessToken: string;
    let refreshToken: string | undefined;
    let expiresIn: number | undefined;

    if (platform === "tiktok") {
      const tokenRes = await axios.post(
        config.tokenUrl,
        new URLSearchParams({ client_key: clientId, client_secret: clientSecret, code, grant_type: "authorization_code", redirect_uri: redirectUri }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      accessToken = tokenRes.data.data?.access_token || tokenRes.data.access_token;
      refreshToken = tokenRes.data.data?.refresh_token || tokenRes.data.refresh_token;
      expiresIn = tokenRes.data.data?.expires_in;
    } else if (platform === "twitter") {
      const codeVerifier = (req.cookies as Record<string, string>)[`tw_cv_${clerkId}`] ?? "";
      const creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const tokenRes = await axios.post(
        config.tokenUrl,
        new URLSearchParams({ code, grant_type: "authorization_code", redirect_uri: redirectUri, code_verifier: codeVerifier }),
        { headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" } }
      );
      accessToken = tokenRes.data.access_token;
      refreshToken = tokenRes.data.refresh_token;
      expiresIn = tokenRes.data.expires_in;
    } else {
      const tokenRes = await axios.post(
        config.tokenUrl,
        new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, grant_type: "authorization_code", redirect_uri: redirectUri }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      accessToken = tokenRes.data.access_token;
      refreshToken = tokenRes.data.refresh_token;
      expiresIn = tokenRes.data.expires_in;
    }

    // Fetch platform user info
    let platformUserId: string | undefined;
    let platformUsername: string | undefined;
    let platformPageId: string | undefined;
    let platformPageName: string | undefined;

    if (platform === "linkedin") {
      const me = await axios.get("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      platformUserId = me.data.sub;
      platformUsername = me.data.name || me.data.email;
    } else if (platform === "facebook") {
      const me = await axios.get(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${accessToken}`);
      platformUserId = me.data.id;
      platformUsername = me.data.name;
      const pages = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
      if (pages.data.data?.length > 0) {
        const page = pages.data.data[0];
        platformPageId = page.id;
        platformPageName = page.name;
        accessToken = page.access_token;
      }
    } else if (platform === "instagram") {
      const me = await axios.get(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${accessToken}`);
      platformUserId = me.data.id;
      platformUsername = me.data.name;
      const igAccounts = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account,name&access_token=${accessToken}`);
      if (igAccounts.data.data?.length > 0) {
        for (const page of igAccounts.data.data) {
          if (page.instagram_business_account) {
            platformPageId = page.instagram_business_account.id;
            platformPageName = `Instagram: ${page.name}`;
            break;
          }
        }
      }
    } else if (platform === "threads") {
      const me = await axios.get(`https://graph.threads.net/v1.0/me?fields=id,username&access_token=${accessToken}`);
      platformUserId = me.data.id;
      platformUsername = me.data.username;
    } else if (platform === "twitter") {
      const me = await axios.get("https://api.twitter.com/2/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      platformUserId = me.data.data.id;
      platformUsername = me.data.data.username;
    } else if (platform === "tiktok") {
      const me = await axios.get("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      platformUserId = me.data.data.user.open_id;
      platformUsername = me.data.data.user.display_name;
    } else if (platform === "youtube") {
      const me = await axios.get("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const channel = me.data.items?.[0];
      platformUserId = channel?.id;
      platformUsername = channel?.snippet?.title;
    }

    const user = await getDbUser(clerkId);
    if (!user) { res.status(404).send("User not found"); return; }

    const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined;

    await db
      .insert(socialAccountsTable)
      .values({
        userId: user.id,
        platform: platform as any,
        accessToken,
        refreshToken,
        tokenExpiresAt,
        platformUserId,
        platformUsername,
        platformPageId,
        platformPageName,
      })
      .onConflictDoUpdate({
        target: [socialAccountsTable.userId, socialAccountsTable.platform],
        set: { accessToken, refreshToken, tokenExpiresAt, platformUserId, platformUsername, platformPageId, platformPageName, updatedAt: new Date() },
      });

    res.redirect("/app/publish?connected=" + platform);
  } catch (err: any) {
    req.log?.error({ err }, "Social OAuth callback error");
    res.redirect(`/app/publish?error=oauth_failed`);
  }
});

// DELETE /api/social/accounts/:platform — disconnect
router.delete("/accounts/:platform", requireAuth, async (req, res) => {
  const platform = req.params.platform as Platform;
  const auth = getAuth(req);
  const user = await getDbUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await db.delete(socialAccountsTable).where(
    and(eq(socialAccountsTable.userId, user.id), eq(socialAccountsTable.platform, platform as any))
  );
  res.json({ success: true });
});

// POST /api/social/telegram — connect Telegram via bot token + chat ID
router.post("/telegram", requireAuth, async (req, res) => {
  const { botToken, chatId } = req.body as { botToken: string; chatId: string };
  if (!botToken || !chatId) { res.status(400).json({ error: "botToken and chatId required" }); return; }

  const auth = getAuth(req);
  const user = await getDbUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  try {
    const meRes = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
    const botName = meRes.data.result?.username || "telegram-bot";

    await db
      .insert(socialAccountsTable)
      .values({
        userId: user.id,
        platform: "telegram",
        accessToken: botToken,
        platformUserId: chatId,
        platformUsername: `@${botName}`,
        metadata: JSON.stringify({ chatId }),
      })
      .onConflictDoUpdate({
        target: [socialAccountsTable.userId, socialAccountsTable.platform],
        set: { accessToken: botToken, platformUserId: chatId, platformUsername: `@${botName}`, metadata: JSON.stringify({ chatId }), updatedAt: new Date() },
      });

    res.json({ success: true, botName });
  } catch {
    res.status(400).json({ error: "Invalid bot token or chat ID" });
  }
});

// POST /api/social/publish — publish content to selected platforms
router.post("/publish", requireAuth, async (req, res) => {
  const { text, platforms, mediaUrl, mediaType } = req.body as {
    text: string;
    platforms: Platform[];
    mediaUrl?: string;
    mediaType?: "image" | "video";
  };

  if (!text || !platforms?.length) {
    res.status(400).json({ error: "text and at least one platform required" });
    return;
  }

  const auth = getAuth(req);
  const user = await getDbUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const accounts = await db
    .select()
    .from(socialAccountsTable)
    .where(eq(socialAccountsTable.userId, user.id));

  const results: Record<string, { success: boolean; id?: string; error?: string }> = {};

  await Promise.allSettled(
    platforms.map(async (platform) => {
      const account = accounts.find((a) => a.platform === platform);
      if (!account) {
        results[platform] = { success: false, error: "Account not connected" };
        return;
      }
      try {
        const result = await dispatchPost(platform, {
          text,
          mediaUrl,
          mediaType,
          accessToken: account.accessToken,
          platformUserId: account.platformUserId ?? undefined,
          platformPageId: account.platformPageId ?? undefined,
          metadata: account.metadata ?? undefined,
        });
        results[platform] = { success: true, id: result.id };
      } catch (err: any) {
        results[platform] = { success: false, error: err.message };
      }
    })
  );

  res.json({ results });
});

// GET /api/social/scheduled — list scheduled posts for current user
router.get("/scheduled", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const user = await getDbUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const posts = await db
    .select()
    .from(scheduledPostsTable)
    .where(eq(scheduledPostsTable.userId, user.id))
    .orderBy(desc(scheduledPostsTable.scheduledAt));

  res.json({ posts });
});

// POST /api/social/schedule — create a scheduled post
router.post("/schedule", requireAuth, async (req, res) => {
  const { platforms, caption, mediaObjectPath, mediaType, scheduledAt } = req.body as {
    platforms: string[];
    caption: string;
    mediaObjectPath?: string;
    mediaType?: "image" | "video";
    scheduledAt: string;
  };

  if (!platforms?.length || !caption || !scheduledAt) {
    res.status(400).json({ error: "platforms, caption, and scheduledAt are required" });
    return;
  }

  const schedDate = new Date(scheduledAt);
  if (isNaN(schedDate.getTime()) || schedDate <= new Date()) {
    res.status(400).json({ error: "scheduledAt must be a valid future date" });
    return;
  }

  const auth = getAuth(req);
  const user = await getDbUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const [post] = await db
    .insert(scheduledPostsTable)
    .values({
      userId: user.id,
      platforms,
      caption,
      mediaObjectPath: mediaObjectPath ?? null,
      mediaType: mediaType ?? null,
      scheduledAt: schedDate,
      status: "pending",
    })
    .returning();

  res.status(201).json({ post });
});

// DELETE /api/social/scheduled/:id — cancel a scheduled post
router.delete("/scheduled/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const auth = getAuth(req);
  const user = await getDbUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const [existing] = await db
    .select()
    .from(scheduledPostsTable)
    .where(and(eq(scheduledPostsTable.id, id), eq(scheduledPostsTable.userId, user.id)))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "Post not found" }); return; }
  if (existing.status !== "pending") {
    res.status(409).json({ error: `Cannot cancel a post with status '${existing.status}'` });
    return;
  }

  await db
    .update(scheduledPostsTable)
    .set({ status: "cancelled" })
    .where(eq(scheduledPostsTable.id, id));

  res.json({ success: true });
});

export default router;
