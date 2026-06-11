# GoCopyAI

A full marketing AI SaaS platform built for ecommerce businesses. Includes a Business Maturity Quiz funnel, 15+ AI tool categories, credits system, Stripe billing, Shopify/WooCommerce integration, video production pipeline, and admin panel.

**Live URL:** https://gocopyai.com
**Replit URL:** https://asset-manager--mikememory1.replit.app

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/web run dev` — run the frontend (port 22333)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Recharts
- Auth: Clerk (Replit-managed, email/password + OAuth)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (single source of truth)
- `lib/db/src/schema/` — Database schema (users, quiz_results, ai_generations, audit_logs, etc.)
- `artifacts/api-server/src/routes/` — Backend route handlers
- `artifacts/api-server/src/lib/ai.ts` — AI abstraction layer (OpenAI) with platform-specific prompt injection
- `artifacts/api-server/src/lib/auth.ts` — Auth middleware (requireAuth, requireAdmin)
- `artifacts/api-server/src/data/quizQuestions.ts` — 22 quiz questions + scoring
- `artifacts/api-server/src/data/plans.ts` — Stripe plan definitions
- `artifacts/web/src/` — React frontend
- `artifacts/web/src/App.tsx` — All routes (flat routing — DO NOT use nested Route wrappers)
- `artifacts/web/src/components/layout/AppLayout.tsx` — Sidebar + shell for all /app/* pages

## Architecture decisions

- Clerk handles all auth (email/password, OAuth) — no custom auth code needed
- Quiz scoring uses weighted category scores → maps to stage (Early/Growing/Scaling/Optimised)
- AI abstraction layer calls OpenAI but is structured to swap providers easily
- Credits checked pre-generation, deducted post-generation via SQL arithmetic
- Stripe runs server-side only; webhook updates plan/credits on subscription events
- **Routing: FLAT only** — all /app/* routes are declared individually in App.tsx. Do NOT wrap them in a parent `<Route path="/app*">` — wouter v3 strips the `/app` prefix for nested routes causing NotFound errors in production.

## Product — All Features

### Core Tools
- **Video Script Generator** — scripts, hooks, outlines for YouTube, TikTok, Reels, Shorts, LinkedIn, Facebook
- **SEO Tools** — blog outlines, meta titles/descriptions, keyword clusters
- **Social Media Tools** — platform-native posts for Twitter, LinkedIn, Instagram, TikTok, Facebook, Pinterest (with character limit enforcement)
- **Ad Copy Generator** — Facebook, Google, Instagram ads (3 variants)
- **Blog Writing Tools** — full drafts, intros, conclusions
- **Generic AI Tool** — free-form AI generation

### Power Features
- **Brand Voice Profiles** — save tone/personality, auto-injected into all generations
- **Content Calendar** — plan a full month of content across all channels
- **Competitor Analysis** — URL + name → positioning gaps, audience, content opportunities
- **Template Library** — 10+ proven frameworks (PAS, AIDA, FAB, hooks, etc.)
- **A/B Variant Generator** — side-by-side copy variants with thumbs up/down feedback loop
- **Video Projects Workspace** — manage AI video production jobs (ElevenLabs, D-ID, HeyGen, Runway, Luma)
- **Agency Workspaces** — multi-client management with team roles

### Integrations
- **Shopify** — connect store, pull live product data into prompts
- **WooCommerce** — same for WordPress stores

### Platform
- **Business Maturity Quiz** — 22 questions, AI-generated personalised action plan
- **Dashboard** — credits, recent generations, quiz result, onboarding banner for new users
- **Billing** — Stripe subscriptions: Starter £25/mo, Pro £65/mo, Agency £165/mo
- **Admin Panel** — user management, credit adjustment, usage logs, quiz stats
- **Social Publisher** — publish to connected social accounts

## Pricing (GBP)

| Plan | Price | Credits |
|------|-------|---------|
| Starter | £25/month | 100/month |
| Pro | £65/month | 500/month |
| Agency | £165/month | 2000/month |

## Environment Variables & Secrets

### Required for AI generation
- `OPENAI_API_KEY` — all AI tool generations

### Required for billing
- `STRIPE_SECRET_KEY` — Stripe API (sk_live_...)
- `STRIPE_WEBHOOK_SECRET` — webhook signing secret (whsec_...)
- `STRIPE_PRICE_STARTER` — Stripe price ID for £25/mo plan
- `STRIPE_PRICE_PRO` — Stripe price ID for £65/mo plan
- `STRIPE_PRICE_AGENCY` — Stripe price ID for £165/mo plan

### Video production (all set)
- `ELEVENLABS_API_KEY`, `DID_API_KEY`, `HEYGEN_API_KEY`, `RUNWAY_API_KEY`, `LUMAAI_API_KEY`

### Social publishing (all set)
- Facebook, LinkedIn, YouTube, TikTok, Threads, Twitter OAuth keys

### Admin access
- `ADMIN_CLERK_IDS` — comma-separated Clerk user IDs that get auto-upgraded to admin + 999,999 credits on login

### Stripe webhook
- Production endpoint: `https://gocopyai.com/api/stripe/webhook`
- Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`

## User preferences

- Pricing in GBP (£25 / £65 / £165)
- Dark theme throughout
- No emojis in UI unless specifically added for marketing copy

## Gotchas

- **Always use flat routing in App.tsx** — wouter v3 nested routes strip the base path, breaking all /app/* routes in production
- Always run codegen after editing `lib/api-spec/openapi.yaml`: `pnpm --filter @workspace/api-spec run codegen`
- Always run `pnpm --filter @workspace/db run push` after schema changes
- Clerk dev keys show a warning — expected in development, production keys used automatically on deploy
- Pre-existing (non-blocking) typecheck errors: `objectStorage.ts` signed_url, `social.ts` string|string[] arg — do not fix unless specifically requested
- Production Clerk keys are automatically used when deploying
- The `ensureUser` endpoint creates users on first login — admin Clerk IDs in `ADMIN_CLERK_IDS` env var get auto-upgraded

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- To add a new /app/* page: create the component in `artifacts/web/src/pages/app/`, import it in `App.tsx`, add a flat `<Route path="/app/your-path">` entry, add it to the sidebar in `AppLayout.tsx`
- To add a new API route: add to `lib/api-spec/openapi.yaml`, run codegen, create the route file in `artifacts/api-server/src/routes/`, register it in `artifacts/api-server/src/index.ts`
