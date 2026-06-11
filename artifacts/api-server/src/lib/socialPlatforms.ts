import axios from "axios";

export type Platform =
  | "linkedin"
  | "facebook"
  | "instagram"
  | "threads"
  | "twitter"
  | "tiktok"
  | "youtube"
  | "telegram";

export interface PlatformConfig {
  name: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
  supportsVideo: boolean;
  supportsText: boolean;
}

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  linkedin: {
    name: "LinkedIn",
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: ["openid", "profile", "email", "w_member_social"],
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    supportsVideo: false,
    supportsText: true,
  },
  facebook: {
    name: "Facebook",
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "publish_video"],
    clientIdEnv: "FACEBOOK_APP_ID",
    clientSecretEnv: "FACEBOOK_APP_SECRET",
    supportsVideo: true,
    supportsText: true,
  },
  instagram: {
    name: "Instagram Reels",
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    scopes: ["instagram_basic", "instagram_content_publish", "pages_show_list", "pages_read_engagement"],
    clientIdEnv: "FACEBOOK_APP_ID",
    clientSecretEnv: "FACEBOOK_APP_SECRET",
    supportsVideo: true,
    supportsText: false,
  },
  threads: {
    name: "Threads",
    authUrl: "https://threads.net/oauth/authorize",
    tokenUrl: "https://graph.threads.net/oauth/access_token",
    scopes: ["threads_basic", "threads_content_publish"],
    clientIdEnv: "THREADS_APP_ID",
    clientSecretEnv: "THREADS_APP_SECRET",
    supportsVideo: false,
    supportsText: true,
  },
  twitter: {
    name: "Twitter / X",
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    clientIdEnv: "TWITTER_CLIENT_ID",
    clientSecretEnv: "TWITTER_CLIENT_SECRET",
    supportsVideo: true,
    supportsText: true,
  },
  tiktok: {
    name: "TikTok",
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: ["user.info.basic", "video.publish", "video.upload"],
    clientIdEnv: "TIKTOK_CLIENT_KEY",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
    supportsVideo: true,
    supportsText: false,
  },
  youtube: {
    name: "YouTube Shorts",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"],
    clientIdEnv: "YOUTUBE_CLIENT_ID",
    clientSecretEnv: "YOUTUBE_CLIENT_SECRET",
    supportsVideo: true,
    supportsText: false,
  },
  telegram: {
    name: "Telegram",
    authUrl: "",
    tokenUrl: "",
    scopes: [],
    clientIdEnv: "TELEGRAM_BOT_TOKEN",
    clientSecretEnv: "TELEGRAM_BOT_TOKEN",
    supportsVideo: true,
    supportsText: true,
  },
};

export interface PostPayload {
  text: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  accessToken: string;
  platformUserId?: string;
  platformPageId?: string;
  metadata?: string;
}

export async function postToLinkedIn(payload: PostPayload): Promise<{ id: string }> {
  const author = `urn:li:person:${payload.platformUserId}`;
  const body: Record<string, unknown> = {
    author,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: payload.text },
        shareMediaCategory: "NONE",
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const res = await axios.post("https://api.linkedin.com/v2/ugcPosts", body, {
    headers: { Authorization: `Bearer ${payload.accessToken}`, "Content-Type": "application/json" },
  });
  return { id: res.data.id };
}

export async function postToFacebook(payload: PostPayload): Promise<{ id: string }> {
  const pageId = payload.platformPageId || payload.platformUserId;
  if (payload.mediaType === "video" && payload.mediaUrl) {
    const res = await axios.post(
      `https://graph.facebook.com/v19.0/${pageId}/videos`,
      { file_url: payload.mediaUrl, description: payload.text, access_token: payload.accessToken }
    );
    return { id: res.data.id };
  }
  const res = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
    message: payload.text,
    access_token: payload.accessToken,
  });
  return { id: res.data.id };
}

export async function postToInstagram(payload: PostPayload): Promise<{ id: string }> {
  const igUserId = payload.platformPageId || payload.platformUserId;
  if (!payload.mediaUrl) throw new Error("Instagram requires a video URL for Reels");
  const containerRes = await axios.post(
    `https://graph.facebook.com/v19.0/${igUserId}/media`,
    {
      video_url: payload.mediaUrl,
      caption: payload.text,
      media_type: "REELS",
      access_token: payload.accessToken,
    }
  );
  const creationId = containerRes.data.id;
  await axios.post(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
    creation_id: creationId,
    access_token: payload.accessToken,
  });
  return { id: creationId };
}

export async function postToThreads(payload: PostPayload): Promise<{ id: string }> {
  const userId = payload.platformUserId;
  const containerRes = await axios.post(
    `https://graph.threads.net/v1.0/${userId}/threads`,
    { text: payload.text, media_type: "TEXT", access_token: payload.accessToken }
  );
  const creationId = containerRes.data.id;
  await new Promise((r) => setTimeout(r, 2000));
  const publishRes = await axios.post(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
    creation_id: creationId,
    access_token: payload.accessToken,
  });
  return { id: publishRes.data.id };
}

export async function postToTwitter(payload: PostPayload): Promise<{ id: string }> {
  const body: Record<string, unknown> = { text: payload.text };
  const res = await axios.post("https://api.twitter.com/2/tweets", body, {
    headers: { Authorization: `Bearer ${payload.accessToken}`, "Content-Type": "application/json" },
  });
  return { id: res.data.data.id };
}

export async function postToTikTok(payload: PostPayload): Promise<{ id: string }> {
  if (!payload.mediaUrl) throw new Error("TikTok requires a video URL");
  const initRes = await axios.post(
    "https://open.tiktokapis.com/v2/post/publish/video/init/",
    {
      post_info: { title: payload.text, privacy_level: "PUBLIC_TO_EVERYONE", disable_duet: false, disable_comment: false, disable_stitch: false },
      source_info: { source: "PULL_FROM_URL", video_url: payload.mediaUrl },
    },
    { headers: { Authorization: `Bearer ${payload.accessToken}`, "Content-Type": "application/json" } }
  );
  return { id: initRes.data.data.publish_id };
}

export async function postToYouTube(payload: PostPayload): Promise<{ id: string }> {
  if (!payload.mediaUrl) throw new Error("YouTube requires a video URL");
  const metaRes = await axios.post(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      snippet: { title: payload.text.slice(0, 100), description: payload.text, categoryId: "22" },
      status: { privacyStatus: "public" },
    },
    {
      headers: {
        Authorization: `Bearer ${payload.accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "video/*",
      },
    }
  );
  return { id: metaRes.headers.location || "pending" };
}

export async function postToTelegram(payload: PostPayload): Promise<{ id: string }> {
  const meta = payload.metadata ? JSON.parse(payload.metadata) : {};
  const chatId = meta.chatId;
  if (!chatId) throw new Error("Telegram requires a chat/channel ID");
  const botToken = payload.accessToken;
  if (payload.mediaType === "video" && payload.mediaUrl) {
    const res = await axios.post(`https://api.telegram.org/bot${botToken}/sendVideo`, {
      chat_id: chatId,
      video: payload.mediaUrl,
      caption: payload.text,
    });
    return { id: String(res.data.result.message_id) };
  }
  const res = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatId,
    text: payload.text,
    parse_mode: "HTML",
  });
  return { id: String(res.data.result.message_id) };
}

export async function dispatchPost(platform: Platform, payload: PostPayload): Promise<{ id: string }> {
  switch (platform) {
    case "linkedin": return postToLinkedIn(payload);
    case "facebook": return postToFacebook(payload);
    case "instagram": return postToInstagram(payload);
    case "threads": return postToThreads(payload);
    case "twitter": return postToTwitter(payload);
    case "tiktok": return postToTikTok(payload);
    case "youtube": return postToYouTube(payload);
    case "telegram": return postToTelegram(payload);
  }
}
