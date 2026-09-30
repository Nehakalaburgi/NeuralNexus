import type {
  DisruptionEvent,
  Incident as SharedIncident,
  Resource as SharedResource,
  Assignment,
  ResponsePlan,
  ReplanningResult,
  DecisionLog
} from '@neuralnexus/shared';
import { handleDisruption, type DisruptionAnalysisResult, type ScenarioState } from './disruptionService.js';
import { replanResponsePlan, type ReplanningOutcome } from './replanningService.js';
import { defaultStateProvider, type StateProvider } from './stateProvider.js';
import { runEmergencyReassessmentPipeline } from './orchestrator.js';
import type {
  Incident as AiIncident,
  Resource as AiResource,
  ReplanTrigger,
  ReplanResponse
} from '../types/agentTypes.js';

export interface IntegratedReplanningOutput {
  disruptionAnalysis: DisruptionAnalysisResult;
  aiReplanResponse: ReplanResponse;
  replanningOutcome: ReplanningOutcome;
}

/**
 * Maps shared Incident schema to AI Agent Incident schema.
 */
export const mapSharedIncidentToAiIncident = (inc: SharedIncident): AiIncident => {
  const urgencyMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'critical'
  };
  const statusMap: Record<string, 'REPORTED' | 'TRIAGED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED'> = {
    active: 'IN_PROGRESS',
    pending: 'TRIAGED',
    resolved: 'RESOLVED'
  };
  return {
    id: inc.id,
    title: `${inc.type} (${inc.id})`,
    description: `Emergency incident ${inc.id}: ${inc.type}`,
    severity: (Math.min(5, Math.max(1, inc.severity)) as 1 | 2 | 3 | 4 | 5),
    urgency: urgencyMap[inc.urgency] || 'medium',
    status: statusMap[inc.status] || 'IN_PROGRESS',
    requiredResources: inc.requiredResources,
    location: {
      name: `Location (${inc.location.lat.toFixed(4)}, ${inc.location.lng.toFixed(4)})`,
      latitude: inc.location.lat,
      longitude: inc.location.lng
    },
    reportedAt: new Date().toISOString()
  };
};

/**
 * Maps shared Resource schema to AI Agent Resource schema.
 */
export const mapSharedResourceToAiResource = (res: SharedResource): AiResource => {
  const statusMap: Record<string, 'AVAILABLE' | 'ASSIGNED' | 'EN_ROUTE' | 'ON_SCENE' | 'OUT_OF_SERVICE'> = {
    available: 'AVAILABLE',
    assigned: 'ASSIGNED',
    responding: 'EN_ROUTE',
    out_of_service: 'OUT_OF_SERVICE'
  };
  return {
    id: res.id,
    name: `${res.type.toUpperCase()} ${res.id}`,
    type: (res.type as any),
    status: statusMap[res.status] || 'AVAILABLE',
    currentLocation: {
      name: `Base Station (${res.location.lat.toFixed(4)}, ${res.location.lng.toFixed(4)})`,
      latitude: res.location.lat,
      longitude: res.location.lng
    },
    assignedIncidentId: res.assignedIncidentId || null,
    capabilities: [res.type]
  };
};

/**
 * Resolves ScenarioState from a raw state object or a StateProvider instance.
 */
const resolveState = (stateOrProvider?: ScenarioState | StateProvider): ScenarioState => {
  if (!stateOrProvider) {
    return defaultStateProvider.getState();
  }
  if ('getState' in stateOrProvider && typeof stateOrProvider.getState === 'function') {
    return stateOrProvider.getState();
  }
  return stateOrProvider as ScenarioState;
};

/**
 * Integrated Replanning Pipeline Entrypoint:
 * Flow: DisruptionEvent -> disruptionService -> AI Orchestrator -> Database Authority Guardrail -> replanningService -> DecisionLog
 */
export async function runIntegratedReplanningPipeline(
  disruption: DisruptionEvent,
  stateOrProvider?: ScenarioState | StateProvider,
  options?: { rawReportText?: string }
): Promise<IntegratedReplanningOutput> {
  const state = resolveState(stateOrProvider);

  // Step 1: Disruption Service Analysis
  const disruptionAnalysis = handleDisruption(disruption, state);

  // If no replanning is required, return immediate no-op result
  if (!disruptionAnalysis.replanningRequired || disruptionAnalysis.affectedIncidents.length === 0) {
    const noOpOutcome = replanResponsePlan(disruptionAnalysis, state);
    const noOpAiResponse: ReplanResponse = {
      timestamp: new Date().toISOString(),
      trigger: {
        type: disruption.type as any,
        description: `Disruption event ${disruption.type}`,
        incidentId: disruption.incidentId,
        resourceId: disruption.resourceId
      },
      rawAiProposal: {
        proposedAssignments: [],
        unassignedIncidents: [],
        idleResources: state.resources.map((r) => r.id),
        tradeoffSummary: 'No replanning required.',
        requiresHumanApproval: false
      },
      validation: {
        isValid: true,
        validatedAssignments: [],
        rejectedAssignments: [],
        databaseOverrides: [],
        requiresHumanApproval: false
      },
      plan: {
        headline: 'NO REPLANNING REQUIRED',
        executiveExplanation: 'System state remains optimal.',
        delayImpacts: [],
        operationalRisks: [],
        recommendedActions: [],
        requiresHumanApproval: false,
        timestamp: new Date().toISOString()
      },
      readyForDatabaseCommit: true
    };
    return {
      disruptionAnalysis,
      aiReplanResponse: noOpAiResponse,
      replanningOutcome: noOpOutcome
    };
  }

  // Step 2: Map Authoritative State to AI Agent Input Schemas
  const aiIncidents = state.incidents.map(mapSharedIncidentToAiIncident);
  const aiResources = state.resources.map(mapSharedResourceToAiResource);
  const activeAssignmentsMap: Record<string, string> = {};
  for (const a of state.assignments) {
    activeAssignmentsMap[a.resourceId] = a.incidentId;
  }

  const aiTrigger: ReplanTrigger = {
    type: disruption.type as any,
    description: options?.rawReportText || `Disruption ${disruption.type} reported for ${disruption.resourceId || disruption.incidentId || 'system'}`,
    incidentId: disruption.incidentId,
    resourceId: disruption.resourceId
  };

  // Step 3: Run AI Multi-Agent Orchestration Pipeline (Agent 1 -> Agent 2 -> DB Authority Guardrail -> Agent 3)
  const aiReplanResponse = await runEmergencyReassessmentPipeline({
    trigger: aiTrigger,
    incidents: aiIncidents,
    resources: aiResources,
    activeAssignments: activeAssignmentsMap,
    rawReportText: options?.rawReportText
  });

  // Step 4: Run Deterministic Core Replanning Service
  const replanningOutcome = replanResponsePlan(disruptionAnalysis, state);

  // Step 5: Enforce Guardrails - Reconcile AI Validation & Human Approval Flags
  if (aiReplanResponse.validation.requiresHumanApproval || !aiReplanResponse.validation.isValid) {
    replanningOutcome.replanningResult.requiresHumanApproval = true;
    replanningOutcome.revisedPlan.status = 'pending_approval';
  }

  return {
    disruptionAnalysis,
    aiReplanResponse,
    replanningOutcome
  };
}
