import { Router, type Request } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { plans } from "../data/plans";
import { creditPacks } from "../data/creditPacks";
import { logger } from "../lib/logger";
import { sql } from "drizzle-orm";

const router = Router();

// GET /api/billing/plans
router.get("/plans", (_req, res): void => {
  res.json(plans);
});

// POST /api/billing/checkout
router.post("/checkout", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const { planId } = req.body as { planId: string };

  const plan = plans.find((p) => p.id === planId);
  if (!plan) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    res.status(503).json({ error: "Stripe is not configured. Please add STRIPE_SECRET_KEY." });
    return;
  }

  if (!plan.stripePriceId) {
    res.status(400).json({ error: `Stripe price ID for plan '${planId}' is not configured.` });
    return;
  }

  // Get or create Stripe customer
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

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: String(user.id), clerkId: user.clerkId },
      });
      customerId = customer.id;
      await db
        .update(usersTable)
        .set({ stripeCustomerId: customerId })
        .where(eq(usersTable.id, user.id));
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/app/billing?success=1`,
      cancel_url: `${origin}/app/billing?cancelled=1`,
      metadata: { userId: String(user.id), planId },
    });

    res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "Stripe checkout error");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// POST /api/billing/portal
router.post("/portal", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    res.status(503).json({ error: "Stripe is not configured." });
    return;
  }

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, auth.userId!))
    .limit(1);

  if (!users[0] || !users[0].stripeCustomerId) {
    res.status(400).json({ error: "No Stripe customer found. Please subscribe first." });
    return;
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: users[0].stripeCustomerId,
      return_url: `${origin}/app/billing`,
    });

    res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "Stripe portal error");
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

// POST /api/billing/topup
router.post("/topup", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const { packId } = req.body as { packId: string };

  const pack = creditPacks.find((p) => p.id === packId);
  if (!pack) {
    res.status(400).json({ error: "Invalid pack" });
    return;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    res.status(503).json({ error: "Stripe is not configured. Please add STRIPE_SECRET_KEY." });
    return;
  }

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

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: String(user.id), clerkId: user.clerkId },
      });
      customerId = customer.id;
      await db
        .update(usersTable)
        .set({ stripeCustomerId: customerId })
        .where(eq(usersTable.id, user.id));
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: pack.price,
            product_data: {
              name: `GoCopyAI ${pack.name}`,
              description: `${pack.credits} AI generation credits`,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/app/billing?topup=1`,
      cancel_url: `${origin}/app/billing`,
      metadata: { type: "topup", userId: String(user.id), credits: String(pack.credits) },
    });

    res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "Stripe top-up checkout error");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// POST /api/billing/webhook
router.post("/webhook", async (req, res): Promise<void> => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }

  const sig = req.headers["stripe-signature"] as string;

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);

    const event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      webhookSecret,
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          metadata?: { type?: string; userId?: string; planId?: string; credits?: string };
          subscription?: string;
          customer?: string;
        };
        const userId = Number(session.metadata?.userId);
        if (!userId) break;

        // One-time credit top-up
        if (session.metadata?.type === "topup") {
          const credits = Number(session.metadata.credits);
          if (!credits) break;
          await db
            .update(usersTable)
            .set({ credits: sql`${usersTable.credits} + ${credits}` })
            .where(eq(usersTable.id, userId));
          logger.info({ userId, credits }, "Credit top-up applied");
          break;
        }

        // Subscription checkout
        const planId = session.metadata?.planId;
        if (!planId) break;
        const plan = plans.find((p) => p.id === planId);
        if (!plan) break;

        await db
          .update(usersTable)
          .set({
            currentPlan: planId,
            planStatus: "active",
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
            credits: String(plan.credits),
          })
          .where(eq(usersTable.id, userId));

        logger.info({ userId, planId }, "Subscription activated");
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as { customer: string };
        await db
          .update(usersTable)
          .set({ planStatus: "cancelled", currentPlan: null })
          .where(eq(usersTable.stripeCustomerId, sub.customer));
        logger.info({ customer: sub.customer }, "Subscription cancelled");
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as {
          customer: string;
          subscription?: string;
        };
        // Refresh credits on renewal
        const users = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.stripeCustomerId, invoice.customer))
          .limit(1);
        if (users[0]?.currentPlan) {
          const plan = plans.find((p) => p.id === users[0].currentPlan);
          if (plan) {
            await db
              .update(usersTable)
              .set({ credits: String(plan.credits), planStatus: "active" })
              .where(eq(usersTable.id, users[0].id));
          }
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    req.log.error({ err }, "Stripe webhook error");
    res.status(400).json({ error: "Webhook error" });
  }
});

export default router;
