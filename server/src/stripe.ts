import Stripe from 'stripe';
import {
  LICENSE_UNIT_PRICE_CENTS,
} from '../../shared/types.js';
import {
  attachStripeSessionToOrder,
  createPendingLicenseOrder,
  fulfillLicenseOrder,
  getLicenseOrder,
  getLicenseOrderByStripeSession,
} from './licenses.js';

const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

export function stripeConfigured(): boolean {
  return !!secretKey;
}

function getStripe(): Stripe {
  if (!secretKey) {
    throw new Error('Stripe is not configured');
  }
  return new Stripe(secretKey);
}

function appBaseUrl(): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  const cors = process.env.CORS_ORIGIN?.split(',')[0]?.trim();
  if (cors) return cors.replace(/\/$/, '');
  return 'http://localhost:5173';
}

export async function createLicenseCheckoutSession(
  buyerClerkId: string,
  quantity: number
): Promise<{ url: string; orderId: string }> {
  const stripe = getStripe();
  const { orderId, quantity: qty, unitPriceCents } = await createPendingLicenseOrder(
    buyerClerkId,
    quantity
  );

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: unitPriceCents,
          product_data: {
            name: 'InGroups License Key',
            description: 'Unlock premium word sets and custom word sets for one account.',
          },
        },
        quantity: qty,
      },
    ],
    metadata: {
      orderId,
      buyerClerkId,
      quantity: String(qty),
    },
    success_url: `${appBaseUrl()}/?view=license&purchase=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appBaseUrl()}/?view=license&purchase=cancelled`,
  });

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL');
  }

  await attachStripeSessionToOrder(orderId, session.id);
  return { url: session.url, orderId };
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string | undefined): Promise<void> {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  if (!signature) {
    throw new Error('Missing Stripe signature');
  }

  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== 'paid') return;

    const orderId = session.metadata?.orderId;
    if (!orderId) {
      console.error('Stripe checkout completed without orderId metadata');
      return;
    }

    const order = await getLicenseOrder(orderId);
    if (!order) {
      console.error(`Unknown license order ${orderId}`);
      return;
    }

    if (order.stripeSessionId && order.stripeSessionId !== session.id) {
      console.error(`Stripe session mismatch for order ${orderId}`);
      return;
    }

    const keys = await fulfillLicenseOrder(orderId);
    console.log(`Fulfilled license order ${orderId}: ${keys.length} key(s)`);
    return;
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    const order = session.metadata?.orderId
      ? await getLicenseOrder(session.metadata.orderId)
      : await getLicenseOrderByStripeSession(session.id);
    if (order && order.status === 'pending') {
      // Leave pending orders as-is; a new checkout can be created.
      console.log(`Checkout expired for order ${order.id}`);
    }
  }
}

export function licenseUnitPriceCents(): number {
  const raw = process.env.LICENSE_PRICE_CENTS?.trim();
  if (!raw) return LICENSE_UNIT_PRICE_CENTS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : LICENSE_UNIT_PRICE_CENTS;
}
