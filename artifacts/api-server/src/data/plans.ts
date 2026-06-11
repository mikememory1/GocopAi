export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  credits: number;
  features: string[];
  stripePriceId: string | null;
}

export const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    interval: "month",
    credits: 200,
    features: [
      "200 AI credits/month",
      "All AI writing tools",
      "Business Maturity Quiz",
      "Quiz history",
      "Email support",
    ],
    stripePriceId: process.env.STRIPE_PRICE_STARTER ?? null,
  },
  {
    id: "pro",
    name: "Pro",
    price: 79,
    interval: "month",
    credits: 750,
    features: [
      "750 AI credits/month",
      "All AI writing tools",
      "Business Maturity Quiz",
      "Priority support",
      "Advanced analytics",
      "Custom AI prompts",
    ],
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? null,
  },
  {
    id: "agency",
    name: "Agency",
    price: 199,
    interval: "month",
    credits: 2500,
    features: [
      "2,500 AI credits/month",
      "All AI writing tools",
      "Business Maturity Quiz",
      "Dedicated support",
      "Advanced analytics",
      "Custom AI prompts",
      "White-label ready",
      "API access",
    ],
    stripePriceId: process.env.STRIPE_PRICE_AGENCY ?? null,
  },
];
