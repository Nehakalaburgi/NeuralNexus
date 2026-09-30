import type { Incident, Resource, Assignment, ResponsePlan } from '@neuralnexus/shared';

// Bengaluru-style simulation scenario base data
const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-001',
    type: 'Road Accident',
    severity: 3,
    urgency: 'medium',
    location: { lat: 12.9756, lng: 77.6066 }, // MG Road, Bengaluru
    requiredResources: ['ambulance'],
    status: 'active'
  },
  {
    id: 'INC-002',
    type: 'Building Evacuation',
    severity: 4,
    urgency: 'high',
    location: { lat: 12.9784, lng: 77.6408 }, // Indiranagar, Bengaluru
    requiredResources: ['ambulance', 'rescue'],
    status: 'active'
  },
  {
    id: 'INC-003',
    type: 'Medical Emergency',
    severity: 5,
    urgency: 'critical',
    location: { lat: 12.9352, lng: 77.6245 }, // Koramangala, Bengaluru
    requiredResources: ['ambulance'],
    status: 'active'
  }
];

const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'AMB-01',
    type: 'ambulance',
    status: 'assigned',
    location: { lat: 12.9716, lng: 77.5946 }, // MG Road Station
    assignedIncidentId: 'INC-001'
  },
  {
    id: 'AMB-02',
    type: 'ambulance',
    status: 'assigned',
    location: { lat: 12.9780, lng: 77.6480 }, // Indiranagar Station
    assignedIncidentId: 'INC-002'
  },
  {
    id: 'AMB-03',
    type: 'ambulance',
    status: 'assigned',
    location: { lat: 12.9340, lng: 77.6200 }, // Koramangala Station
    assignedIncidentId: 'INC-003'
  },
  {
    id: 'AMB-04',
    type: 'ambulance',
    status: 'available',
    location: { lat: 12.9630, lng: 77.5740 }, // KR Market Station
    assignedIncidentId: null
  },
  {
    id: 'RES-01',
    type: 'rescue',
    status: 'assigned',
    location: { lat: 12.9790, lng: 77.6430 }, // Rescue Base Indiranagar
    assignedIncidentId: 'INC-002'
  }
];

const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    incidentId: 'INC-001',
    resourceId: 'AMB-01',
    eta: 6,
    status: 'assigned'
  },
  {
    incidentId: 'INC-002',
    resourceId: 'AMB-02',
    eta: 8,
    status: 'assigned'
  },
  {
    incidentId: 'INC-002',
    resourceId: 'RES-01',
    eta: 10,
    status: 'assigned'
  },
  {
    incidentId: 'INC-003',
    resourceId: 'AMB-03',
    eta: 5,
    status: 'assigned'
  }
];

const INITIAL_RESPONSE_PLAN: ResponsePlan = {
  id: 'PLAN-001',
  version: 1,
  assignments: INITIAL_ASSIGNMENTS,
  status: 'active'
};

/**
 * Returns a fresh copy of the initial incidents list to prevent mutation of base data.
 */
export const getIncidents = (): Incident[] => {
  return JSON.parse(JSON.stringify(INITIAL_INCIDENTS));
};

/**
 * Returns a fresh copy of the initial resources list to prevent mutation of base data.
 */
export const getResources = (): Resource[] => {
  return JSON.parse(JSON.stringify(INITIAL_RESOURCES));
};

/**
 * Returns a fresh copy of the initial assignments list to prevent mutation of base data.
 */
export const getAssignments = (): Assignment[] => {
  return JSON.parse(JSON.stringify(INITIAL_ASSIGNMENTS));
};

/**
 * Returns a fresh copy of the initial response plan to prevent mutation of base data.
 */
export const getResponsePlan = (): ResponsePlan => {
  return JSON.parse(JSON.stringify(INITIAL_RESPONSE_PLAN));
};

/**
 * Returns a fresh deep copy of the complete initial emergency scenario.
 */
export const getInitialScenario = () => {
  return {
    incidents: getIncidents(),
    resources: getResources(),
    assignments: getAssignments(),
    responsePlan: getResponsePlan()
  };
};
