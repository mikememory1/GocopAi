import { useState } from "react";
import { Link } from "wouter";
import { Show } from "@clerk/react";
import {
  Video, Search, Share2, Megaphone, FileText, Wrench,
  CheckCircle2, ArrowRight, Zap, Clock, TrendingUp, Star,
  Sparkles, Play, BookOpen, ChevronRight, Users, BarChart3,
  CalendarClock, Rocket, Globe, ShoppingBag,
} from "lucide-react";
import QuizRunner from "@/components/quiz/QuizRunner";

const TOOLS = [
  {
    icon: <Video className="w-6 h-6" />,
    label: "Video Scripts",
    color: "from-purple-500 to-pink-500",
    bg: "bg-purple-500/10 border-purple-500/20",
    desc: "AI writes your TikTok hooks, YouTube scripts & Reels outlines — paste into CapCut or VEED to produce the video",
    examples: ["60-second TikTok script", "YouTube hook", "Reels outline"],
  },
  {
    icon: <Megaphone className="w-6 h-6" />,
    label: "Ad Copy",
    color: "from-orange-500 to-red-500",
    bg: "bg-orange-500/10 border-orange-500/20",
    desc: "Facebook, Instagram & Google ads that convert browsers into buyers",
    examples: ["Facebook carousel copy", "Google search ad", "Instagram story ad"],
  },
  {
    icon: <Share2 className="w-6 h-6" />,
    label: "Social Media",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    desc: "Posts, carousels & 30-day content calendars for every platform",
    examples: ["Instagram post", "Content calendar", "LinkedIn update"],
  },
  {
    icon: <Search className="w-6 h-6" />,
    label: "SEO Content",
    color: "from-green-500 to-emerald-500",
    bg: "bg-green-500/10 border-green-500/20",
    desc: "Keyword research, meta descriptions & article outlines that rank",
    examples: ["Product page SEO", "Meta description", "Blog keyword list"],
  },
  {
    icon: <FileText className="w-6 h-6" />,
    label: "Blog Writing",
    color: "from-yellow-500 to-amber-500",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    desc: "Full blog drafts, introductions & conclusions that build authority",
    examples: ["Full blog post", "Buyer's guide intro", "Product round-up"],
  },
  {
    icon: <Wrench className="w-6 h-6" />,
    label: "Any Copy Task",
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-500/10 border-pink-500/20",
    desc: "Email sequences, product descriptions, press releases & more",
    examples: ["Welcome email", "Product description", "Press release"],
  },
];

const PLATFORMS = [
  { name: "Shopify", color: "text-green-400", emoji: "🛍️" },
  { name: "EKM",     color: "text-blue-400",  emoji: "🏪" },
  { name: "WooCommerce", color: "text-purple-400", emoji: "🛒" },
  { name: "Etsy",    color: "text-orange-400", emoji: "🎨" },
  { name: "Amazon",  color: "text-yellow-400", emoji: "📦" },
  { name: "BigCommerce", color: "text-cyan-400", emoji: "🌐" },
];

const STEPS = [
  {
    n: "1",
    icon: <Sparkles className="w-6 h-6" />,
    title: "Pick your tool",
    desc: "Choose from 15+ AI tools across video, social, ads, SEO and blog categories.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    n: "2",
    icon: <Zap className="w-6 h-6" />,
    title: "Fill in a few details",
    desc: "Tell the AI about your product, audience and tone. Takes under 30 seconds.",
    color: "from-purple-500 to-pink-500",
  },
  {
    n: "3",
    icon: <Rocket className="w-6 h-6" />,
    title: "Publish everywhere",
    desc: "Copy your content or post directly to 8 platforms with our built-in publisher.",
    color: "from-orange-500 to-red-500",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "Shopify Store Owner",
    emoji: "👩‍💼",
    color: "bg-blue-500",
    text: "I used to spend 3 hours writing Facebook ads every week. Now GoCopyAI does it in 30 seconds and the results are honestly better. My ROAS went from 1.8x to 3.2x.",
    stars: 5,
  },
  {
    name: "James T.",
    role: "EKM Retailer",
    emoji: "👨‍💻",
    color: "bg-purple-500",
    text: "The SEO tools alone are worth it. I ranked page 1 for 3 new keywords within 6 weeks using the article outlines and meta descriptions. My organic traffic is up 140%.",
    stars: 5,
  },
  {
    name: "Priya K.",
    role: "WooCommerce Seller",
    emoji: "👩‍🎨",
    color: "bg-green-500",
    text: "The social media calendar saved my business. I schedule a whole month of content in one afternoon. My engagement went through the roof and I actually enjoy posting now.",
    stars: 5,
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "£25",
    per: "/mo",
    color: "border-border",
    highlight: false,
    desc: "Perfect for solo store owners just getting started",
    features: ["100 credits/month", "All 15+ AI tools", "Basic analytics", "Email support"],
    cta: "Start Free Trial",
  },
  {
    name: "Pro",
    price: "£65",
    per: "/mo",
    color: "border-primary",
    highlight: true,
    desc: "Most popular for growing ecommerce brands",
    features: ["500 credits/month", "All 15+ AI tools", "Publisher (8 platforms)", "Scheduled posting", "Priority support"],
    cta: "Get Pro",
    badge: "Most Popular",
  },
  {
    name: "Agency",
    price: "£165",
    per: "/mo",
    color: "border-border",
    highlight: false,
    desc: "For agencies and multi-brand operations",
    features: ["2000 credits/month", "Everything in Pro", "Admin panel", "Usage analytics", "Dedicated support"],
    cta: "Contact Sales",
  },
];

export default function Home() {
  const [quizStarted, setQuizStarted] = useState(false);
  const [activeToolIdx, setActiveToolIdx] = useState(0);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">

      {/* ─── Sticky Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">GoCopyAI</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#tools" className="hover:text-foreground transition-colors">Tools</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <Link href="/guide" className="hover:text-foreground transition-colors flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Guide
            </Link>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.7)]"
              >
                Start Free
              </Link>
              <Link href="/sign-in" className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors hidden lg:block">
                Business Login →
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href="/app" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                Dashboard →
              </Link>
            </Show>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ─── Hero ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-20 md:py-32">
          {/* Background gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-20 left-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-40 right-10 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {!quizStarted ? (
              <div className="grid lg:grid-cols-2 gap-10 items-center">

                {/* Left: Copy */}
                <div className="space-y-6 animate-in fade-in slide-in-from-left-6 duration-700">
                  <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium">
                    <Zap className="w-3.5 h-3.5" />
                    AI-Powered Marketing for Online Stores
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1]">
                    Write better ads &amp; posts{" "}
                    <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      in seconds
                    </span>
                    , not hours
                  </h1>

                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
                    GoCopyAI creates scroll-stopping ad copy, social posts, SEO articles and video scripts tailored to your store. Built for <strong className="text-foreground">Shopify</strong>, <strong className="text-foreground">EKM</strong>, <strong className="text-foreground">WooCommerce</strong> and every platform in between.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/sign-up"
                      className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3.5 rounded-xl text-base font-bold transition-all shadow-[0_0_40px_-10px_hsl(var(--primary)/0.7)] hover:shadow-[0_0_60px_-10px_hsl(var(--primary))] hover:-translate-y-0.5 w-full sm:w-auto"
                    >
                      <Rocket className="w-4 h-4" />
                      Start Creating Free
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setQuizStarted(true)}
                      className="inline-flex items-center justify-center gap-2 border border-border hover:border-primary/50 bg-background/50 text-foreground px-6 py-3.5 rounded-xl text-base font-medium transition-all hover:-translate-y-0.5 w-full sm:w-auto"
                    >
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Free Marketing Audit
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {["No credit card needed", "Free to start", "Results in 30 seconds"].map((t) => (
                      <span key={t} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> {t}
                      </span>
                    ))}
                  </div>

                  <div className="pt-1">
                    <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest font-medium">Works with your store platform</p>
                    <div className="flex flex-wrap gap-2">
                      {PLATFORMS.map((p) => (
                        <span key={p.name} className={`inline-flex items-center gap-1.5 text-sm font-medium ${p.color} bg-white/5 border border-white/10 rounded-lg px-3 py-1.5`}>
                          {p.emoji} {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Live tool preview — hidden on mobile */}
                <div className="hidden lg:block animate-in fade-in slide-in-from-right-6 duration-700 delay-200">
                  <div className="relative">
                    {/* Glow behind card */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-600/20 blur-2xl rounded-3xl" />

                    {/* Main card */}
                    <div className="relative bg-card/80 backdrop-blur border border-border rounded-2xl overflow-hidden shadow-2xl">
                      {/* Tab bar */}
                      <div className="flex border-b border-border bg-muted/30 overflow-x-auto">
                        {TOOLS.slice(0, 4).map((tool, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveToolIdx(i)}
                            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors ${activeToolIdx === i ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            <span className={`bg-gradient-to-r ${TOOLS[i].color} bg-clip-text text-transparent [&>svg]:stroke-current`}>
                              {tool.icon}
                            </span>
                            {tool.label}
                          </button>
                        ))}
                      </div>

                      {/* Tool preview */}
                      <div className="p-6 space-y-4">
                        {/* Input */}
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground uppercase tracking-wide">Your Product / Brand</label>
                          <div className="bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground/70 font-mono">
                            {["Premium dog beds for active owners", "Women's eco-friendly activewear", "Artisan coffee subscription box", "Handmade leather phone cases"][activeToolIdx]}
                          </div>
                        </div>

                        {/* AI output mock */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">AI Output</label>
                            <span className="inline-flex items-center gap-1 text-[10px] bg-green-500/15 text-green-400 rounded-full px-2 py-0.5 font-medium">
                              <Sparkles className="w-2.5 h-2.5" /> Generated
                            </span>
                          </div>
                          <div className={`bg-gradient-to-br ${TOOLS[activeToolIdx].bg} border rounded-xl p-4 text-sm leading-relaxed space-y-2`}>
                            {activeToolIdx === 0 && (
                              <>
                                <p className="font-semibold text-foreground">🎬 Hook (0–3 sec):</p>
                                <p className="text-muted-foreground">"POV: Your dog finally sleeps through the night because their bed actually supports their joints…"</p>
                                <p className="font-semibold text-foreground mt-2">📢 Main (3–30 sec):</p>
                                <p className="text-muted-foreground">"Our orthopedic dog beds are designed for active breeds who deserve proper rest after long walks. Memory foam, waterproof liner, washable cover."</p>
                              </>
                            )}
                            {activeToolIdx === 1 && (
                              <>
                                <p className="font-semibold text-foreground">💥 Primary Headline:</p>
                                <p className="text-muted-foreground">"Look Good. Do Good. Feel Amazing."</p>
                                <p className="font-semibold text-foreground mt-2">📋 Ad Body:</p>
                                <p className="text-muted-foreground">"Finally — activewear that performs as hard as you do AND saves the planet. Made from 100% recycled plastic bottles. Free UK shipping on orders over £45."</p>
                                <p className="text-primary font-medium">CTA: Shop the Collection →</p>
                              </>
                            )}
                            {activeToolIdx === 2 && (
                              <>
                                <p className="font-semibold text-foreground">☕ Instagram Post:</p>
                                <p className="text-muted-foreground">"Your morning ritual, elevated. ✨ This month's single-origin Ethiopia Yirgacheffe is complex, bright, and utterly addictive.</p>
                                <p className="text-muted-foreground">New subscribers get their first bag at 30% off. Link in bio ☕"</p>
                                <p className="text-primary">#specialtycoffee #coffeesubscription #morningritual</p>
                              </>
                            )}
                            {activeToolIdx === 3 && (
                              <>
                                <p className="font-semibold text-foreground">🔍 Meta Title:</p>
                                <p className="text-muted-foreground">"Handmade Leather Phone Cases | Premium Protection | Free UK Delivery"</p>
                                <p className="font-semibold text-foreground mt-2">📄 Meta Description:</p>
                                <p className="text-muted-foreground">"Shop handcrafted leather phone cases. Each case is individually made by UK artisans. Fits iPhone &amp; Samsung. Free next-day delivery on orders over £30."</p>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Generated in 2.3 seconds</span>
                          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" /> 1 credit used</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500">
                <button onClick={() => setQuizStarted(false)} className="mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  ← Back to home
                </button>
                <QuizRunner />
              </div>
            )}
          </div>
        </section>

        {/* ─── Stats Bar ─────────────────────────────────────────────────────── */}
        {!quizStarted && (
          <>
            <section className="border-y border-border/50 bg-muted/20 py-8">
              <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                {[
                  { n: "15+",    label: "AI Tools",          icon: <Wrench className="w-5 h-5" /> },
                  { n: "8",      label: "Social Platforms",  icon: <Share2 className="w-5 h-5" /> },
                  { n: "30 sec", label: "Average Output",    icon: <Clock className="w-5 h-5" /> },
                  { n: "100%",   label: "Original Content",  icon: <Sparkles className="w-5 h-5" /> },
                ].map((s) => (
                  <div key={s.label} className="space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-primary mb-1">{s.icon}</div>
                    <div className="text-2xl font-bold">{s.n}</div>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── Problem Section ─────────────────────────────────────────────── */}
            <section className="py-20 px-4">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">Running a store is hard enough.</h2>
                  <p className="text-muted-foreground text-lg">You shouldn't have to be a copywriter too.</p>
                </div>
                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    { emoji: "⏰", title: "Writing ads takes hours", desc: "Most store owners spend 4–8 hours a week writing marketing content. That's time you could spend on your products." },
                    { emoji: "😰", title: "Blank-page anxiety is real", desc: "Staring at an empty text box and not knowing what to write is the #1 reason store owners don't post consistently." },
                    { emoji: "💸", title: "Agencies cost a fortune", desc: "A decent copywriter charges £500–£2,000/month. GoCopyAI does the same job for a fraction of the price, on demand." },
                  ].map((p) => (
                    <div key={p.title} className="bg-card border border-border rounded-2xl p-6 space-y-3 hover:border-primary/30 transition-colors">
                      <div className="text-4xl">{p.emoji}</div>
                      <h3 className="font-semibold text-lg">{p.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ─── Tools Section ───────────────────────────────────────────────── */}
            <section id="tools" className="py-20 px-4 bg-muted/10">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-4">
                    <Zap className="w-3.5 h-3.5" /> 15+ AI Tools
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to market your store</h2>
                  <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Six powerful categories of AI tools, each designed specifically for ecommerce and product-based businesses.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {TOOLS.map((tool) => (
                    <div key={tool.label} className={`${tool.bg} border rounded-2xl p-6 space-y-4 hover:scale-[1.02] transition-transform cursor-default`}>
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-lg`}>
                        {tool.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{tool.label}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{tool.desc}</p>
                      </div>
                      <div className="space-y-1">
                        {tool.examples.map((ex) => (
                          <div key={ex} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ChevronRight className="w-3 h-3 text-primary shrink-0" /> {ex}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-10">
                  <Link href="/sign-up" className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-xl font-semibold transition-all hover:-translate-y-0.5">
                    Try All Tools Free <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </section>

            {/* ─── Publisher Highlight ─────────────────────────────────────────── */}
            <section className="py-20 px-4">
              <div className="max-w-6xl mx-auto">
                <div className="relative bg-gradient-to-br from-primary/10 via-purple-600/5 to-background border border-primary/20 rounded-3xl p-8 md:p-12 overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="relative grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-5">
                      <div className="inline-flex items-center gap-2 bg-primary/15 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
                        <CalendarClock className="w-3.5 h-3.5" /> New: Publisher + Scheduler
                      </div>
                      <h2 className="text-3xl font-bold">Write once. Post everywhere.</h2>
                      <p className="text-muted-foreground leading-relaxed">
                        Connect your social accounts and publish to LinkedIn, Facebook, Instagram, TikTok, YouTube, Twitter/X, Threads and Telegram — all from one place. Schedule posts weeks in advance.
                      </p>
                      <ul className="space-y-2">
                        {["8 platforms connected", "Post immediately or schedule", "Automatic queue management", "See all results in one view"].map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                      <Link href="/sign-up" className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all">
                        Try the Publisher <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { emoji: "💼", name: "LinkedIn",   color: "bg-blue-600/20 border-blue-500/30" },
                        { emoji: "📘", name: "Facebook",   color: "bg-blue-500/20 border-blue-400/30" },
                        { emoji: "📸", name: "Instagram",  color: "bg-pink-600/20 border-pink-500/30" },
                        { emoji: "🎵", name: "TikTok",     color: "bg-neutral-500/20 border-neutral-400/30" },
                        { emoji: "🎬", name: "YouTube",    color: "bg-red-600/20 border-red-500/30" },
                        { emoji: "🐦", name: "Twitter/X",  color: "bg-sky-600/20 border-sky-500/30" },
                        { emoji: "🧵", name: "Threads",    color: "bg-gray-600/20 border-gray-500/30" },
                        { emoji: "✈️",  name: "Telegram",  color: "bg-cyan-600/20 border-cyan-500/30" },
                      ].map((p) => (
                        <div key={p.name} className={`${p.color} border rounded-xl p-3 flex items-center gap-2`}>
                          <span className="text-xl">{p.emoji}</span>
                          <span className="text-sm font-medium">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ─── How It Works ────────────────────────────────────────────────── */}
            <section id="how" className="py-20 px-4 bg-muted/10">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">Up and running in 5 minutes</h2>
                  <p className="text-muted-foreground text-lg">No technical knowledge required. If you can type, you can use GoCopyAI.</p>
                </div>
                <div className="grid sm:grid-cols-3 gap-8">
                  {STEPS.map((step, i) => (
                    <div key={step.n} className="relative text-center space-y-4">
                      {i < STEPS.length - 1 && (
                        <div className="hidden sm:block absolute top-10 left-[60%] w-full h-px bg-gradient-to-r from-border to-transparent" />
                      )}
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-xl mx-auto`}>
                        {step.icon}
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Step {step.n}</div>
                        <h3 className="font-semibold text-lg">{step.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-12 text-center">
                  <Link href="/guide" className="inline-flex items-center gap-2 border border-border hover:border-primary/50 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors hover:text-primary">
                    <BookOpen className="w-4 h-4" /> Read the full training guide
                  </Link>
                </div>
              </div>
            </section>

            {/* ─── Free Audit CTA ──────────────────────────────────────────────── */}
            <section className="py-20 px-4">
              <div className="max-w-4xl mx-auto text-center">
                <div className="bg-gradient-to-br from-primary/10 to-purple-600/5 border border-primary/20 rounded-3xl p-10 space-y-6">
                  <div className="text-4xl">🎯</div>
                  <h2 className="text-3xl sm:text-4xl font-bold">Not sure where to focus?</h2>
                  <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                    Take our free 2-minute Business Maturity Audit. Answer 22 questions and get a personalised AI action plan for your marketing.
                  </p>
                  <div className="flex items-center justify-center gap-4 flex-wrap text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> 2 minutes</span>
                    <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-primary" /> AI action plan</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Free forever</span>
                  </div>
                  <button
                    onClick={() => { setQuizStarted(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2 transition-all shadow-[0_0_40px_-10px_hsl(var(--primary)/0.7)] hover:-translate-y-0.5"
                  >
                    <Play className="w-4 h-4 fill-current" /> Start Your Free Audit
                  </button>
                </div>
              </div>
            </section>

            {/* ─── Testimonials ────────────────────────────────────────────────── */}
            <section className="py-20 px-4 bg-muted/10">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                  <div className="flex items-center justify-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <h2 className="text-3xl font-bold">Loved by store owners</h2>
                </div>
                <div className="grid sm:grid-cols-3 gap-6">
                  {TESTIMONIALS.map((t) => (
                    <div key={t.name} className="bg-card border border-border rounded-2xl p-6 space-y-4 hover:border-primary/30 transition-colors">
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.stars }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
                      <div className="flex items-center gap-3 pt-2 border-t border-border">
                        <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-lg`}>
                          {t.emoji}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{t.name}</div>
                          <div className="text-xs text-muted-foreground">{t.role}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ─── Pricing ─────────────────────────────────────────────────────── */}
            <section id="pricing" className="py-20 px-4">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, honest pricing</h2>
                  <p className="text-muted-foreground text-lg">Start free. Upgrade when you're ready. Cancel any time.</p>
                </div>
                <div className="grid sm:grid-cols-3 gap-6">
                  {PLANS.map((plan) => (
                    <div key={plan.name} className={`relative rounded-2xl border ${plan.color} p-7 space-y-6 flex flex-col ${plan.highlight ? "bg-primary/5 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]" : "bg-card"}`}>
                      {plan.badge && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full shadow">
                          {plan.badge}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-lg">{plan.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{plan.desc}</div>
                        <div className="mt-3 flex items-baseline gap-1">
                          <span className="text-4xl font-bold">{plan.price}</span>
                          <span className="text-muted-foreground text-sm">{plan.per}</span>
                        </div>
                      </div>
                      <ul className="space-y-2.5 flex-1">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/sign-up"
                        className={`block text-center rounded-xl py-2.5 font-semibold text-sm transition-all ${plan.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.6)]" : "border border-border hover:border-primary/50 hover:text-primary"}`}
                      >
                        {plan.cta}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ─── Final CTA ───────────────────────────────────────────────────── */}
            <section className="py-20 px-4">
              <div className="max-w-3xl mx-auto text-center space-y-6">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                  <h2 className="relative text-4xl sm:text-5xl font-bold leading-tight">
                    Stop writing. Start{" "}
                    <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">selling.</span>
                  </h2>
                </div>
                <p className="text-lg text-muted-foreground">
                  Join thousands of store owners who get back hours every week with GoCopyAI.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link href="/sign-up" className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-xl text-base font-bold transition-all shadow-[0_0_40px_-10px_hsl(var(--primary)/0.7)] hover:-translate-y-0.5">
                    <Rocket className="w-4 h-4" /> Get Started Free
                  </Link>
                  <Link href="/guide" className="inline-flex items-center gap-2 border border-border hover:border-primary/50 bg-background px-8 py-4 rounded-xl text-base font-medium transition-all hover:-translate-y-0.5">
                    <BookOpen className="w-4 h-4" /> Read the Guide
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">No credit card required · Free plan available · Cancel any time</p>
              </div>
            </section>
          </>
        )}
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      {!quizStarted && (
        <footer className="border-t border-border py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-4 gap-8 mb-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-bold">GoCopyAI</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">AI marketing tools built for online store owners. Write better, post faster, sell more.</p>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold">Product</div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div><a href="#tools" className="hover:text-foreground transition-colors">AI Tools</a></div>
                  <div><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></div>
                  <div><Link href="/guide" className="hover:text-foreground transition-colors">Training Guide</Link></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold">Account</div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div><Link href="/sign-up" className="hover:text-foreground transition-colors">Sign Up Free</Link></div>
                  <div><Link href="/sign-in" className="hover:text-foreground transition-colors">Sign In</Link></div>
                  <div><Link href="/app" className="hover:text-foreground transition-colors">Dashboard</Link></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold">Works with</div>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <span key={p.name} className="text-xs text-muted-foreground border border-border rounded px-2 py-0.5">{p.name}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
              <span>&copy; {new Date().getFullYear()} GoCopyAI. All rights reserved.</span>
              <div className="flex gap-4">
                <Globe className="w-4 h-4" />
                <ShoppingBag className="w-4 h-4" />
                <Users className="w-4 h-4" />
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
