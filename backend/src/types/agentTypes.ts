/**
 * ResQAlloc - AI & Multi-Agent Logic Layer
 * Type Definitions & Data Contracts
 * 
 * Defines foundational interfaces for:
 * - Incident (Incoming emergency reports & triage status)
 * - Resource (Fleet units, live status, capabilities, and locations)
 * - AllocationProposal (Proposed assignments, preemption flags, unassigned queues)
 * - CommandPlanExplanation (Executive SITREP, human-readable explanations, delay impact calculations)
 */

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus = 
  | 'REPORTED' 
  | 'TRIAGED' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'RESOLVED';

export type ResourceType = 
  | 'ambulance' 
  | 'fire' 
  | 'rescue' 
  | 'police' 
  | 'medical_unit';

export type ResourceStatus = 
  | 'AVAILABLE' 
  | 'ASSIGNED' 
  | 'EN_ROUTE' 
  | 'ON_SCENE' 
  | 'OUT_OF_SERVICE';

export interface GeoLocation {
  name: string;
  latitude: number;
  longitude: number;
}

/**
 * Incident Entity Schema
 */
export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 1 | 2 | 3 | 4 | 5;
  urgency: UrgencyLevel;
  status: IncidentStatus;
  requiredResources: string[];
  location: GeoLocation;
  casualtyEstimate?: number;
  reportedAt: string;
  assignedResourceIds?: string[];
}

/**
 * Resource / Fleet Entity Schema
 */
export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  currentLocation: GeoLocation;
  assignedIncidentId?: string | null;
  capabilities: string[];
  fuelLevelPercent?: number;
  callSign?: string;
}

export interface TravelEstimate {
  resourceId: string;
  incidentId: string;
  estimatedMinutes: number;
  distanceKm: number;
}

/**
 * Agent 1: Structured Triage Assessment Output
 */
export interface AssessmentResult {
  severity: 1 | 2 | 3 | 4 | 5;
  urgency: UrgencyLevel;
  requiredResources: string[];
  location: string;
  casualtyEstimate: number;
  summary: string;
  confidence: number;
  tags: string[];
}

/**
 * Proposed Resource-to-Incident Assignment
 */
export interface ProposedAssignment {
  incidentId: string;
  incidentTitle: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  estimatedTravelMinutes: number;
  isPreemption: boolean;
  preemptedFromIncidentId?: string | null;
  rationale: string;
}

/**
 * Agent 2: Overall Allocation Proposal
 */
export interface AllocationProposal {
  proposedAssignments: ProposedAssignment[];
  unassignedIncidents: {
    incidentId: string;
    incidentTitle?: string;
    reason: string;
    urgency?: string;
  }[];
  idleResources: string[];
  tradeoffSummary: string;
  requiresHumanApproval: boolean;
}

/**
 * Preemption delay quantification
 */
export interface DelayImpact {
  incidentId: string;
  incidentTitle: string;
  additionalDelayMinutes: number;
  reason: string;
}

/**
 * Agent 3: Executive Command SITREP & Plan Explanation
 */
export interface CommandPlanExplanation {
  headline: string;
  executiveExplanation: string;
  delayImpacts: DelayImpact[];
  operationalRisks: string[];
  recommendedActions: string[];
  requiresHumanApproval: boolean;
  timestamp: string;
}

// Alias for backwards compatibility across modules
export type CommandPlan = CommandPlanExplanation;

/**
 * Database Authority Guardrail Types
 */
export interface RejectedAssignment {
  assignment: ProposedAssignment;
  violationReason: string;
  authoritativeResourceStatus: ResourceStatus;
}

export interface ValidationResult {
  isValid: boolean;
  validatedAssignments: ProposedAssignment[];
  rejectedAssignments: RejectedAssignment[];
  databaseOverrides: string[];
  requiresHumanApproval: boolean;
  systemWarning?: string;
}

/**
 * Replanning Event Triggers & Response Schemas
 */
export interface ReplanTrigger {
  type: 'NEW_INCIDENT' | 'RESOURCE_UNAVAILABLE' | 'SEVERITY_ESCALATION' | 'MANUAL_OVERRIDE';
  description: string;
  incidentId?: string;
  resourceId?: string;
}

export interface ReplanResponse {
  timestamp: string;
  trigger: ReplanTrigger;
  assessment?: AssessmentResult;
  rawAiProposal: AllocationProposal;
  validation: ValidationResult;
  plan: CommandPlanExplanation;
  readyForDatabaseCommit: boolean;
}
