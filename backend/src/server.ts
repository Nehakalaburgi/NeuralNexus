import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketEvents } from './services/socketService';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ResQAlloc Multi-Agent Backend', timestamp: new Date().toISOString() });
});

// Setup real-time Socket.IO streams & listeners
setupSocketEvents(io);

server.listen(PORT, () => {
  console.log(`[ResQAlloc Agent Engine] Running on http://localhost:${PORT}`);
});