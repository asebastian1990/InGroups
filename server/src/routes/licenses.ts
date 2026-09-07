import { Router } from 'express';
import Stripe from 'stripe';
import {
  LICENSE_MAX_QUANTITY,
  LICENSE_MIN_QUANTITY,
} from '../../../shared/types.js';
import {
  fulfillLicenseOrder,
  getLicenseOrderByStripeSession,
  getLicensePurchaseSummary,
} from '../licenses.js';
import { type AuthedRequest, requireClerkAuth } from '../httpAuth.js';
import {
  createLicenseCheckoutSession,
  licenseUnitPriceCents,
  stripeConfigured,
} from '../stripe.js';

export const licenseRouter = Router();

licenseRouter.get('/config', (_req, res) => {
  res.json({
    enabled: stripeConfigured(),
    unitPriceCents: licenseUnitPriceCents(),
    minQuantity: LICENSE_MIN_QUANTITY,
    maxQuantity: LICENSE_MAX_QUANTITY,
  });
});

licenseRouter.get('/summary', requireClerkAuth, async (req, res) => {
  try {
    const { playerId } = (req as AuthedRequest).auth;
    const summary = await getLicensePurchaseSummary(playerId);
    res.json(summary);
  } catch (err) {
    console.error('license summary error:', err);
    res.status(500).json({ error: 'Failed to load license summary' });
  }
});

licenseRouter.post('/checkout', requireClerkAuth, async (req, res) => {
  if (!stripeConfigured()) {
    res.status(503).json({ error: 'License purchases are not available yet.' });
    return;
  }

  const quantity = Number(req.body?.quantity ?? 1);
  if (!Number.isFinite(quantity)) {
    res.status(400).json({ error: 'Invalid quantity' });
    return;
  }

  try {
    const { playerId } = (req as AuthedRequest).auth;
    const { url } = await createLicenseCheckoutSession(playerId, quantity);
    res.json({ url });
  } catch (err) {
    console.error('checkout error:', err);
    res.status(500).json({ error: 'Failed to start checkout' });
  }
});

/** Fallback fulfillment when webhooks are delayed (e.g. local dev). */
licenseRouter.post('/confirm', requireClerkAuth, async (req, res) => {
  const sessionId = String(req.body?.sessionId ?? '').trim();
  if (!sessionId) {
    res.status(400).json({ error: 'Missing sessionId' });
    return;
  }

  try {
    const { playerId } = (req as AuthedRequest).auth;
    const order = await getLicenseOrderByStripeSession(sessionId);
    if (!order || order.buyerClerkId !== playerId) {
      res.status(404).json({ error: 'Purchase not found' });
      return;
    }

    if (order.status !== 'completed' && stripeConfigured()) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid') {
        await fulfillLicenseOrder(order.id);
      }
    }

    const summary = await getLicensePurchaseSummary(playerId);
    res.json(summary);
  } catch (err) {
    console.error('confirm purchase error:', err);
    res.status(500).json({ error: 'Failed to confirm purchase' });
  }
});
