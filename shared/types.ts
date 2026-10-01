/**
 * NeuralNexus Shared Data Contract
 * Emergency Response & Resource Coordination Agent System
 * GATEWAYS 2026 Hackathon
 */

/**
 * Geographic location coordinates
 */
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  zone?: string;
}

// ==========================================
// 1. INCIDENT
// ==========================================

export type IncidentType =
  | 'FIRE'
  | 'MEDICAL_EMERGENCY'
  | 'NATURAL_DISASTER'
  | 'HAZMAT_SPILL'
  | 'INFRASTRUCTURE_FAILURE'
  | 'SEARCH_AND_RESCUE';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMEDIATE';

export type IncidentStatus =
  | 'REPORTED'
  | 'TRIAGED'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'REPLANNING'
  | 'RESOLVED'
  | 'CANCELLED';

export interface RequiredResourceRequirement {
  type: ResourceType;
  quantity: number;
}

export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  urgency: IncidentUrgency;
  location: Location;
  requiredResources: RequiredResourceRequirement[];
  status: IncidentStatus;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 2. RESOURCE
// ==========================================

export type ResourceType =
  | 'AMBULANCE'
  | 'FIRE_TRUCK'
  | 'HAZMAT_UNIT'
  | 'RESCUE_HELICOPTER'
  | 'POLICE_UNIT'
  | 'SUPPLY_TRUCK';

export type ResourceStatus =
  | 'AVAILABLE'
  | 'DISPATCHED'
  | 'EN_ROUTE'
  | 'ON_SCENE'
  | 'UNAVAILABLE'
  | 'MAINTENANCE';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  location: Location;
  assignedIncidentId: string | null;
  capacity?: number;
}

// ==========================================
// 3. ASSIGNMENT
// ==========================================

export type AssignmentStatus =
  | 'PENDING'
  | 'DISPATCHED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'REASSIGNED'
  | 'CANCELLED';

export interface Assignment {
  id?: string;
  incidentId: string;
  resourceId: string;
  eta: number; // Estimated time of arrival in minutes
  status: AssignmentStatus;
  assignedAt?: string;
}

// ==========================================
// 4. RESPONSE PLAN
// ==========================================

export type ResponsePlanStatus = 'PROPOSED' | 'APPROVED' | 'ACTIVE' | 'SUPERSEDED';

export interface ResponsePlan {
  id: string;
  incidentId: string;
  assignments: Assignment[];
  generatedAt: string;
  estimatedResolutionTime: number; // in minutes
  summary: string;
  status: ResponsePlanStatus;
}

// ==========================================
// 5. DISRUPTION EVENT
// ==========================================

export type DisruptionType =
  | 'RESOURCE_UNAVAILABLE'
  | 'NEW_INCIDENT'
  | 'ROAD_BLOCKAGE'
  | 'SEVERITY_ESCALATION';

export interface DisruptionEvent {
  id: string;
  type: DisruptionType;
  description: string;
  incidentId?: string;
  resourceId?: string;
  location?: Location;
  timestamp: string;
}

// ==========================================
// 6. ALTERNATIVE ASSIGNMENT
// ==========================================

export interface AlternativeAssignment {
  previousResourceId?: string;
  newResourceId: string;
  incidentId: string;
  reason: string;
  impactOnEta: number; // Delta ETA in minutes (e.g. +5 or -2)
}

// ==========================================
// 7. REPLANNING RESULT
// ==========================================

export type ReplanningStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED';

export interface ReplanningResult {
  id: string;
  disruptionId: string;
  originalPlanId?: string;
  newAssignments: Assignment[];
  alternativeAssignments: AlternativeAssignment[];
  unassignedIncidents: string[];
  reasoning: string;
  status: ReplanningStatus;
  timestamp: string;
}

// ==========================================
// 8. DECISION LOG
// ==========================================

export type DecisionActorType = 'AI_AGENT' | 'HUMAN_DISPATCHER' | 'SYSTEM';
export type AgentRole = 'TRIAGE' | 'DISPATCH' | 'REPLANNING' | 'COORDINATION';

export interface DecisionLog {
  id: string;
  timestamp: string;
  actorType: DecisionActorType;
  agentRole?: AgentRole;
  action: string;
  decisionDetails: string;
  incidentId?: string;
  planId?: string;
  confidenceScore?: number; // Value between 0.0 and 1.0
}
