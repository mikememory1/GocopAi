import { Router } from "express";

const router = Router();

const TEMPLATES = [
  // ── AIDA Framework ──
  {
    id: "aida-product-launch",
    category: "ads",
    name: "Product Launch Ad",
    framework: "AIDA",
    description: "Attention → Interest → Desire → Action. Classic direct response formula for product ads.",
    fields: [
      { key: "product", label: "Product Name", placeholder: "e.g. ErgoPro Standing Desk" },
      { key: "benefit", label: "Key Benefit", placeholder: "e.g. eliminate back pain" },
      { key: "audience", label: "Target Audience", placeholder: "e.g. remote workers aged 30–50" },
      { key: "offer", label: "Offer / CTA", placeholder: "e.g. 20% off + free shipping today" },
    ],
    prompt: "Write ad copy using the AIDA framework for {product}. Benefit: {benefit}. Audience: {audience}. Offer: {offer}. Structure: Attention (bold hook), Interest (problem agitation), Desire (product as solution with proof), Action (clear CTA). Write 3 variations.",
    exampleOutput: null,
  },
  {
    id: "aida-email",
    category: "email",
    name: "Promotional Email",
    framework: "AIDA",
    description: "Email campaign copy built on the AIDA structure with subject line, preview text, and body.",
    fields: [
      { key: "product", label: "Product / Offer", placeholder: "e.g. Summer sale — 30% off everything" },
      { key: "audience", label: "Subscriber Type", placeholder: "e.g. past customers" },
      { key: "deadline", label: "Urgency / Deadline", placeholder: "e.g. ends Sunday midnight" },
    ],
    prompt: "Write a promotional email using AIDA for: {product}. Subscriber: {audience}. Deadline: {deadline}. Include: subject line (under 50 chars), preview text (under 90 chars), and full email body with a single CTA button.",
    exampleOutput: null,
  },

  // ── PAS Framework ──
  {
    id: "pas-facebook-ad",
    category: "ads",
    name: "Facebook / Meta Ad",
    framework: "PAS",
    description: "Problem → Agitate → Solution. High-converting structure for social media ads.",
    fields: [
      { key: "problem", label: "Core Problem", placeholder: "e.g. wasting hours writing product descriptions" },
      { key: "product", label: "Your Solution", placeholder: "e.g. GoCopyAI" },
      { key: "proof", label: "Social Proof", placeholder: "e.g. 10,000 stores trust us" },
      { key: "cta", label: "Call to Action", placeholder: "e.g. Try free for 7 days" },
    ],
    prompt: "Write a Facebook ad using PAS for problem: '{problem}'. Solution: {product}. Proof: {proof}. CTA: {cta}. Write primary text (150 words max), headline (40 chars), and description (25 chars).",
    exampleOutput: null,
  },
  {
    id: "pas-landing-page",
    category: "blog",
    name: "Landing Page Copy",
    framework: "PAS",
    description: "Full above-the-fold landing page copy using the PAS persuasion structure.",
    fields: [
      { key: "product", label: "Product / Service", placeholder: "e.g. Organic dog food subscription" },
      { key: "problem", label: "Customer Pain Point", placeholder: "e.g. fillers and preservatives in pet food" },
      { key: "audience", label: "Target Customer", placeholder: "e.g. health-conscious dog owners" },
    ],
    prompt: "Write landing page copy using PAS for: {product}. Pain: {problem}. Audience: {audience}. Include: hero headline + subheadline, pain section (2-3 sentences), agitation (what happens if they don't fix it), solution section, 3 feature bullets, and a CTA.",
    exampleOutput: null,
  },

  // ── BAB Framework ──
  {
    id: "bab-social-post",
    category: "social",
    name: "Transformation Social Post",
    framework: "Before–After–Bridge",
    description: "Before → After → Bridge. Shows transformation and positions your product as the bridge.",
    fields: [
      { key: "before", label: "Before State (struggle)", placeholder: "e.g. spending 3 hours writing one ad" },
      { key: "after", label: "After State (result)", placeholder: "e.g. writing 10 ads in 5 minutes" },
      { key: "product", label: "The Bridge (your product)", placeholder: "e.g. GoCopyAI" },
    ],
    prompt: "Write a social media post using Before-After-Bridge. Before: {before}. After: {after}. Bridge: {product}. Write 3 variations for different platforms (LinkedIn, Instagram, TikTok). Each should be under 150 words with relevant hashtags.",
    exampleOutput: null,
  },

  // ── Hook Frameworks ──
  {
    id: "hook-5-variations",
    category: "video",
    name: "5 Viral Video Hooks",
    framework: "Hook Formula",
    description: "5 proven hook formulas for TikTok, Reels and YouTube Shorts — grab attention in 3 seconds.",
    fields: [
      { key: "topic", label: "Video Topic", placeholder: "e.g. how to rank #1 on Google for free" },
      { key: "audience", label: "Target Viewer", placeholder: "e.g. small business owners" },
    ],
    prompt: "Write 5 different video hooks for topic: '{topic}' targeting {audience}. Use these 5 formulas: 1) Bold claim, 2) Curiosity gap, 3) Controversial statement, 4) Direct question, 5) Story opener. Each hook max 15 words.",
    exampleOutput: null,
  },
  {
    id: "hook-tiktok",
    category: "video",
    name: "TikTok Script (Hook + Story + CTA)",
    framework: "Hook + Story + CTA",
    description: "Full TikTok-native short video script with a scroll-stopping hook, fast-paced story, and clear CTA.",
    fields: [
      { key: "topic", label: "Topic / Product", placeholder: "e.g. my skincare routine that cleared my acne" },
      { key: "duration", label: "Duration", placeholder: "e.g. 30 seconds" },
    ],
    prompt: "Write a TikTok script for: '{topic}'. Duration: {duration}. Format: [HOOK] (first 3 seconds, text on screen), [STORY] (fast-paced, conversational, relatable), [CTA] (clear single action). Include camera directions and on-screen text suggestions.",
    exampleOutput: null,
  },

  // ── SEO Templates ──
  {
    id: "seo-product-description",
    category: "seo",
    name: "Shopify Product Description",
    framework: "SEO + Conversion",
    description: "SEO-optimised product description that ranks and converts — structured for Shopify.",
    fields: [
      { key: "product", label: "Product Name", placeholder: "e.g. Merino Wool Running Socks" },
      { key: "features", label: "Key Features", placeholder: "e.g. moisture-wicking, seamless toe, anti-blister" },
      { key: "keyword", label: "Target Keyword", placeholder: "e.g. best running socks for long distance" },
    ],
    prompt: "Write an SEO-optimised product description for Shopify. Product: {product}. Features: {features}. Target keyword: '{keyword}'. Structure: H1 title with keyword, 2-sentence hook, 3-4 bullet benefits, 1-paragraph story/social proof, CTA. Under 300 words. Keyword density: natural, not forced.",
    exampleOutput: null,
  },
  {
    id: "seo-blog-pillar",
    category: "seo",
    name: "Pillar Blog Post Outline",
    framework: "SEO Pillar Content",
    description: "Comprehensive blog post outline designed to rank for competitive keywords and attract backlinks.",
    fields: [
      { key: "keyword", label: "Target Keyword", placeholder: "e.g. how to start a Shopify store" },
      { key: "audience", label: "Reader", placeholder: "e.g. first-time ecommerce entrepreneurs" },
      { key: "wordCount", label: "Target Word Count", placeholder: "e.g. 2500 words" },
    ],
    prompt: "Create a pillar blog post outline for keyword: '{keyword}'. Reader: {audience}. Length: {wordCount}. Include: SEO title (under 60 chars), meta description (under 155 chars), intro outline, H2 sections with H3 subsections, internal link suggestions, FAQ section, conclusion with CTA. Note search intent and semantic keywords for each section.",
    exampleOutput: null,
  },

  // ── Ecommerce Niche Templates ──
  {
    id: "ecom-flash-sale",
    category: "ads",
    name: "Flash Sale Campaign (Full Kit)",
    framework: "Urgency + FOMO",
    description: "Complete copy kit for a 24–72 hour flash sale: ad copy, email subject lines, and social posts.",
    fields: [
      { key: "store", label: "Store / Brand Name", placeholder: "e.g. BarkBox" },
      { key: "discount", label: "Discount", placeholder: "e.g. 40% off everything" },
      { key: "deadline", label: "Sale Deadline", placeholder: "e.g. ends tonight at midnight" },
      { key: "product", label: "Hero Product (optional)", placeholder: "e.g. our bestselling dog bed" },
    ],
    prompt: "Write a complete flash sale copy kit for {store}. Discount: {discount}. Deadline: {deadline}. Hero product: {product}. Include: 1) Facebook ad (primary text + headline + description), 2) 3 email subject lines with preview text, 3) Instagram caption with hashtags, 4) SMS message (under 160 chars). All copy must create urgency without being spammy.",
    exampleOutput: null,
  },
  {
    id: "ecom-product-launch",
    category: "ads",
    name: "New Product Launch Kit",
    framework: "Launch Sequence",
    description: "Multi-channel copy for launching a new product — pre-launch teaser, launch day, and follow-up.",
    fields: [
      { key: "product", label: "Product Name", placeholder: "e.g. AeroLite Wireless Earbuds" },
      { key: "benefit", label: "Hero Benefit", placeholder: "e.g. 40-hour battery life, gym-proof" },
      { key: "audience", label: "Target Customer", placeholder: "e.g. fitness enthusiasts" },
      { key: "price", label: "Price Point", placeholder: "e.g. $89 (launch price $69)" },
    ],
    prompt: "Write a product launch copy kit for: {product}. Hero benefit: {benefit}. Audience: {audience}. Price: {price}. Include: 1) Pre-launch teaser post (Instagram), 2) Launch day Facebook ad, 3) Launch day email (subject + body), 4) 3 ad headlines for Google/Meta, 5) YouTube description for product video.",
    exampleOutput: null,
  },
];

// GET /api/templates
router.get("/", async (req, res): Promise<void> => {
  const category = req.query.category as string | undefined;
  const filtered = category
    ? TEMPLATES.filter(t => t.category === category)
    : TEMPLATES;
  res.json(filtered);
});

export default router;
export { TEMPLATES };
