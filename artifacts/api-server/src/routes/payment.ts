import { Router, type IRouter } from 'express';
import { getUncachableStripeClient, getStripeCredentials } from '../stripeClient';

const router: IRouter = Router();

/**
 * GET /api/payment/config
 * Returns the Stripe publishable key for the frontend to initialise Stripe.js
 */
router.get('/payment/config', async (_req, res) => {
  try {
    const { publishableKey } = await getStripeCredentials();
    res.json({ publishableKey });
  } catch (err: any) {
    res.status(503).json({ error: 'Stripe not configured', details: err.message });
  }
});

/**
 * POST /api/payment/create-intent
 * Body: { amount: number (in INR), currency?: string }
 * Creates a PaymentIntent and returns the client_secret for the frontend.
 */
router.post('/payment/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'inr' } = req.body as { amount: number; currency?: string };

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    const stripe = await getUncachableStripeClient();

    // Stripe amounts are in the smallest currency unit (paise for INR)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { source: 'brew-and-bite-cafe' },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create payment intent', details: err.message });
  }
});

export default router;
