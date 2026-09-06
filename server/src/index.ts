import './env.js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import { setupSocketHandlers } from './socket.js';

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
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

async function start() {
  await initDb();
  setupSocketHandlers(io);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, database: 'neon' });
  });

  httpServer.listen(PORT, () => {
    console.log(`InGroups server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
