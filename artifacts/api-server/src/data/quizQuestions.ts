export interface QuizOption {
  value: string;
  label: string;
  score: number;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: "single" | "multiple" | "likert";
  category: string;
  weight: number;
  options: QuizOption[];
}

export const quizQuestions: QuizQuestion[] = [
  // Strategy & Positioning
  {
    id: "s1",
    text: "How clearly defined is your target audience (ICP)?",
    type: "single",
    category: "Strategy & Positioning",
    weight: 1.2,
    options: [
      { value: "a", label: "Not defined at all", score: 0 },
      { value: "b", label: "Loosely defined (e.g. 'small businesses')", score: 25 },
      { value: "c", label: "Defined with demographics and pain points", score: 60 },
      { value: "d", label: "Highly specific with psychographics and buying triggers", score: 100 },
    ],
  },
  {
    id: "s2",
    text: "How well does your positioning differentiate you from competitors?",
    type: "single",
    category: "Strategy & Positioning",
    weight: 1.1,
    options: [
      { value: "a", label: "We don't have clear positioning", score: 0 },
      { value: "b", label: "We have a basic value proposition", score: 30 },
      { value: "c", label: "Clear differentiation vs competitors", score: 70 },
      { value: "d", label: "Strong category-defining position", score: 100 },
    ],
  },
  {
    id: "s3",
    text: "Do you have a documented business strategy for the next 12 months?",
    type: "single",
    category: "Strategy & Positioning",
    weight: 1.0,
    options: [
      { value: "a", label: "No strategy documented", score: 0 },
      { value: "b", label: "Rough ideas but nothing written", score: 20 },
      { value: "c", label: "Written strategy for key areas", score: 65 },
      { value: "d", label: "Detailed plan with OKRs and milestones", score: 100 },
    ],
  },
  {
    id: "s4",
    text: "How confident are you in your core message/USP?",
    type: "likert",
    category: "Strategy & Positioning",
    weight: 1.0,
    options: [
      { value: "1", label: "1 - Not at all confident", score: 0 },
      { value: "2", label: "2", score: 25 },
      { value: "3", label: "3 - Somewhat confident", score: 50 },
      { value: "4", label: "4", score: 75 },
      { value: "5", label: "5 - Extremely confident", score: 100 },
    ],
  },

  // Offer & Product
  {
    id: "o1",
    text: "How well validated is your core offer?",
    type: "single",
    category: "Offer & Product",
    weight: 1.3,
    options: [
      { value: "a", label: "Not validated, still figuring out", score: 0 },
      { value: "b", label: "Some anecdotal feedback", score: 25 },
      { value: "c", label: "Validated with paying customers", score: 70 },
      { value: "d", label: "Strong product-market fit with data", score: 100 },
    ],
  },
  {
    id: "o2",
    text: "How clear is your pricing strategy?",
    type: "single",
    category: "Offer & Product",
    weight: 1.0,
    options: [
      { value: "a", label: "No clear pricing", score: 0 },
      { value: "b", label: "Price set but not tested", score: 30 },
      { value: "c", label: "Tested and refined pricing tiers", score: 70 },
      { value: "d", label: "Optimised with A/B testing and data", score: 100 },
    ],
  },
  {
    id: "o3",
    text: "Do you have an upsell or retention strategy?",
    type: "single",
    category: "Offer & Product",
    weight: 0.9,
    options: [
      { value: "a", label: "No upsells or retention plan", score: 0 },
      { value: "b", label: "Thinking about it", score: 20 },
      { value: "c", label: "Basic upsell/cross-sell flows in place", score: 65 },
      { value: "d", label: "Full retention and LTV optimisation system", score: 100 },
    ],
  },
  {
    id: "o4",
    text: "How easy is your offer to understand from your landing page?",
    type: "likert",
    category: "Offer & Product",
    weight: 0.8,
    options: [
      { value: "1", label: "1 - Very unclear", score: 0 },
      { value: "2", label: "2", score: 25 },
      { value: "3", label: "3 - Somewhat clear", score: 50 },
      { value: "4", label: "4", score: 75 },
      { value: "5", label: "5 - Crystal clear", score: 100 },
    ],
  },

  // Marketing & Traffic
  {
    id: "m1",
    text: "Which traffic channels are you actively using?",
    type: "multiple",
    category: "Marketing & Traffic",
    weight: 1.2,
    options: [
      { value: "seo", label: "SEO / Organic Search", score: 20 },
      { value: "content", label: "Content Marketing / Blog", score: 20 },
      { value: "social", label: "Social Media (organic)", score: 15 },
      { value: "paid", label: "Paid Ads (FB, Google, etc)", score: 20 },
      { value: "email", label: "Email Marketing", score: 25 },
      { value: "referral", label: "Referral / Partnerships", score: 20 },
    ],
  },
  {
    id: "m2",
    text: "Do you publish content consistently?",
    type: "single",
    category: "Marketing & Traffic",
    weight: 1.0,
    options: [
      { value: "a", label: "Rarely or never", score: 0 },
      { value: "b", label: "Occasionally when we have time", score: 25 },
      { value: "c", label: "Regular schedule (weekly/bi-weekly)", score: 70 },
      { value: "d", label: "High-volume, systematic content engine", score: 100 },
    ],
  },
  {
    id: "m3",
    text: "How confident are you in your content strategy?",
    type: "likert",
    category: "Marketing & Traffic",
    weight: 0.9,
    options: [
      { value: "1", label: "1 - No strategy", score: 0 },
      { value: "2", label: "2", score: 25 },
      { value: "3", label: "3 - Basic strategy", score: 50 },
      { value: "4", label: "4", score: 75 },
      { value: "5", label: "5 - Comprehensive documented strategy", score: 100 },
    ],
  },
  {
    id: "m4",
    text: "Do you have a consistent lead generation system?",
    type: "single",
    category: "Marketing & Traffic",
    weight: 1.1,
    options: [
      { value: "a", label: "No system, purely ad hoc", score: 0 },
      { value: "b", label: "Inconsistent, relies on referrals", score: 25 },
      { value: "c", label: "1-2 reliable channels generating leads", score: 65 },
      { value: "d", label: "Multi-channel, predictable lead flow", score: 100 },
    ],
  },

  // Sales & Conversion
  {
    id: "c1",
    text: "Do you track your conversion rates across the funnel?",
    type: "single",
    category: "Sales & Conversion",
    weight: 1.2,
    options: [
      { value: "a", label: "Not at all", score: 0 },
      { value: "b", label: "We track a few basic metrics", score: 30 },
      { value: "c", label: "Full funnel tracking in place", score: 70 },
      { value: "d", label: "Tracked, benchmarked, and optimised", score: 100 },
    ],
  },
  {
    id: "c2",
    text: "How systematic is your sales process?",
    type: "single",
    category: "Sales & Conversion",
    weight: 1.1,
    options: [
      { value: "a", label: "No defined process", score: 0 },
      { value: "b", label: "Loosely defined, varies by rep", score: 25 },
      { value: "c", label: "Documented process followed consistently", score: 70 },
      { value: "d", label: "Optimised with scripts, objections, CRM", score: 100 },
    ],
  },
  {
    id: "c3",
    text: "How effective is your landing page at converting visitors?",
    type: "likert",
    category: "Sales & Conversion",
    weight: 1.0,
    options: [
      { value: "1", label: "1 - Very poor", score: 0 },
      { value: "2", label: "2", score: 25 },
      { value: "3", label: "3 - Average", score: 50 },
      { value: "4", label: "4", score: 75 },
      { value: "5", label: "5 - High-converting", score: 100 },
    ],
  },

  // Operations & Delivery
  {
    id: "op1",
    text: "How well documented are your core business processes?",
    type: "single",
    category: "Operations & Delivery",
    weight: 1.0,
    options: [
      { value: "a", label: "Nothing documented", score: 0 },
      { value: "b", label: "A few informal notes", score: 25 },
      { value: "c", label: "Key processes documented and followed", score: 70 },
      { value: "d", label: "Full SOPs, automation, and team training", score: 100 },
    ],
  },
  {
    id: "op2",
    text: "Can your business run without you for 2+ weeks?",
    type: "single",
    category: "Operations & Delivery",
    weight: 1.1,
    options: [
      { value: "a", label: "No, I'm the bottleneck in everything", score: 0 },
      { value: "b", label: "Mostly no, a few things can run", score: 25 },
      { value: "c", label: "Most things can run with some oversight", score: 70 },
      { value: "d", label: "Yes, fully systemised and delegated", score: 100 },
    ],
  },
  {
    id: "op3",
    text: "How satisfied are your customers with delivery/outcomes?",
    type: "likert",
    category: "Operations & Delivery",
    weight: 0.9,
    options: [
      { value: "1", label: "1 - Many complaints", score: 0 },
      { value: "2", label: "2", score: 25 },
      { value: "3", label: "3 - Mostly satisfied", score: 50 },
      { value: "4", label: "4", score: 75 },
      { value: "5", label: "5 - Exceptional results and testimonials", score: 100 },
    ],
  },

  // Data & Tracking
  {
    id: "d1",
    text: "Do you have analytics tracking set up on your website?",
    type: "single",
    category: "Data & Tracking",
    weight: 1.1,
    options: [
      { value: "a", label: "No tracking at all", score: 0 },
      { value: "b", label: "Basic GA/analytics installed", score: 35 },
      { value: "c", label: "GA4 + heatmaps + event tracking", score: 70 },
      { value: "d", label: "Full stack: analytics, ads tracking, attribution", score: 100 },
    ],
  },
  {
    id: "d2",
    text: "Do you make decisions based on data or gut instinct?",
    type: "single",
    category: "Data & Tracking",
    weight: 1.0,
    options: [
      { value: "a", label: "Purely gut instinct", score: 0 },
      { value: "b", label: "Mostly gut with some data", score: 30 },
      { value: "c", label: "Data-informed with some intuition", score: 70 },
      { value: "d", label: "Fully data-driven with clear KPIs", score: 100 },
    ],
  },
  {
    id: "d3",
    text: "How often do you review key business metrics?",
    type: "single",
    category: "Data & Tracking",
    weight: 0.9,
    options: [
      { value: "a", label: "Rarely or never", score: 0 },
      { value: "b", label: "Monthly or less", score: 25 },
      { value: "c", label: "Weekly", score: 70 },
      { value: "d", label: "Daily dashboard review", score: 100 },
    ],
  },
  {
    id: "d4",
    text: "Do you track customer acquisition cost (CAC) and lifetime value (LTV)?",
    type: "single",
    category: "Data & Tracking",
    weight: 1.0,
    options: [
      { value: "a", label: "No, don't know these numbers", score: 0 },
      { value: "b", label: "Roughly know but not tracked formally", score: 30 },
      { value: "c", label: "Tracked and reviewed regularly", score: 70 },
      { value: "d", label: "Tracked, benchmarked, optimised", score: 100 },
    ],
  },
];

export function computeScores(answers: Record<string, string>): {
  categoryScores: Record<string, number>;
  overallScore: number;
  stage: string;
} {
  const categoryTotals: Record<string, { sum: number; maxPossible: number }> = {};

  for (const q of quizQuestions) {
    if (!categoryTotals[q.category]) {
      categoryTotals[q.category] = { sum: 0, maxPossible: 0 };
    }

    const answer = answers[q.id];
    if (!answer) continue;

    categoryTotals[q.category].maxPossible += 100 * q.weight;

    if (q.type === "multiple") {
      const selectedValues = answer.split(",").filter(Boolean);
      let multiScore = 0;
      for (const val of selectedValues) {
        const opt = q.options.find((o) => o.value === val);
        if (opt) multiScore += opt.score;
      }
      // Cap at 100 for multiple choice
      const cappedScore = Math.min(multiScore, 100);
      categoryTotals[q.category].sum += cappedScore * q.weight;
    } else {
      const opt = q.options.find((o) => o.value === answer);
      if (opt) {
        categoryTotals[q.category].sum += opt.score * q.weight;
      }
    }
  }

  const categoryScores: Record<string, number> = {};
  let totalWeightedScore = 0;
  let totalMaxPossible = 0;

  for (const [cat, totals] of Object.entries(categoryTotals)) {
    if (totals.maxPossible === 0) {
      categoryScores[cat] = 0;
    } else {
      categoryScores[cat] = Math.round((totals.sum / totals.maxPossible) * 100);
    }
    totalWeightedScore += totals.sum;
    totalMaxPossible += totals.maxPossible;
  }

  const overallScore =
    totalMaxPossible === 0
      ? 0
      : Math.round((totalWeightedScore / totalMaxPossible) * 100);

  let stage = "Early";
  if (overallScore >= 75) {
    stage = "Optimised";
  } else if (overallScore >= 50) {
    stage = "Scaling";
  } else if (overallScore >= 25) {
    stage = "Growing";
  }

  return { categoryScores, overallScore, stage };
}
