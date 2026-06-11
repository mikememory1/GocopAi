import { useState } from "react";
import { Link } from "wouter";
import {
  Video, Search, Share2, Megaphone, FileText, Wrench, Sparkles,
  BookOpen, ChevronDown, ChevronRight, CheckCircle2, Lightbulb,
  Zap, ArrowRight, Clock, Star, CalendarClock, Send,
  CreditCard, Rocket,
} from "lucide-react";

interface Section {
  id: string;
  icon: React.ReactNode;
  color: string;
  title: string;
  subtitle: string;
  tools: Tool[];
  tips: string[];
}

interface Tool {
  name: string;
  desc: string;
  steps: string[];
  example?: { label: string; content: string };
  proTip?: string;
}

const SECTIONS: Section[] = [
  {
    id: "getting-started",
    icon: <Rocket className="w-5 h-5" />,
    color: "from-blue-500 to-cyan-500",
    title: "Getting Started",
    subtitle: "Set up your account and understand the platform in 5 minutes",
    tips: [
      "Take the Business Maturity Quiz first — it generates a personalised action plan that shows you exactly where to focus",
      "Your dashboard shows your credit balance, recent generations, and last quiz result",
      "Each tool costs 1–5 credits depending on complexity. Starter plan gives 100 credits/month",
    ],
    tools: [
      {
        name: "1. Create your account",
        desc: "Sign up with email or Google. No credit card required for the free plan.",
        steps: [
          "Click 'Start Free' on the homepage",
          "Enter your email or sign in with Google",
          "Verify your email address",
          "Complete your profile — add your store name and industry for better AI outputs",
        ],
      },
      {
        name: "2. Take the Business Maturity Quiz",
        desc: "22 questions across 6 categories. Takes 2 minutes and gives you an AI-written action plan.",
        steps: [
          "Click 'Start Free Maturity Audit' on the homepage or navigate to the quiz from your dashboard",
          "Answer honestly — there are no wrong answers",
          "Review your stage (Early / Growing / Scaling / Optimised)",
          "Read your AI action plan and bookmark the tools it recommends",
        ],
        proTip: "Retake the quiz every 3 months to track your growth and get updated recommendations",
      },
      {
        name: "3. Understand your dashboard",
        desc: "Your dashboard is the hub — credits, recent outputs, and your quiz score all live here.",
        steps: [
          "Credits balance shown top-right — this is your generation allowance",
          "Recent Generations panel shows your last 10 outputs for easy re-use",
          "Quiz History tab stores all your past audits with full scores and action plans",
          "Billing tab lets you upgrade or manage your subscription any time",
        ],
      },
    ],
  },
  {
    id: "video",
    icon: <Video className="w-5 h-5" />,
    color: "from-purple-500 to-pink-500",
    title: "Video Tools",
    subtitle: "Create scroll-stopping scripts for TikTok, YouTube Shorts, Instagram Reels and more",
    tips: [
      "Always specify your target platform — a TikTok hook has a very different energy to a YouTube intro",
      "The more specific your audience description, the more targeted the output",
      "Use the Hook Generator first, then pass that hook into the Script Generator for consistent output",
    ],
    tools: [
      {
        name: "Video Script Generator",
        desc: "Full video scripts with hook, body and CTA — ready to film.",
        steps: [
          "Enter your product or service name",
          "Describe your target audience (e.g. 'UK women 25–40 who run 3x per week')",
          "Paste in 2–3 key benefits or selling points",
          "Select tone: Casual, Professional, Energetic, or Educational",
          "Click Generate — review the hook, body and call-to-action sections",
          "Edit the output in-line, then copy to your script app or teleprompter",
        ],
        example: {
          label: "Input",
          content: "Product: Eco running trainers | Audience: Eco-conscious runners | Tone: Energetic",
        },
        proTip: "Ask for 3 variations and A/B test them. The third is often the best.",
      },
      {
        name: "Hook Generator",
        desc: "The first 3 seconds make or break a video. Generate 5 hooks and pick the best one.",
        steps: [
          "Describe what your video is about in one sentence",
          "Select the emotion you want to trigger: Curiosity, Urgency, FOMO, Surprise, or Inspiration",
          "Choose your platform (TikTok, Instagram Reels, YouTube Shorts)",
          "Generate 5 hook variations — pick your favourite or combine elements from multiple",
        ],
        proTip: "Save your best hooks to a swipe file and reuse them across different products",
      },
      {
        name: "Video Outline",
        desc: "A structured chapter-by-chapter outline for longer YouTube videos.",
        steps: [
          "Enter your video topic and target keyword",
          "Specify video length (5 mins, 10 mins, 20 mins)",
          "Add your brand's core message or value proposition",
          "Review the chapter breakdown with timestamps and talking points",
          "Use this as your filming guide and paste into your video description for YouTube chapters",
        ],
      },
    ],
  },
  {
    id: "ads",
    icon: <Megaphone className="w-5 h-5" />,
    color: "from-orange-500 to-red-500",
    title: "Ads Tools",
    subtitle: "Facebook, Instagram, Google and TikTok ads that drive real results",
    tips: [
      "Always specify the platform — Facebook copy differs greatly from Google Ads",
      "Include your current best-performing ad angle as context for variation testing",
      "The Angle Generator is the best starting point if you're not sure what message to lead with",
    ],
    tools: [
      {
        name: "Ad Copy Generator",
        desc: "Full ad copy including headline, primary text and call-to-action.",
        steps: [
          "Select the platform: Facebook, Instagram, Google Search, TikTok, or LinkedIn",
          "Enter your product name and URL (or describe what you sell)",
          "Describe your ideal customer (age, interests, problem they have)",
          "List your top 3 benefits or unique selling points",
          "Choose your goal: Traffic, Conversions, Brand Awareness, or Lead Gen",
          "Generate — review headline, primary text and CTA. Request variations if needed",
        ],
        example: {
          label: "Example Input",
          content: "Platform: Facebook | Product: Leather dog collars | Customer: Dog owners who care about quality | USPs: Handmade, lifetime guarantee, personalised engraving",
        },
        proTip: "Generate 3 different emotional angles (value, fear of missing out, social proof) and test all three",
      },
      {
        name: "Headline Generator",
        desc: "5 scroll-stopping ad headlines per generation. Test them fast.",
        steps: [
          "Describe your product and the main pain point it solves",
          "Select headline style: Question, Benefit, Urgency, Social Proof, or Curiosity",
          "Generate 5 headlines — save the best 3 for split testing",
          "Use with your ad copy for a complete ad set",
        ],
        proTip: "The question format ('Tired of X?') consistently outperforms statement headlines in cold audiences",
      },
      {
        name: "Angle Generator",
        desc: "Discover which marketing angle will resonate most with your audience.",
        steps: [
          "Describe your product and target customer in detail",
          "List any objections customers commonly have",
          "Generate 5–10 different marketing angles",
          "Pick the top 2–3 and use each one to brief the Ad Copy Generator",
        ],
      },
    ],
  },
  {
    id: "social",
    icon: <Share2 className="w-5 h-5" />,
    color: "from-blue-500 to-cyan-500",
    title: "Social Media Tools",
    subtitle: "Posts, carousels and full content calendars for every platform",
    tips: [
      "Pair the Content Calendar with the Publisher tool to schedule your whole month in one session",
      "Carousel posts consistently get 3x more reach on Instagram — use the Carousel Generator weekly",
      "Always add your brand hashtag set to the post output before scheduling",
    ],
    tools: [
      {
        name: "Post Generator",
        desc: "Captions and posts for Instagram, Facebook, LinkedIn, TikTok and more.",
        steps: [
          "Select your target platform (different platforms get different tone and length)",
          "Describe what you want to post about (product launch, tip, behind-the-scenes)",
          "Add your key message or call-to-action",
          "Choose tone: Casual & Friendly, Professional, Educational, or Fun & Playful",
          "Generate — review and edit the caption, hashtags and CTA",
          "Use the Publisher to schedule it directly to your connected account",
        ],
        proTip: "Batch-create 7 posts in one session every Monday morning for a full week of content",
      },
      {
        name: "Carousel Creator",
        desc: "Slide-by-slide content for high-reach Instagram and LinkedIn carousel posts.",
        steps: [
          "Choose a carousel format: Tutorial, Tips List, Story, or Product Showcase",
          "Enter your topic or product",
          "Specify number of slides (5–10 recommended)",
          "Generate — each slide gets a hook-style headline and 2–3 supporting bullet points",
          "Copy to Canva or your design tool — add your brand colours and images",
        ],
        proTip: "The first slide headline is everything — treat it like an ad hook. Rewrite it until it grabs attention",
      },
      {
        name: "Content Calendar",
        desc: "A full 30-day content plan tailored to your niche and brand.",
        steps: [
          "Enter your brand/store name and describe what you sell",
          "Specify your platforms (Instagram, Facebook, TikTok, LinkedIn)",
          "Add any upcoming promotions, launches or seasonal events",
          "Choose your posting frequency (daily, 3x/week, 5x/week)",
          "Generate — get a day-by-day calendar with post topics, formats and suggested captions",
          "Export to your scheduling tool or use GoCopyAI's Publisher",
        ],
        proTip: "Create the calendar first, then generate the individual posts for each day using the Post Generator",
      },
    ],
  },
  {
    id: "seo",
    icon: <Search className="w-5 h-5" />,
    color: "from-green-500 to-emerald-500",
    title: "SEO Tools",
    subtitle: "Rank higher on Google with AI-powered content strategy",
    tips: [
      "Start with Keyword Research to find your targets, then use those keywords in the Article Outline",
      "Meta descriptions don't directly affect rankings but hugely impact click-through rate — get them right",
      "One strong article per week beats 5 thin ones. Use the outline tool to plan in-depth content",
    ],
    tools: [
      {
        name: "Article Outline",
        desc: "A detailed, SEO-optimised article structure with H2s, H3s and talking points.",
        steps: [
          "Enter your target keyword (e.g. 'best eco running shoes UK')",
          "Describe your target reader and their intent",
          "Specify article length: 800, 1500, or 2500+ words",
          "Optionally add competitor URLs you want to outrank",
          "Generate — review the title options, intro angle, H2 structure and conclusion brief",
          "Pass this outline to the Blog Draft tool or your writer",
        ],
        proTip: "Include a FAQ section in every article — it captures featured snippet real estate on Google",
      },
      {
        name: "Meta Description Generator",
        desc: "Click-worthy meta descriptions that drive organic CTR.",
        steps: [
          "Enter your page title and primary keyword",
          "Describe what the page is about in 1–2 sentences",
          "Select page type: Product, Category, Blog Post, or Homepage",
          "Generate 5 meta descriptions — pick the one with the strongest call-to-action",
          "Keep it under 155 characters to avoid truncation in search results",
        ],
        proTip: "Include your main keyword near the start and a clear action word ('Shop', 'Learn', 'Discover')",
      },
      {
        name: "Keyword Research",
        desc: "Long-tail keyword clusters for your product category or niche.",
        steps: [
          "Enter your seed keyword or product category",
          "Specify your target country/region",
          "Choose intent focus: Informational, Commercial, or Mixed",
          "Generate — get grouped clusters of related keywords with content suggestions",
          "Use the high-intent commercial keywords for product pages, informational for blog content",
        ],
        proTip: "Filter for 3–5 word phrases — they're less competitive and more likely to convert",
      },
    ],
  },
  {
    id: "blog",
    icon: <FileText className="w-5 h-5" />,
    color: "from-yellow-500 to-amber-500",
    title: "Blog Tools",
    subtitle: "Build authority and drive organic traffic with AI-assisted blog content",
    tips: [
      "Always review and personalise AI blog drafts — add real examples, your brand voice and original insights",
      "The intro and conclusion are the most-read sections. Spend extra time polishing them",
      "Repurpose each blog post into 5 social media posts using the Social Post Generator",
    ],
    tools: [
      {
        name: "Blog Draft",
        desc: "A full first-draft article based on your outline and keyword.",
        steps: [
          "Paste in an outline from the SEO Article Outline tool (or write your own)",
          "Add your target keyword and secondary keywords",
          "Describe your brand voice: Expert, Friendly, Authoritative, or Conversational",
          "Specify word count",
          "Generate — review section by section, editing for accuracy and brand consistency",
          "Add your own examples, statistics and internal links before publishing",
        ],
        proTip: "The AI gives you a strong skeleton. Your job is to add the unique experiences and data that Google rewards",
      },
      {
        name: "Blog Intro Generator",
        desc: "5 alternative introductions for your article. A great hook keeps readers on-page.",
        steps: [
          "Enter your article title and the main problem it addresses",
          "Add a surprising fact or statistic if you have one",
          "Generate 5 intros in different styles: Question, Statistic, Story, Bold Statement, Empathy",
          "Pick the strongest and refine it with your own voice",
        ],
        proTip: "Open with a problem, not a welcome message. 'Most stores waste £500/month on bad ads' beats 'Welcome to our blog'",
      },
      {
        name: "Blog Conclusion",
        desc: "Conclusions that summarise your points and drive readers to act.",
        steps: [
          "Paste a brief summary of your article's main points",
          "Specify your desired call-to-action (subscribe, buy, contact, read more)",
          "Generate — get a tight, punchy conclusion with a clear CTA",
          "Add internal links to relevant product pages or related articles",
        ],
      },
    ],
  },
  {
    id: "publisher",
    icon: <Send className="w-5 h-5" />,
    color: "from-pink-500 to-rose-500",
    title: "Publisher & Scheduler",
    subtitle: "Connect your accounts and publish to 8 platforms from one place",
    tips: [
      "Connect all your platforms in one session — it takes about 10 minutes and saves hours every week",
      "Use the Content Calendar tool to plan your month, then schedule everything in one sitting",
      "The scheduler runs automatically every 30 seconds — your posts will go out on time even if you're offline",
    ],
    tools: [
      {
        name: "Connecting Your Accounts",
        desc: "Connect up to 8 social media platforms via secure OAuth.",
        steps: [
          "Navigate to Publish in the left sidebar",
          "Click 'Connect' under each platform you want to use",
          "For most platforms: you'll be redirected to authorise GoCopyAI (takes 30 seconds)",
          "For Telegram: click 'Connect', create a bot via @BotFather, paste your token and chat ID",
          "Connected accounts show a green tick — you can disconnect any time",
        ],
        proTip: "Connect LinkedIn Page and Profile separately for maximum reach",
      },
      {
        name: "Publishing Content",
        desc: "Write or paste your content and post to multiple platforms at once.",
        steps: [
          "Write your caption in the Compose box (or paste from an AI tool)",
          "Upload a video or image if needed — the file is stored securely in cloud storage",
          "Select the platforms to post to (only connected platforms are selectable)",
          "Click 'Publish Now' — results appear within seconds showing success or failure per platform",
          "Review any failed platforms and retry individually if needed",
        ],
        proTip: "Platforms have different optimal caption lengths — LinkedIn loves long-form, TikTok prefers short hooks",
      },
      {
        name: "Scheduling Posts",
        desc: "Queue posts to go live at the perfect time without manual effort.",
        steps: [
          "Compose your post and select platforms as normal",
          "Switch the toggle from 'Publish Now' to 'Schedule'",
          "Pick your date and time using the date picker",
          "Click 'Schedule' — the post appears in your Scheduled Queue below",
          "To cancel, find the post in the queue and click 'Cancel' before the scheduled time",
        ],
        proTip: "Best posting times: Instagram 11am–1pm, LinkedIn 8–9am and 12pm, TikTok 7–9pm (all weekdays)",
      },
    ],
  },
  {
    id: "generic",
    icon: <Wrench className="w-5 h-5" />,
    color: "from-pink-500 to-rose-500",
    title: "Generic AI Tool",
    subtitle: "For any copywriting task that doesn't fit a specific category",
    tips: [
      "Give the AI as much context as possible — the more detail, the better the output",
      "Use this for: welcome emails, product descriptions, press releases, About Us pages, and event copy",
      "Paste in examples of your existing writing to guide the tone",
    ],
    tools: [
      {
        name: "Generic Copy Generator",
        desc: "Open-ended AI generation for any marketing writing task.",
        steps: [
          "Describe exactly what you need in the prompt box — be specific",
          "Include: the format (email, landing page, description), the audience, the goal, and the tone",
          "Add any constraints (word count, mandatory phrases, things to avoid)",
          "Generate and iterate — use follow-up prompts to refine the output",
          "Good prompt: 'Write a 200-word welcome email for new subscribers to a premium dog food brand. Tone: warm, expert. Include a 20% discount code and link to the starter pack.'",
        ],
        proTip: "Think of prompts like briefs to a junior copywriter — the more detail you give, the less you have to edit",
      },
    ],
  },
];

function ToolCard({ tool }: { tool: Tool }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors text-left gap-4"
      >
        <div>
          <div className="font-semibold">{tool.name}</div>
          <div className="text-sm text-muted-foreground mt-0.5">{tool.desc}</div>
        </div>
        {open ? <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border bg-muted/10">
          <div className="pt-4 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Step-by-step</div>
            {tool.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
          {tool.example && (
            <div className="bg-muted/40 border border-border rounded-lg p-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{tool.example.label}</div>
              <p className="text-sm font-mono text-foreground/80">{tool.example.content}</p>
            </div>
          )}
          {tool.proTip && (
            <div className="flex gap-3 bg-primary/8 border border-primary/20 rounded-lg p-4">
              <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-primary mb-1">Pro tip</div>
                <p className="text-sm text-muted-foreground">{tool.proTip}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Guide() {
  const [activeSection, setActiveSection] = useState("getting-started");

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">GoCopyAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">← Home</Link>
            <Link href="/sign-up" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              Start Free
            </Link>
            <Link href="/app" className="border border-border hover:border-primary/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors hidden sm:block">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-b from-primary/8 to-transparent py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium">
            <BookOpen className="w-3.5 h-3.5" /> Complete Training Guide
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Get the most out of <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">every tool</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A practical, step-by-step guide to all 15+ AI tools. Follow the steps, apply the pro tips, and start seeing results today.
          </p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground pt-2">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> 15 min read</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-primary" /> 15+ tools covered</span>
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-400" /> Expert tips included</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex gap-8 items-start">

          {/* ─── Sidebar Nav ─────────────────────────────────────────────────── */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-24 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">Contents</div>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === s.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
              >
                <span className={`bg-gradient-to-r ${s.color} bg-clip-text text-transparent [&>svg]:stroke-current w-4 h-4`}>
                  {s.icon}
                </span>
                {s.title}
              </a>
            ))}
            <div className="pt-4 border-t border-border mt-4">
              <Link href="/app" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
                <ArrowRight className="w-4 h-4" /> Try the tools →
              </Link>
            </div>
          </aside>

          {/* ─── Content ─────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-16">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 space-y-6">

                {/* Section header */}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} text-white flex items-center justify-center shadow-lg shrink-0`}>
                    {section.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{section.title}</h2>
                    <p className="text-muted-foreground mt-1">{section.subtitle}</p>
                  </div>
                </div>

                {/* Tips banner */}
                <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                    <Lightbulb className="w-4 h-4 text-yellow-400" /> Quick tips for {section.title}
                  </div>
                  {section.tips.map((tip, i) => (
                    <div key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>

                {/* Tool cards */}
                <div className="space-y-3">
                  {section.tools.map((tool) => (
                    <ToolCard key={tool.name} tool={tool} />
                  ))}
                </div>
              </section>
            ))}

            {/* Credits & Billing section */}
            <section id="billing" className="scroll-mt-24 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white flex items-center justify-center shadow-lg shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Credits & Billing</h2>
                  <p className="text-muted-foreground mt-1">Understanding how credits work and how to get the most from your plan</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: "What is a credit?", desc: "One credit = one AI generation. Simple tools (headlines, meta descriptions) cost 1 credit. Longer outputs like full blog drafts or video scripts cost 2–5 credits." },
                  { title: "Credits don't roll over", desc: "Unused credits expire at the end of your billing month. Use them all — run the Content Calendar or batch-create ads to max your value." },
                  { title: "Upgrading your plan", desc: "Go to Billing in the left sidebar any time to upgrade. Your credits top up immediately on upgrade. Downgrade any time, no lock-in." },
                  { title: "Getting the most value", desc: "Pro tip: Use the Content Calendar (1 credit) to plan your month, then generate each post individually. One calendar = up to 30 posts worth of planning." },
                ].map((item) => (
                  <div key={item.title} className="bg-card border border-border rounded-xl p-5 space-y-2">
                    <div className="font-semibold text-sm">{item.title}</div>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Final CTA */}
            <div className="bg-gradient-to-br from-primary/10 to-purple-600/5 border border-primary/20 rounded-2xl p-8 text-center space-y-4">
              <div className="text-3xl">🚀</div>
              <h3 className="text-2xl font-bold">Ready to put this into practice?</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Head to your dashboard and try one tool right now. Start with the Business Quiz if you haven't already — it'll tell you exactly where to focus.
              </p>
              <div className="flex justify-center gap-3 flex-wrap pt-2">
                <Link href="/app" className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-xl font-semibold text-sm transition-all">
                  <Zap className="w-4 h-4" /> Go to Dashboard
                </Link>
                <Link href="/sign-up" className="inline-flex items-center gap-2 border border-border hover:border-primary/50 px-6 py-3 rounded-xl font-medium text-sm transition-colors">
                  Create Free Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-4 text-center text-sm text-muted-foreground mt-16">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">GoCopyAI</span>
        </div>
        <p>&copy; {new Date().getFullYear()} GoCopyAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
