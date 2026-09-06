import './env.js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import { setupSocketHandlers } from './socket.js';

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
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
