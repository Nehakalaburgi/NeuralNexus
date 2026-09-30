import type { DisruptionEvent, Resource, Assignment, Incident, ResponsePlan } from '@neuralnexus/shared';
import { defaultStateProvider, type StateProvider } from './stateProvider.js';

export interface DisruptionAnalysisResult {
  disruption: DisruptionEvent;
  affectedResource?: Resource;
  affectedAssignments: Assignment[];
  affectedIncidents: string[];
  newIncident?: Incident;
  replanningRequired: boolean;
}

export interface ScenarioState {
  incidents: Incident[];
  resources: Resource[];
  assignments: Assignment[];
  responsePlan?: ResponsePlan;
}

/**
 * Helper to resolve a ScenarioState object from either a raw state or a StateProvider.
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
 * Handles RESOURCE_UNAVAILABLE disruption events.
 * Identifies the target resource, marks it out_of_service, and extracts affected assignments/incidents.
 */
export const handleResourceUnavailable = (
  disruption: DisruptionEvent,
  stateOrProvider?: ScenarioState | StateProvider
): DisruptionAnalysisResult => {
  const state = resolveState(stateOrProvider);

  if (!disruption.resourceId) {
    throw new Error("Missing required field 'resourceId' for RESOURCE_UNAVAILABLE disruption.");
  }

  const resource = state.resources.find((r) => r.id === disruption.resourceId);
  if (!resource) {
    throw new Error(`Resource with ID '${disruption.resourceId}' not found.`);
  }

  if (resource.status === 'out_of_service') {
    throw new Error(`Resource '${disruption.resourceId}' is already out_of_service.`);
  }

  // Create an updated resource clone
  const updatedResource: Resource = {
    ...resource,
    status: 'out_of_service'
  };

  // Find assignments utilizing this resource
  const affectedAssignments = state.assignments.filter(
    (assignment) => assignment.resourceId === disruption.resourceId
  );

  // Extract unique affected incident IDs
  const affectedIncidents = Array.from(
    new Set(affectedAssignments.map((assignment) => assignment.incidentId))
  );

  // Replanning is required if the resource was assigned to any incident
  const replanningRequired = affectedAssignments.length > 0 || resource.status === 'assigned' || resource.status === 'responding';

  return {
    disruption,
    affectedResource: updatedResource,
    affectedAssignments,
    affectedIncidents,
    replanningRequired
  };
};

/**
 * Handles NEW_INCIDENT disruption events.
 * Verifies the incoming incident and triggers replanning evaluation.
 */
export const handleNewIncident = (
  disruption: DisruptionEvent,
  stateOrProvider?: ScenarioState | StateProvider,
  newIncidentData?: Incident
): DisruptionAnalysisResult => {
  const state = resolveState(stateOrProvider);

  if (!disruption.incidentId) {
    throw new Error("Missing required field 'incidentId' for NEW_INCIDENT disruption.");
  }

  const existingIncident = state.incidents.find((inc) => inc.id === disruption.incidentId);
  const incidentToProcess = newIncidentData || existingIncident;

  if (!incidentToProcess) {
    throw new Error(`Incident with ID '${disruption.incidentId}' not found in system state.`);
  }

  return {
    disruption,
    newIncident: incidentToProcess,
    affectedAssignments: [],
    affectedIncidents: [incidentToProcess.id],
    replanningRequired: true
  };
};

/**
 * Main entry point for evaluating disruption events against the emergency scenario state.
 */
export const handleDisruption = (
  disruption: DisruptionEvent,
  stateOrProvider?: ScenarioState | StateProvider,
  additionalContext?: { newIncident?: Incident }
): DisruptionAnalysisResult => {
  if (!disruption || !disruption.type) {
    throw new Error("Invalid disruption event: Missing 'type' field.");
  }

  switch (disruption.type) {
    case 'RESOURCE_UNAVAILABLE':
      return handleResourceUnavailable(disruption, stateOrProvider);

    case 'NEW_INCIDENT':
      return handleNewIncident(disruption, stateOrProvider, additionalContext?.newIncident);

    default:
      throw new Error(`Unsupported disruption type: '${(disruption as any).type}'.`);
  }
};
