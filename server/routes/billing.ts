import { Router, type Request } from 'express';
import Stripe from 'stripe';
import { db } from '../db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';
import { requireAuth, type AuthRequest } from '../auth.js';

export const billingRouter = Router();

const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeKey ? new Stripe(stripeKey) : null as unknown as Stripe;

export const PRICE_IDS = {
  starter:  process.env.STRIPE_PRICE_STARTER  || '',
  pro:      process.env.STRIPE_PRICE_PRO      || '',
  business: process.env.STRIPE_PRICE_BUSINESS || '',
  agency:   process.env.STRIPE_PRICE_AGENCY   || '',
};

// Create Stripe Checkout session → redirect to payment page
billingRouter.post('/checkout', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { plan } = req.body as { plan: 'starter' | 'pro' | 'business' | 'agency' };
    const priceId = PRICE_IDS[plan];
    if (!priceId) return res.status(400).json({ error: `No price configured for plan: ${plan}` });

    const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Create or reuse Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name, metadata: { userId: String(user.id) } });
      customerId = customer.id;
      await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, user.id));
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    // Check if user has ever had a paid subscription (prevent trial recycling)
    const hadTrial = !!(user.stripeSubscriptionId || user.stripeCurrentPeriodEnd);
    const trialDays = hadTrial ? undefined : 14;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      payment_method_collection: 'always',
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/account?upgraded=1`,
      cancel_url: `${appUrl}/account`,
      subscription_data: {
        metadata: { userId: String(user.id), plan },
        ...(trialDays ? { trial_period_days: trialDays } : {}),
      },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stripe Customer Portal — manage / cancel subscription
billingRouter.post('/portal', requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
    if (!user?.stripeCustomerId) return res.status(400).json({ error: 'No billing account found' });

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/account`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Current billing status
billingRouter.get('/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      plan: user.plan,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
      isActive: user.plan !== 'free' && (!user.stripeCurrentPeriodEnd || user.stripeCurrentPeriodEnd * 1000 > Date.now()),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Promo code — grants agency-level access without Stripe
billingRouter.post('/promo', requireAuth, async (req: AuthRequest, res) => {
  const { code } = req.body as { code: string };
  const validCode = process.env.PROMO_CODE;
  if (!validCode || code?.trim().toUpperCase() !== validCode.toUpperCase()) {
    return res.status(400).json({ error: 'Invalid promo code' });
  }
  await db.update(users).set({ plan: 'agency' }).where(eq(users.id, req.userId!));
  res.json({ ok: true, plan: 'agency' });
});

// Stripe webhook — keeps plan in sync automatically
billingRouter.post('/webhook', async (req: Request, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    event = secret
      ? stripe.webhooks.constructEvent(req.body, sig, secret)
      : JSON.parse(req.body.toString());
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: 'Webhook error' });
  }

  const getPlanFromPriceId = (priceId: string) => {
    if (priceId === PRICE_IDS.starter) return 'starter';
    if (priceId === PRICE_IDS.pro) return 'pro';
    if (priceId === PRICE_IDS.business) return 'business';
    if (priceId === PRICE_IDS.agency) return 'agency';
    return 'free';
  };

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = (session as any).subscription_data?.metadata?.userId || session.metadata?.userId;
      const plan = (session as any).subscription_data?.metadata?.plan;
      if (userId && plan) {
        await db.update(users).set({
          plan,
          stripeSubscriptionId: session.subscription as string,
        }).where(eq(users.id, parseInt(userId)));
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as any).subscription as string | null;
      const sub = subId ? await stripe.subscriptions.retrieve(subId) : null;
      if (sub) {
        const priceId = sub.items.data[0]?.price.id;
        const plan = getPlanFromPriceId(priceId);
        const userId = sub.metadata?.userId;
        if (userId) {
          await db.update(users).set({
            plan,
            stripeCurrentPeriodEnd: (sub as any).current_period_end,
          }).where(eq(users.id, parseInt(userId)));
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      const plan = sub.status === 'active' ? getPlanFromPriceId(priceId) : 'free';
      const userId = sub.metadata?.userId;
      if (userId) {
        await db.update(users).set({
          plan,
          stripeCurrentPeriodEnd: (sub as any).current_period_end,
        }).where(eq(users.id, parseInt(userId)));
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        await db.update(users).set({ plan: 'free', stripeSubscriptionId: null }).where(eq(users.id, parseInt(userId)));
      }
      break;
    }
  }

  res.json({ received: true });
});
