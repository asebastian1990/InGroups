import './env.js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import { setupSocketHandlers } from './socket.js';
import { licenseRouter } from './routes/licenses.js';
import { handleStripeWebhook, stripeConfigured } from './stripe.js';

function parseCorsOrigins(): string[] | true {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) return true;
  const origins = raw.split(',').map((o) => o.trim()).filter(Boolean);
  return origins.length > 0 ? origins : true;
}

const corsOrigins = parseCorsOrigins();

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: corsOrigins }));

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!stripeConfigured()) {
      res.status(503).send('Stripe not configured');
      return;
    }
    try {
      const signature = req.headers['stripe-signature'];
      await handleStripeWebhook(req.body as Buffer, typeof signature === 'string' ? signature : undefined);
      res.json({ received: true });
    } catch (err) {
      console.error('Stripe webhook error:', err);
      res.status(400).send(err instanceof Error ? err.message : 'Webhook error');
    }
  }
);

app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
  },
});

const PORT = Number(process.env.PORT) || 3001;

async function start() {
  await initDb();
  setupSocketHandlers(io);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, database: 'neon', stripe: stripeConfigured() });
  });

  app.use('/api/licenses', licenseRouter);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`InGroups server running on port ${PORT}`);
    if (!stripeConfigured()) {
      console.log('Stripe not configured — license shop checkout disabled.');
    }
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
