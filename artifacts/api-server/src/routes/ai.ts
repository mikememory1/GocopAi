import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, aiGenerationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { callAi, estimateCredits } from "../lib/ai";

const router = Router();

// Platform-specific constraints for social/video tools (T005)
const PLATFORM_CONSTRAINTS: Record<string, string> = {
  twitter: "PLATFORM RULES — Twitter/X: Max 280 characters per tweet. Write as a thread if long-form (number tweets 1/, 2/ etc.). No more than 2-3 hashtags. Keep sentences punchy. Avoid fluff.",
  instagram: "PLATFORM RULES — Instagram: Caption up to 2,200 chars but ideal is 125-150 chars for above-the-fold. Use line breaks for readability. 5-10 relevant hashtags at the end. Strong visual hook in first sentence. Include a CTA (comment, save, share).",
  linkedin: "PLATFORM RULES — LinkedIn: Up to 3,000 chars. Professional but human. Use short paragraphs, white space, and bold key points with ALL CAPS or *asterisks*. 3-5 relevant hashtags. End with a question to drive comments. Thought leadership tone.",
  tiktok: "PLATFORM RULES — TikTok: Short and punchy (max 150 chars caption). Hook must be in first word/phrase. Trendy language, emojis, and Gen Z/Millennial friendly. 3-5 trending hashtags. Encourage duets/stitches. Script should be <60 seconds spoken.",
  facebook: "PLATFORM RULES — Facebook: Up to 63,206 chars but optimal is 40-80 words. Conversational and community-focused. Minimal hashtags (1-2 max). Ask questions to drive engagement. Include emoji sparingly for warmth.",
  pinterest: "PLATFORM RULES — Pinterest: Descriptions up to 500 chars. SEO-rich keywords woven naturally. Inspiring and aspirational tone. Visual language (imagine, picture, discover). Include a clear CTA. Evergreen content preferred.",
  youtube: "PLATFORM RULES — YouTube: Script for 8-15 minute video unless specified. Include clear timestamps/chapters. Hook in first 30 seconds is critical. Strong subscribe CTA. SEO keywords in title and description. Chapters improve retention.",
  youtube_shorts: "PLATFORM RULES — YouTube Shorts: Max 60 seconds. Hook in first 3 seconds. Vertical format (9:16). Keep script to ~120-150 words. High energy, quick cuts. Clear single topic. CTA to subscribe in last 3 seconds.",
  reels: "PLATFORM RULES — Instagram Reels: 15-90 seconds. Trending audio reference if applicable. Hook in first 2 seconds. Text overlays on screen. Entertaining or educational. End with strong CTA. Trending sounds increase reach.",
  google_ads: "PLATFORM RULES — Google Ads: Headlines max 30 chars each (write 10-15 options). Descriptions max 90 chars. Include target keyword in headline. Feature unique selling point. Strong action verb (Get, Try, Save, Discover). Avoid punctuation at end of headlines.",
};

function buildPlatformContext(i: Record<string, string>): string {
  const platform = (i.platform || "").toLowerCase().replace(/[\s/]+/g, "_");
  const constraint = PLATFORM_CONSTRAINTS[platform] || "";
  const brandVoice = i.brandVoice ? `\nBRAND VOICE: ${i.brandVoice}` : "";
  const productCtx = i.productContext ? `\nPRODUCT DETAILS:\n${i.productContext}` : "";
  return [constraint, brandVoice, productCtx].filter(Boolean).join("\n");
}

const TOOL_PROMPTS: Record<
  string,
  (inputs: Record<string, string>) => { system: string; user: string }
> = {
  video_script: (i) => {
    const ctx = buildPlatformContext(i);
    const platform = i.platform || "YouTube";
    return {
      system: `You are an expert video scriptwriter for ${platform}. Write engaging, well-structured video scripts that hook viewers and deliver value. Format with clear sections: Hook, Intro, Main Content (with subsections), CTA.${ctx ? `\n\n${ctx}` : ""}`,
      user: `Write a video script for the following:\nTopic: ${i.topic || "provided topic"}\nTarget Audience: ${i.audience || "general audience"}\nTone: ${i.tone || "conversational"}\nPlatform: ${platform}`,
    };
  },
  video_hook: (i) => {
    const platform = i.platform || "YouTube";
    return {
      system: `You are an expert at writing viral video hooks for ${platform}. Create 5 different hook variations that immediately grab attention in the first 3-5 seconds.`,
      user: `Write 5 powerful hooks for a ${platform} video about:\nTopic: ${i.topic || "provided topic"}\nAudience: ${i.audience || "general audience"}\nTone: ${i.tone || "engaging"}`,
    };
  },
  video_outline: (i) => {
    const platform = i.platform || "YouTube";
    const ctx = buildPlatformContext(i);
    return {
      system: `You are a video content strategist for ${platform}. Create detailed video outlines with timestamps, key points, and talking notes.${ctx ? `\n\n${ctx}` : ""}`,
      user: `Create a detailed video outline for:\nTopic: ${i.topic || "provided topic"}\nPlatform: ${platform}\nAudience: ${i.audience || "general audience"}`,
    };
  },
  seo_outline: (i) => ({
    system: "You are an expert SEO content strategist. Create detailed, SEO-optimised blog post outlines with H2/H3 structure, keyword integration, and user intent focus.",
    user: `Create an SEO-optimised blog outline for:\nMain Keyword: ${i.keyword || "provided keyword"}\nAudience: ${i.audience || "general audience"}\nTone: ${i.tone || "professional"}`,
  }),
  seo_meta: (i) => ({
    system: "You are an expert SEO copywriter. Write compelling SEO title tags and meta descriptions that improve click-through rates while targeting the right keywords.",
    user: `Write SEO title and meta description for:\nMain Keyword: ${i.keyword || "provided keyword"}\nTopic: ${i.topic || "blog post"}\nTone: ${i.tone || "professional"}\n\nProvide 3 variations of each.`,
  }),
  seo_keywords: (i) => ({
    system: "You are an expert SEO keyword researcher. Generate comprehensive keyword clusters with search intent, difficulty estimates, and content angle suggestions.",
    user: `Generate keyword clusters for:\nMain Keyword: ${i.keyword || "provided keyword"}\nNiche/Industry: ${i.audience || "general"}\n\nOrganise into topical clusters with at least 5 keywords each.`,
  }),
  social_post: (i) => {
    const ctx = buildPlatformContext(i);
    const platform = i.platform || "LinkedIn";
    return {
      system: `You are a social media expert. Write platform-native posts that drive engagement, using appropriate formatting, hashtags, and CTAs for each platform.${ctx ? `\n\n${ctx}` : ""}`,
      user: `Write social media posts for:\nPlatform: ${platform}\nTopic: ${i.topic || "provided topic"}\nTone: ${i.tone || "professional"}\n\nWrite 3 different variations, each strictly following the platform rules above.`,
    };
  },
  social_carousel: (i) => {
    const ctx = buildPlatformContext(i);
    const platform = i.platform || "LinkedIn";
    return {
      system: `You are a social media content creator specialising in carousel posts. Create structured carousel outlines with compelling hooks, value slides, and strong CTAs.${ctx ? `\n\n${ctx}` : ""}`,
      user: `Create a carousel post outline for:\nPlatform: ${platform}\nTopic: ${i.topic || "provided topic"}\nTone: ${i.tone || "professional"}\n\nInclude slide-by-slide content. Each slide: title + 1-2 bullet points.`,
    };
  },
  social_calendar: (i) => {
    const ctx = buildPlatformContext(i);
    const platform = i.platform || "LinkedIn";
    return {
      system: `You are a content strategist. Create practical content calendar ideas with variety in formats, topics, and angles for sustained audience engagement.${ctx ? `\n\n${ctx}` : ""}`,
      user: `Generate a 30-day content calendar for:\nPlatform: ${platform}\nTopic/Niche: ${i.topic || "provided topic"}\nTone: ${i.tone || "professional"}\n\nFormat as: Day X | Format | Angle/Hook`,
    };
  },
  ads_copy: (i) => {
    const ctx = buildPlatformContext(i);
    const platform = i.platform || "Facebook";
    return {
      system: `You are a direct response copywriter. Write high-converting ad copy that speaks to pain points, showcases the offer clearly, and drives action.${ctx ? `\n\n${ctx}` : ""}`,
      user: `Write ad copy for:\nOffer: ${i.offer || "provided offer"}\nPlatform: ${platform}\nAudience: ${i.audience || "general audience"}\n${i.productContext ? `Product: ${i.productContext}\n` : ""}\nProvide: Primary Text, Headline, Description — 3 variations.`,
    };
  },
  ads_headline: (i) => {
    const ctx = buildPlatformContext(i);
    const platform = i.platform || "Google Ads";
    return {
      system: `You are an expert ad copywriter specialising in headlines. Write headline variations that are punchy, clear, and conversion-focused.${ctx ? `\n\n${ctx}` : ""}`,
      user: `Write 10 ad headline variations for:\nOffer: ${i.offer || "provided offer"}\nPlatform: ${platform}\nAudience: ${i.audience || "general audience"}`,
    };
  },
  ads_angle: (i) => ({
    system: "You are a marketing strategist. Identify unique angles, hooks, and approaches for ad campaigns that differentiate from competition and resonate with the target audience.",
    user: `Generate 5 creative ad angles for:\nOffer: ${i.offer || "provided offer"}\nAudience: ${i.audience || "general audience"}\nPlatform: ${i.platform || "Facebook"}`,
  }),
  blog_draft: (i) => ({
    system: "You are an expert content writer. Write comprehensive, well-researched blog posts that provide genuine value, are engaging to read, and are optimised for SEO.",
    user: `Write a full blog post draft for:\nTopic: ${i.topic || "provided topic"}\nOutline: ${i.outline || "create your own structure"}\n\nAim for 800-1200 words with clear sections.`,
  }),
  blog_intro: (i) => ({
    system: "You are an expert content writer. Write compelling blog introductions that hook the reader in the first paragraph and make them want to read more.",
    user: `Write 3 different blog introduction variations for:\nTopic: ${i.topic || "provided topic"}\nAudience: ${i.audience || "general audience"}`,
  }),
  blog_conclusion: (i) => ({
    system: "You are an expert content writer. Write powerful blog conclusions that summarise key points, reinforce the main message, and include a strong CTA.",
    user: `Write 3 different blog conclusion variations for:\nTopic: ${i.topic || "provided topic"}\nKey Points: ${i.keyPoints || "summarise the article"}`,
  }),
  generic: (i) => ({
    system: `You are a helpful AI assistant specialising in ${i.useCase || "marketing and business content"}. Provide high-quality, actionable responses.`,
    user: i.prompt || "Please provide a helpful response.",
  }),
};

// POST /api/ai/generate
router.post("/generate", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const { toolType, inputs, model } = req.body as {
    toolType: string;
    inputs: Record<string, string>;
    model?: string;
  };

  if (!toolType || !inputs) {
    res.status(400).json({ error: "toolType and inputs are required" });
    return;
  }

  // Get user with credits
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
  const userCredits = Number(user.credits);

  // Pre-check: rough estimate of credits needed
  const estimatedCreditsNeeded = estimateCredits(toolType, 500);
  if (userCredits < estimatedCreditsNeeded) {
    res.status(402).json({
      error: `Insufficient credits. You have ${userCredits} credits but need approximately ${estimatedCreditsNeeded}.`,
    });
    return;
  }

  // Get prompt builder
  const promptBuilder = TOOL_PROMPTS[toolType] ?? TOOL_PROMPTS.generic;
  const { system, user: userPrompt } = promptBuilder(inputs);

  // Call AI
  const aiResult = await callAi({
    systemPrompt: system,
    userPrompt,
    temperature: 0.7,
    maxTokens: toolType === "blog_draft" ? 2000 : 1500,
    model: model || undefined,
  });

  const creditsUsed = estimateCredits(toolType, aiResult.tokensEstimate);

  // Deduct credits
  await db
    .update(usersTable)
    .set({ credits: sql`${usersTable.credits} - ${creditsUsed}` })
    .where(eq(usersTable.id, user.id));

  // Build input summary
  const inputSummary = Object.entries(inputs)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${String(v).slice(0, 50)}`)
    .join(", ");

  // Log generation
  const inserted = await db
    .insert(aiGenerationsTable)
    .values({
      userId: user.id,
      toolType,
      inputSummary,
      output: aiResult.content,
      tokensEstimate: aiResult.tokensEstimate,
      creditsUsed: String(creditsUsed),
    })
    .returning();

  const generation = inserted[0];

  res.json({
    id: generation.id,
    output: aiResult.content,
    creditsUsed,
    tokensEstimate: aiResult.tokensEstimate,
  });
});

// GET /api/ai/generations
router.get("/generations", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const toolType = req.query.tool_type as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, auth.userId!))
    .limit(1);

  if (!users[0]) {
    res.json([]);
    return;
  }

  let query = db
    .select()
    .from(aiGenerationsTable)
    .where(eq(aiGenerationsTable.userId, users[0].id))
    .orderBy(desc(aiGenerationsTable.createdAt))
    .limit(limit);

  const results = await query;

  const filtered = toolType
    ? results.filter((g) => g.toolType === toolType)
    : results;

  res.json(
    filtered.map((g) => ({
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

// GET /api/ai/generations/:id
router.get("/generations/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const results = await db
    .select()
    .from(aiGenerationsTable)
    .where(eq(aiGenerationsTable.id, id))
    .limit(1);

  if (!results[0]) {
    res.status(404).json({ error: "Generation not found" });
    return;
  }

  const g = results[0];
  res.json({
    id: g.id,
    userId: g.userId,
    toolType: g.toolType,
    inputSummary: g.inputSummary,
    output: g.output,
    tokensEstimate: g.tokensEstimate,
    creditsUsed: Number(g.creditsUsed),
    createdAt: g.createdAt.toISOString(),
  });
});

export default router;
