export interface Incident {
  id: string;
  type: string;
  severity: number; // 1-5
  urgency: 'low' | 'medium' | 'high' | 'critical';
  location: { lat: number; lng: number };
  requiredResources: string[];
  status: 'active' | 'pending' | 'resolved';
}

export interface Resource {
  id: string;
  type: string;
  status: 'available' | 'assigned' | 'responding' | 'out_of_service';
  location: { lat: number; lng: number };
  assignedIncidentId?: string | null;
}

export interface Assignment {
  incidentId: string;
  resourceId: string;
  eta: number;
  status: 'assigned' | 'en_route' | 'completed' | 'cancelled';
}

export interface ResponsePlan {
  id: string;
  version: number;
  assignments: Assignment[];
  status: 'active' | 'pending_approval' | 'superseded';
}

export interface DisruptionEvent {
  type: 'RESOURCE_UNAVAILABLE' | 'NEW_INCIDENT';
  resourceId?: string;
  incidentId?: string;
  timestamp: string;
}

export interface AlternativeAssignment {
  resourceId: string;
  incidentId: string;
  eta: number;
  impact: 'low' | 'medium' | 'high';
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
