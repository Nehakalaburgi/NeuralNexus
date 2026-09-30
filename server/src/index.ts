import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import type { SystemStatus } from '../../shared/dist/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  const status: SystemStatus = {
    service: 'NeuralNexus Backend API',
    status: 'online',
    timestamp: new Date().toISOString()
  };
  res.json(status);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
