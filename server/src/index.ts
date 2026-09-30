import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import type { SystemStatus } from '../../shared/dist/index.js';
import { runIntegratedReplanningPipeline } from './services/integratedReplanningEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'NeuralNexus: Crisis Command API Server',
    status: 'online',
    endpoints: {
      health: 'GET /api/health',
      replan: 'POST /api/replan'
    }
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  const status: SystemStatus = {
    service: 'NeuralNexus Backend API',
    status: 'online',
    timestamp: new Date().toISOString()
  };
  res.json(status);
});

app.post('/api/replan', async (req: Request, res: Response) => {
  try {
    const { disruption, rawReportText } = req.body;
    if (!disruption || !disruption.type) {
      return res.status(400).json({ error: "Missing required 'disruption' object with a 'type' property." });
    }
    const result = await runIntegratedReplanningPipeline(disruption, undefined, { rawReportText });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Replanning pipeline execution failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
