export interface Location {
  lat: number;
  lng: number;
}

export type IncidentUrgency = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "active" | "pending" | "resolved";

export interface Incident {
  id: string;
  type: string;
  severity: number; // 1 to 5
  urgency: IncidentUrgency;
  location: Location;
  requiredResources: string[];
  status: IncidentStatus;
}

export type ResourceStatus = "available" | "assigned" | "responding" | "out_of_service";

export interface Resource {
  id: string;
  type: string;
  status: ResourceStatus;
  location: Location;
  assignedIncidentId?: string | null;
}

export type AssignmentStatus = "assigned" | "en_route" | "completed" | "cancelled";

export interface Assignment {
  incidentId: string;
  resourceId: string;
  eta: number;
  status: AssignmentStatus;
}

export type ResponsePlanStatus = "active" | "pending_approval" | "superseded";

export interface ResponsePlan {
  id: string;
  version: number;
  assignments: Assignment[];
  status: ResponsePlanStatus;
}

export type DisruptionEventType = "RESOURCE_UNAVAILABLE" | "NEW_INCIDENT";

export interface DisruptionEvent {
  type: DisruptionEventType;
  resourceId?: string;
  incidentId?: string;
  timestamp: string;
}

export type ImpactLevel = "low" | "medium" | "high";

export interface AlternativeAssignment {
  resourceId: string;
  incidentId: string;
  eta: number;
  impact: ImpactLevel;
  reason: string;
}

export interface ReplanningResult {
  trigger: DisruptionEvent;
  affectedIncidents: string[];
  oldAssignments: Assignment[];
  alternatives: AlternativeAssignment[];
  newAssignments: Assignment[];
  reason: string;
  requiresHumanApproval: boolean;
}

export interface DecisionLog {
  timestamp: string;
  event: string;
  affectedIncident?: string;
  resourceId?: string;
  action: string;
  reason: string;
  requiresHumanApproval: boolean;
}
