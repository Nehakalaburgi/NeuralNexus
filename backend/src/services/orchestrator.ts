import { assessIncident } from '../agents/assessmentAgent.js';
import { allocateResources, AllocationContext } from '../agents/allocationAgent.js';
import { validateAllocationAgainstDatabase } from './validator.js';
import { generateCommandPlan, PlanningContext } from '../agents/planningAgent.js';
import { 
  Incident, 
  Resource, 
  TravelEstimate, 
  ReplanTrigger, 
  ReplanResponse, 
  AssessmentResult 
} from '../types/agentTypes.js';

export interface PipelineParams {
  trigger: ReplanTrigger;
  incidents: Incident[];
  resources: Resource[];
  travelEstimates?: TravelEstimate[];
  activeAssignments?: Record<string, string>;
  rawReportText?: string;
}

/**
 * Main Pipeline Function:
 * Chaining Agent 1 -> Agent 2 -> Database Authority Validator -> Agent 3
 */
export async function runEmergencyReassessmentPipeline(params: PipelineParams): Promise<ReplanResponse> {
  const { 
    trigger, 
    resources, 
    travelEstimates = [], 
    activeAssignments = {},
    rawReportText 
  } = params;

  let incidents = [...params.incidents];
  let assessment: AssessmentResult | undefined = undefined;

  // Step 1: Agent 1 - Incident Assessment (if trigger is a new incoming emergency call)
  if (rawReportText || trigger.type === 'NEW_INCIDENT') {
    const reportText = rawReportText || trigger.description;
    assessment = await assessIncident(reportText);

    // If this newly reported incident is not in the incident list, register it
    const existing = incidents.find(i => i.id === trigger.incidentId);
    if (!existing && trigger.incidentId) {
      incidents.unshift({
        id: trigger.incidentId,
        title: `Emergency at ${assessment.location}`,
        description: assessment.summary,
        severity: assessment.severity,
        urgency: assessment.urgency,
        status: 'TRIAGED',
        requiredResources: assessment.requiredResources,
        location: {
          name: assessment.location,
          latitude: 12.8452, // Electronic City coordinate
          longitude: 77.6602,
        },
        casualtyEstimate: assessment.casualtyEstimate,
        reportedAt: new Date().toISOString(),
      });
    }
  }

  // Step 2: Agent 2 - Resource Allocation (Triage priority & tactical preemption)
  const allocationContext: AllocationContext = {
    incidents,
    resources,
    travelEstimates,
    activeAssignments,
  };
  const rawAiProposal = await allocateResources(allocationContext);

  // Step 3: Database Authority Guardrail (Zero-Trust LLM Rule)
  // Strips any OUT_OF_SERVICE resource, flags requiresHumanApproval = true
  const validation = validateAllocationAgainstDatabase(
    rawAiProposal,
    resources,
    incidents
  );

  // Step 4: Agent 3 - Command & Planning
  // Generates executive SITREP, calculates minute delays (+8 min delta), and highlights operational risks
  const planningContext: PlanningContext = {
    trigger,
    incidents,
    resources,
    validationResult: validation,
    travelEstimates,
    previousAssignments: activeAssignments,
  };
  const plan = await generateCommandPlan(planningContext);

  return {
    timestamp: new Date().toISOString(),
    trigger,
    assessment,
    rawAiProposal,
    validation,
    plan,
    readyForDatabaseCommit: validation.isValid,
  };
}

export class EmergencyOrchestrator {
  async assess(rawReportText: string): Promise<AssessmentResult> {
    return assessIncident(rawReportText);
  }

  async replan(params: PipelineParams): Promise<ReplanResponse> {
    return runEmergencyReassessmentPipeline(params);
  }
}

export const orchestrator = new EmergencyOrchestrator();
