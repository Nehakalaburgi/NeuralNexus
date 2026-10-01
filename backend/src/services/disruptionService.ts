import {
  DisruptionEvent,
  Incident,
  Resource,
  Assignment
} from '@shared/emergency';
import {
  getIncidents,
  getResources,
  getAssignments
} from '../scenarios/emergencyScenario';

export interface DisruptionAnalysisResult {
  disruption: DisruptionEvent;
  affectedResource?: Resource | null;
  affectedAssignments: Assignment[];
  affectedIncidents: string[];
  replanningRequired: boolean;
}

export interface DisruptionStateContext {
  incidents: Incident[];
  resources: Resource[];
  assignments: Assignment[];
}

/**
 * DisruptionService for NeuralNexus Dynamic Replanning & Integration Module
 * Receives disruption events and analyzes the impact on current emergency response state.
 */
export class DisruptionService {
  /**
   * Main entry point to evaluate a DisruptionEvent against current or provided state context
   */
  public static handleDisruption(
    event: DisruptionEvent,
    context?: DisruptionStateContext
  ): DisruptionAnalysisResult {
    // Validate required disruption event payload
    if (!event || !event.type) {
      throw new Error("Missing required disruption event object or 'type' field.");
    }

    const stateIncidents = context ? context.incidents : getIncidents();
    const stateResources = context ? context.resources : getResources();
    const stateAssignments = context ? context.assignments : getAssignments();

    switch (event.type) {
      case 'RESOURCE_UNAVAILABLE':
        return this.handleResourceUnavailable(
          event,
          stateIncidents,
          stateResources,
          stateAssignments
        );

      case 'NEW_INCIDENT':
        return this.handleNewIncident(event, stateIncidents);

      default:
        throw new Error(`Invalid disruption type '${(event as any).type}'. Supported types: RESOURCE_UNAVAILABLE, NEW_INCIDENT.`);
    }
  }

  /**
   * Handles RESOURCE_UNAVAILABLE disruption event
   */
  public static handleResourceUnavailable(
    event: DisruptionEvent,
    incidents: Incident[],
    resources: Resource[],
    assignments: Assignment[]
  ): DisruptionAnalysisResult {
    if (!event.resourceId) {
      throw new Error("Missing required field 'resourceId' for RESOURCE_UNAVAILABLE disruption event.");
    }

    // 1. Find and verify resource existence
    const resource = resources.find((r) => r.id === event.resourceId);
    if (!resource) {
      throw new Error(`Resource with ID '${event.resourceId}' not found.`);
    }

    // 2. Check if resource is already out of service
    if (resource.status === 'out_of_service') {
      throw new Error(`Resource '${event.resourceId}' is already out_of_service.`);
    }

    // 3. Mark simulated status as out_of_service
    resource.status = 'out_of_service';

    // 4. Find any assignments using that resource (active assignments)
    const affectedAssignments = assignments.filter(
      (a) => a.resourceId === resource.id && a.status !== 'cancelled' && a.status !== 'completed'
    );

    // 5. Identify affected incident IDs
    const affectedIncidentsSet = new Set<string>();
    affectedAssignments.forEach((a) => affectedIncidentsSet.add(a.incidentId));

    if (event.incidentId) {
      affectedIncidentsSet.add(event.incidentId);
    }

    const affectedIncidents = Array.from(affectedIncidentsSet);
    const replanningRequired = affectedAssignments.length > 0 || affectedIncidents.length > 0;

    return {
      disruption: event,
      affectedResource: resource,
      affectedAssignments,
      affectedIncidents,
      replanningRequired
    };
  }

  /**
   * Handles NEW_INCIDENT disruption event
   */
  public static handleNewIncident(
    event: DisruptionEvent,
    incidents: Incident[]
  ): DisruptionAnalysisResult {
    if (!event.incidentId) {
      throw new Error("Missing required field 'incidentId' for NEW_INCIDENT disruption event.");
    }

    // 1. Verify incident exists
    const incident = incidents.find((i) => i.id === event.incidentId);
    if (!incident) {
      throw new Error(`Incident with ID '${event.incidentId}' not found.`);
    }

    // 2. Return structured analysis indicating replanning is required for dispatch
    return {
      disruption: event,
      affectedResource: null,
      affectedAssignments: [],
      affectedIncidents: [incident.id],
      replanningRequired: true
    };
  }
}

export const handleDisruption = DisruptionService.handleDisruption.bind(DisruptionService);
export type ScenarioState = DisruptionStateContext;
