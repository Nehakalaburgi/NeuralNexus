import {
  Incident,
  Resource,
  Assignment,
  ResponsePlan
} from '@shared/emergency';

/**
 * Initial Simulated Emergency Scenario for Bengaluru Region
 * Module: Dynamic Replanning & Integration
 */

export interface EmergencyScenarioData {
  incidents: Incident[];
  resources: Resource[];
  assignments: Assignment[];
  responsePlan: ResponsePlan;
}

const initialIncidents: Incident[] = [
  {
    id: 'INC-001',
    type: 'Road Accident',
    severity: 3,
    urgency: 'medium',
    location: { lat: 12.9784, lng: 77.6408 }, // Indiranagar 100ft Road
    requiredResources: ['ambulance'],
    status: 'active'
  },
  {
    id: 'INC-002',
    type: 'Building Evacuation',
    severity: 4,
    urgency: 'high',
    location: { lat: 12.9750, lng: 77.6094 }, // MG Road Commercial Area
    requiredResources: ['ambulance', 'rescue'],
    status: 'active'
  },
  {
    id: 'INC-003',
    type: 'Medical Emergency',
    severity: 5,
    urgency: 'critical',
    location: { lat: 12.9352, lng: 77.6245 }, // Koramangala 5th Block
    requiredResources: ['ambulance'],
    status: 'active'
  }
];

const initialResources: Resource[] = [
  {
    id: 'AMB-01',
    type: 'ambulance',
    status: 'assigned',
    location: { lat: 12.9720, lng: 77.6350 },
    assignedIncidentId: 'INC-001'
  },
  {
    id: 'AMB-02',
    type: 'ambulance',
    status: 'assigned',
    location: { lat: 12.9710, lng: 77.6120 },
    assignedIncidentId: 'INC-002'
  },
  {
    id: 'AMB-03',
    type: 'ambulance',
    status: 'assigned',
    location: { lat: 12.9380, lng: 77.6200 },
    assignedIncidentId: 'INC-003'
  },
  {
    id: 'AMB-04',
    type: 'ambulance',
    status: 'available',
    location: { lat: 12.9500, lng: 77.6000 },
    assignedIncidentId: null
  },
  {
    id: 'RES-01',
    type: 'rescue',
    status: 'assigned',
    location: { lat: 12.9760, lng: 77.6050 },
    assignedIncidentId: 'INC-002'
  }
];

const initialAssignments: Assignment[] = [
  {
    incidentId: 'INC-001',
    resourceId: 'AMB-01',
    eta: 8,
    status: 'assigned'
  },
  {
    incidentId: 'INC-002',
    resourceId: 'AMB-02',
    eta: 6,
    status: 'assigned'
  },
  {
    incidentId: 'INC-002',
    resourceId: 'RES-01',
    eta: 7,
    status: 'assigned'
  },
  {
    incidentId: 'INC-003',
    resourceId: 'AMB-03',
    eta: 4,
    status: 'assigned'
  }
];

const initialResponsePlan: ResponsePlan = {
  id: 'PLAN-001',
  version: 1,
  assignments: initialAssignments,
  status: 'active'
};

/**
 * Immutable master copy of the initial emergency simulation scenario
 */
export const emergencyScenario: EmergencyScenarioData = {
  incidents: initialIncidents,
  resources: initialResources,
  assignments: initialAssignments,
  responsePlan: initialResponsePlan
};

// Helper utilities that return fresh deep copies to prevent mutation of initial data

export function getInitialScenario(): EmergencyScenarioData {
  return JSON.parse(JSON.stringify(emergencyScenario));
}

export function getIncidents(): Incident[] {
  return JSON.parse(JSON.stringify(initialIncidents));
}

export function getResources(): Resource[] {
  return JSON.parse(JSON.stringify(initialResources));
}

export function getAssignments(): Assignment[] {
  return JSON.parse(JSON.stringify(initialAssignments));
}

export function getResponsePlan(): ResponsePlan {
  return JSON.parse(JSON.stringify(initialResponsePlan));
}
