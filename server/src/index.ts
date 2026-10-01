import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DisruptionEvent, Incident, Resource } from '@shared/emergency';
import { ReplanningEngine } from './replanning/replanningEngine';
import { stateManager } from './services/stateManager';
import { assessIncident } from './agents/assessmentAgent';
import { allocateResources } from './agents/allocationAgent';
import { validateAllocationAgainstDatabase } from './services/validator';
import { generateCommandPlan } from './agents/planningAgent';
import { runEmergencyReassessmentPipeline } from './services/orchestrator';
import { isGeminiConfigured, getGeminiModelName } from './services/geminiClient';
import {
  INITIAL_INCIDENTS,
  INITIAL_RESOURCES,
  INITIAL_ASSIGNMENTS,
  TRAVEL_ESTIMATES,
  HACKATHON_DEMO_INCIDENT_REPORT
} from './data/seedData';
import { ReplanTrigger } from './types/agentTypes';

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ==========================================
// 1. Root & Health Telemetry Endpoints
// ==========================================

app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'NeuralNexus: Crisis Command & AI Dynamic Replanning Engine',
    status: 'ACTIVE',
    documentation: {
      healthCheck: 'GET /api/health',
      // Replanning Engine Endpoints (Koushik)
      fullStateSnapshot: 'GET /api/state',
      incidentsList: 'GET /api/incidents',
      addIncident: 'POST /api/incidents',
      resourcesList: 'GET /api/resources',
      addResource: 'POST /api/resources',
      assignmentsList: 'GET /api/assignments',
      decisionLogs: 'GET /api/logs',
      triggerDisruption: 'POST /api/disruption',
      statelessReplan: 'POST /api/replan',
      // Multi-Agent AI Endpoints (Mandara)
      aiHealth: 'GET /api/ai/health',
      incidentAssessment: 'POST /api/ai/assess',
      multiAgentReplan: 'POST /api/ai/replan',
      allocateWithValidation: 'POST /api/ai/allocate',
      explainSitrep: 'POST /api/ai/explain',
      demoInitialState: 'GET /api/ai/demo/initial-state',
      demoSimulateDisruption: 'POST /api/ai/demo/simulate-disruption'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'NeuralNexus Dynamic Replanning Engine & AI Agent Mesh',
    geminiConfigured: isGeminiConfigured(),
    geminiModel: getGeminiModelName(),
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 2. Koushik's Dynamic Replanning & State Manager
// ==========================================

// Get full active state snapshot
app.get('/api/state', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      incidents: stateManager.getIncidents(),
      resources: stateManager.getResources(),
      assignments: stateManager.getAssignments(),
      responsePlan: stateManager.getResponsePlan(),
      logs: stateManager.getLogs()
    }
  });
});

// Incidents CRUD
app.get('/api/incidents', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: stateManager.getIncidents()
  });
});

app.post('/api/incidents', (req: Request, res: Response) => {
  try {
    const incident: Incident = req.body;
    if (!incident.id || !incident.type || !incident.severity || !incident.urgency) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, type, severity, urgency, location'
      });
    }

    stateManager.addIncident(incident);

    // Automatically trigger NEW_INCIDENT disruption event
    const disruption: DisruptionEvent = {
      type: 'NEW_INCIDENT',
      incidentId: incident.id,
      timestamp: new Date().toISOString()
    };

    const output = stateManager.handleDisruption(disruption);

    res.status(201).json({
      success: true,
      message: 'Incident added and dispatched',
      data: {
        incident,
        replanningResult: output.result
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Resources CRUD
app.get('/api/resources', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: stateManager.getResources()
  });
});

app.post('/api/resources', (req: Request, res: Response) => {
  try {
    const resource: Resource = req.body;
    if (!resource.id || !resource.type || !resource.status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, type, status, location'
      });
    }

    stateManager.addResource(resource);
    res.status(201).json({
      success: true,
      data: resource
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Assignments
app.get('/api/assignments', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: stateManager.getAssignments()
  });
});

// Logs
app.get('/api/logs', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: stateManager.getLogs()
  });
});

// Trigger Disruption Replanning on Live State Manager
app.post('/api/disruption', (req: Request, res: Response) => {
  try {
    const event: DisruptionEvent = req.body;
    if (!event || !event.type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required disruption event type'
      });
    }

    const output = stateManager.handleDisruption(event);

    res.json({
      success: true,
      data: output
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stateless Ad-Hoc Replanning Endpoint
app.post('/api/replan', (req: Request, res: Response) => {
  try {
    const { event, incidents, resources, assignments } = req.body;
    if (!event || !event.type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required disruption event object'
      });
    }

    const output = ReplanningEngine.replan(event, {
      incidents: incidents || [],
      resources: resources || [],
      assignments: assignments || []
    });

    res.json({
      success: true,
      data: output
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. Mandara's Multi-Agent AI Logic Layer
// ==========================================

app.get('/api/ai/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'ResQAlloc AI & Multi-Agent Logic Layer',
    author: 'Mandara (AI & Multi-Agent Logic)',
    geminiConfigured: isGeminiConfigured(),
    model: getGeminiModelName(),
    timestamp: new Date().toISOString(),
  });
});

// Agent 1: Incident Assessment
app.post('/api/ai/assess', async (req: Request, res: Response) => {
  try {
    const rawText = req.body.text || req.body.report || req.body.description;
    if (!rawText || typeof rawText !== 'string') {
      return res.status(400).json({ error: 'Missing required field: "text" (string)' });
    }

    const assessment = await assessIncident(rawText);
    return res.json(assessment);
  } catch (error: any) {
    console.error('[API] Error in /api/ai/assess:', error);
    return res.status(500).json({ error: error.message || 'Internal assessment error' });
  }
});

// Agent 2 + Database Authority Validator
app.post('/api/ai/allocate', async (req: Request, res: Response) => {
  try {
    const { incidents, resources, travelEstimates, activeAssignments } = req.body;
    if (!Array.isArray(incidents) || !Array.isArray(resources)) {
      return res.status(400).json({ error: 'Missing required arrays: "incidents" and "resources"' });
    }

    const proposal = await allocateResources({
      incidents,
      resources,
      travelEstimates: travelEstimates || TRAVEL_ESTIMATES,
      activeAssignments: activeAssignments || {},
    });

    const validation = validateAllocationAgainstDatabase(proposal, resources, incidents);

    return res.json({ proposal, validation });
  } catch (error: any) {
    console.error('[API] Error in /api/ai/allocate:', error);
    return res.status(500).json({ error: error.message || 'Allocation error' });
  }
});

// Agent 3: Command & SITREP Explanation
app.post('/api/ai/explain', async (req: Request, res: Response) => {
  try {
    const { trigger, incidents, resources, validationResult, travelEstimates } = req.body;
    if (!trigger || !validationResult) {
      return res.status(400).json({ error: 'Missing trigger or validationResult' });
    }

    const plan = await generateCommandPlan({
      trigger,
      incidents: incidents || [],
      resources: resources || [],
      validationResult,
      travelEstimates: travelEstimates || TRAVEL_ESTIMATES,
    });

    return res.json(plan);
  } catch (error: any) {
    console.error('[API] Error in /api/ai/explain:', error);
    return res.status(500).json({ error: error.message || 'Explanation error' });
  }
});

// Full Multi-Agent Reassessment Pipeline
app.post('/api/ai/replan', async (req: Request, res: Response) => {
  try {
    const {
      trigger,
      incidents,
      resources,
      travelEstimates,
      activeAssignments,
      rawReportText
    } = req.body;

    if (!trigger || !Array.isArray(incidents) || !Array.isArray(resources)) {
      return res.status(400).json({
        error: 'Missing required fields: trigger (object), incidents (array), resources (array)'
      });
    }

    const result = await runEmergencyReassessmentPipeline({
      trigger,
      incidents,
      resources,
      travelEstimates: travelEstimates || TRAVEL_ESTIMATES,
      activeAssignments: activeAssignments || {},
      rawReportText,
    });

    return res.json(result);
  } catch (error: any) {
    console.error('[API] Error in /api/ai/replan:', error);
    return res.status(500).json({ error: error.message || 'Replanning execution error' });
  }
});

// AI Demo Initial State
app.get('/api/ai/demo/initial-state', (_req: Request, res: Response) => {
  res.json({
    incidents: INITIAL_INCIDENTS,
    resources: INITIAL_RESOURCES,
    travelEstimates: TRAVEL_ESTIMATES,
    activeAssignments: INITIAL_ASSIGNMENTS,
  });
});

// AI Demo 1-Click Simulation
app.post('/api/ai/demo/simulate-disruption', async (_req: Request, res: Response) => {
  try {
    const trigger: ReplanTrigger = {
      type: 'NEW_INCIDENT',
      description: HACKATHON_DEMO_INCIDENT_REPORT,
      incidentId: 'inc-electronic-city-crash',
    };

    const replanResult = await runEmergencyReassessmentPipeline({
      trigger,
      incidents: JSON.parse(JSON.stringify(INITIAL_INCIDENTS)),
      resources: JSON.parse(JSON.stringify(INITIAL_RESOURCES)),
      travelEstimates: TRAVEL_ESTIMATES,
      activeAssignments: INITIAL_ASSIGNMENTS,
      rawReportText: HACKATHON_DEMO_INCIDENT_REPORT,
    });

    return res.json({
      scenario: 'Electronic City Emergency Disruption',
      result: replanResult,
    });
  } catch (error: any) {
    console.error('[API] Error in simulate-disruption:', error);
    return res.status(500).json({ error: error.message || 'Simulation error' });
  }
});

// ==========================================
// 4. Server Initialization
// ==========================================

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` 🚨 NeuralNexus Unified Command & AI Engine ONLINE on port ${PORT}`);
  console.log(` 🔄 Dynamic Replanning API   -> http://localhost:${PORT}/api/replan`);
  console.log(` 🤖 Agent 1: Assessment     -> POST /api/ai/assess`);
  console.log(` ⚖️  Agent 2: Allocation     -> POST /api/ai/allocate`);
  console.log(` 📝 Agent 3: Planning/SITREP -> POST /api/ai/explain`);
  console.log(` 🛡️  Database Sentinel       -> Active validation on all routes`);
  console.log(`=======================================================`);
});

export default app;
