import type {
  DisruptionEvent,
  Incident,
  Resource,
  Assignment,
  ResponsePlan,
  AlternativeAssignment,
  ReplanningResult,
  DecisionLog
} from '@neuralnexus/shared';
import type { DisruptionAnalysisResult, ScenarioState } from './disruptionService.js';
import { defaultStateProvider, type StateProvider } from './stateProvider.js';
import { addDecisionLog } from './decisionLogService.js';

export interface ReplanningOutcome {
  replanningResult: ReplanningResult;
  revisedPlan: ResponsePlan;
  decisionLogs?: DecisionLog[];
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
 * Calculates straight-line distance in kilometers between two lat/lng coordinates (Haversine formula).
 */
export const calculateDistance = (
  loc1: { lat: number; lng: number },
  loc2: { lat: number; lng: number }
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculates a simulated estimated time of arrival (ETA in minutes) based on spatial distance.
 */
export const calculateSimulatedETA = (
  resourceLoc: { lat: number; lng: number },
  incidentLoc: { lat: number; lng: number }
): number => {
  const distanceKm = calculateDistance(resourceLoc, incidentLoc);
  // Assume average emergency vehicle speed in urban traffic (~30 km/h) + 2 min dispatch overhead
  const travelMinutes = Math.round((distanceKm / 30) * 60) + 2;
  return Math.max(3, travelMinutes); // Minimum 3 mins ETA
};

/**
 * Filters system resources to find compatible available candidates for a required resource type.
 */
export const findCandidateResources = (
  requiredType: string,
  resources: Resource[],
  excludedResourceId?: string
): Resource[] => {
  return resources.filter(
    (resource) =>
      resource.type === requiredType &&
      resource.status === 'available' &&
      resource.id !== excludedResourceId
  );
};

/**
 * Generates ranked AlternativeAssignment options for an incident from candidate resources.
 */
export const generateAlternatives = (
  incident: Incident,
  candidates: Resource[]
): AlternativeAssignment[] => {
  const alternatives: AlternativeAssignment[] = candidates.map((candidate) => {
    const eta = calculateSimulatedETA(candidate.location, incident.location);
    return {
      resourceId: candidate.id,
      incidentId: incident.id,
      eta,
      impact: 'low',
      reason: `${candidate.id} is available and compatible with the ${candidate.type} requirement.`
    };
  });

  // Rank alternatives: sort by impact priority ('low' > 'medium' > 'high'), then by lowest ETA
  alternatives.sort((a, b) => {
    if (a.impact !== b.impact) {
      const impactScore = { low: 1, medium: 2, high: 3 };
      return impactScore[a.impact] - impactScore[b.impact];
    }
    return a.eta - b.eta;
  });

  return alternatives;
};

/**
 * Selects the best available alternative from candidate options.
 */
export const selectBestAlternative = (
  alternatives: AlternativeAssignment[]
): AlternativeAssignment | null => {
  return alternatives.length > 0 ? alternatives[0] : null;
};

/**
 * Determines whether human operator approval is required for the replanning result.
 */
export const determineHumanApproval = (
  alternatives: AlternativeAssignment[],
  newAssignments: Assignment[]
): boolean => {
  if (alternatives.length === 0 || newAssignments.length === 0) {
    return true;
  }
  return false;
};

/**
 * Generates a revised ResponsePlan with version incremented and unaffected assignments preserved.
 */
export const createRevisedPlan = (
  currentPlan: ResponsePlan,
  oldAssignments: Assignment[],
  newAssignments: Assignment[],
  requiresHumanApproval: boolean
): ResponsePlan => {
  const oldResourceIds = new Set(oldAssignments.map((a) => a.resourceId));

  // Preserve unaffected assignments
  const preservedAssignments = currentPlan.assignments.filter(
    (assignment) => !oldResourceIds.has(assignment.resourceId)
  );

  return {
    id: currentPlan.id,
    version: currentPlan.version + 1,
    assignments: [...preservedAssignments, ...newAssignments],
    status: requiresHumanApproval ? 'pending_approval' : 'active'
  };
};

/**
 * Handles dynamic replanning when a NEW_INCIDENT enters the system.
 */
export const replanNewIncident = (
  disruptionResult: DisruptionAnalysisResult,
  stateOrProvider?: ScenarioState | StateProvider,
  currentPlan?: ResponsePlan
): ReplanningOutcome => {
  const state = resolveState(stateOrProvider);
  const activePlan = currentPlan || state.responsePlan || defaultStateProvider.getResponsePlan();

  const { disruption, affectedIncidents, newIncident: disruptionNewIncident } = disruptionResult;
  const incidentId = affectedIncidents[0] || disruption.incidentId;

  const incident = state.incidents.find((inc) => inc.id === incidentId) || disruptionNewIncident;

  if (!incident) {
    throw new Error(`New incident with ID '${incidentId}' not found in state.`);
  }

  const allAlternatives: AlternativeAssignment[] = [];
  const newAssignments: Assignment[] = [];
  const oldAssignmentsToPreempt: Assignment[] = [];
  const recordedLogs: DecisionLog[] = [];
  let requiresHumanApproval = false;
  const reasonParts: string[] = [];

  const usedResourceIds = new Set<string>();

  for (const reqType of incident.requiredResources) {
    // 1. Check for available resource of reqType
    const availableCandidate = state.resources.find(
      (r) => r.type === reqType && r.status === 'available' && !usedResourceIds.has(r.id)
    );

    if (availableCandidate) {
      const eta = calculateSimulatedETA(availableCandidate.location, incident.location);
      const alt: AlternativeAssignment = {
        resourceId: availableCandidate.id,
        incidentId: incident.id,
        eta,
        impact: 'low',
        reason: `${availableCandidate.id} is available and matches required ${reqType} for new incident ${incident.id}.`
      };
      allAlternatives.push(alt);
      newAssignments.push({
        incidentId: incident.id,
        resourceId: availableCandidate.id,
        eta,
        status: 'assigned'
      });
      usedResourceIds.add(availableCandidate.id);
      const reasonMsg = `Assigned available ${reqType} ${availableCandidate.id} to new incident ${incident.id}.`;
      reasonParts.push(reasonMsg);

      const log = addDecisionLog({
        timestamp: disruption.timestamp || new Date().toISOString(),
        event: 'NEW_INCIDENT',
        affectedIncident: incident.id,
        resourceId: availableCandidate.id,
        action: `Assigned ${availableCandidate.id} to new incident ${incident.id}`,
        reason: `${availableCandidate.id} was available and compatible.`,
        requiresHumanApproval: false
      });
      recordedLogs.push(log);
    } else {
      // 2. No available resource: check if an assigned resource can be reallocated (preempted)
      const assignedCandidates = state.resources.filter(
        (r) => r.type === reqType && r.status === 'assigned' && !usedResourceIds.has(r.id)
      );

      if (assignedCandidates.length > 0) {
        const reallocCandidate = assignedCandidates[0];
        const eta = calculateSimulatedETA(reallocCandidate.location, incident.location);
        const alt: AlternativeAssignment = {
          resourceId: reallocCandidate.id,
          incidentId: incident.id,
          eta,
          impact: 'high',
          reason: `Reallocating ${reallocCandidate.id} from active incident ${reallocCandidate.assignedIncidentId} to high-severity incident ${incident.id}.`
        };
        allAlternatives.push(alt);

        // Preempting an active incident requires human operator approval
        requiresHumanApproval = true;

        const existingAssignment = activePlan.assignments.find((a) => a.resourceId === reallocCandidate.id);
        if (existingAssignment) {
          oldAssignmentsToPreempt.push(existingAssignment);
        }

        newAssignments.push({
          incidentId: incident.id,
          resourceId: reallocCandidate.id,
          eta,
          status: 'assigned'
        });
        usedResourceIds.add(reallocCandidate.id);
        const reasonMsg = `Proposed reallocating ${reallocCandidate.id} from incident ${reallocCandidate.assignedIncidentId} to ${incident.id} (requires human approval).`;
        reasonParts.push(reasonMsg);

        const log = addDecisionLog({
          timestamp: disruption.timestamp || new Date().toISOString(),
          event: 'REALLOCATION_PROPOSED',
          affectedIncident: incident.id,
          resourceId: reallocCandidate.id,
          action: `Proposed ${reallocCandidate.id} reassignment`,
          reason: `New critical incident ${incident.id} requires ${reqType} resources currently assigned to ${reallocCandidate.assignedIncidentId}.`,
          requiresHumanApproval: true
        });
        recordedLogs.push(log);
      } else {
        // 3. No candidate resource of this type exists anywhere in the system
        requiresHumanApproval = true;
        const reasonMsg = `No ${reqType} resource is available or existing in the system for new incident ${incident.id}.`;
        reasonParts.push(reasonMsg);

        const log = addDecisionLog({
          timestamp: disruption.timestamp || new Date().toISOString(),
          event: 'NEW_INCIDENT_UNRESOLVED',
          affectedIncident: incident.id,
          action: `Flagged ${incident.id} as unserviced for missing ${reqType}`,
          reason: reasonMsg,
          requiresHumanApproval: true
        });
        recordedLogs.push(log);
      }
    }
  }

  const oldResourceIds = new Set(oldAssignmentsToPreempt.map((a) => a.resourceId));
  const preservedAssignments = activePlan.assignments.filter(
    (a) => !oldResourceIds.has(a.resourceId)
  );

  const revisedPlan: ResponsePlan = {
    id: activePlan.id,
    version: activePlan.version + 1,
    assignments: [...preservedAssignments, ...newAssignments],
    status: requiresHumanApproval ? 'pending_approval' : 'active'
  };

  const replanningResult: ReplanningResult = {
    trigger: disruption,
    affectedIncidents: [incident.id],
    oldAssignments: oldAssignmentsToPreempt,
    alternatives: allAlternatives,
    newAssignments,
    reason: reasonParts.join(' '),
    requiresHumanApproval
  };

  return { replanningResult, revisedPlan, decisionLogs: recordedLogs };
};

/**
 * Main replanning function: takes a disruption analysis result and constructs a revised response plan.
 */
export const replanResponsePlan = (
  disruptionResult: DisruptionAnalysisResult,
  stateOrProvider?: ScenarioState | StateProvider,
  currentPlan?: ResponsePlan
): ReplanningOutcome => {
  const state = resolveState(stateOrProvider);
  const activePlan = currentPlan || state.responsePlan || defaultStateProvider.getResponsePlan();

  const { disruption, affectedResource, affectedAssignments, affectedIncidents, replanningRequired } =
    disruptionResult;

  if (!replanningRequired || affectedIncidents.length === 0) {
    const noOpResult: ReplanningResult = {
      trigger: disruption,
      affectedIncidents: [],
      oldAssignments: [],
      alternatives: [],
      newAssignments: [],
      reason: 'No replanning required for this disruption event.',
      requiresHumanApproval: false
    };
    return { replanningResult: noOpResult, revisedPlan: activePlan, decisionLogs: [] };
  }

  if (disruption.type === 'NEW_INCIDENT') {
    return replanNewIncident(disruptionResult, state, activePlan);
  }

  const allAlternatives: AlternativeAssignment[] = [];
  const newAssignments: Assignment[] = [];
  const recordedLogs: DecisionLog[] = [];
  const reasonParts: string[] = [];

  const unavailableResourceId = disruption.resourceId || affectedResource?.id;
  const unavailableResourceType = affectedResource?.type || 'ambulance';

  for (const incidentId of affectedIncidents) {
    const incident = state.incidents.find((inc) => inc.id === incidentId);
    if (!incident) {
      reasonParts.push(`Incident ${incidentId} not found in current scenario state.`);
      continue;
    }

    const candidates = findCandidateResources(
      unavailableResourceType,
      state.resources,
      unavailableResourceId
    );

    const incidentAlternatives = generateAlternatives(incident, candidates);
    allAlternatives.push(...incidentAlternatives);

    const bestAlt = selectBestAlternative(incidentAlternatives);

    if (bestAlt) {
      newAssignments.push({
        incidentId: incident.id,
        resourceId: bestAlt.resourceId,
        eta: bestAlt.eta,
        status: 'assigned'
      });
      const reasonMsg = `${unavailableResourceId || 'Resource'} became unavailable. ${bestAlt.resourceId} was selected as an available compatible ${unavailableResourceType}.`;
      reasonParts.push(reasonMsg);

      const log = addDecisionLog({
        timestamp: disruption.timestamp || new Date().toISOString(),
        event: 'RESOURCE_UNAVAILABLE',
        affectedIncident: incident.id,
        resourceId: unavailableResourceId,
        action: `Replanned ${incident.id} to ${bestAlt.resourceId}`,
        reason: `${unavailableResourceId} became unavailable.`,
        requiresHumanApproval: false
      });
      recordedLogs.push(log);
    } else {
      const reasonMsg = `${unavailableResourceId || 'Resource'} became unavailable. No available compatible ${unavailableResourceType} could be found for ${incident.id}.`;
      reasonParts.push(reasonMsg);

      const log = addDecisionLog({
        timestamp: disruption.timestamp || new Date().toISOString(),
        event: 'RESOURCE_UNAVAILABLE_NO_REPLACEMENT',
        affectedIncident: incident.id,
        resourceId: unavailableResourceId,
        action: `Flagged ${incident.id} for human operator attention`,
        reason: reasonMsg,
        requiresHumanApproval: true
      });
      recordedLogs.push(log);
    }
  }

  const requiresHumanApproval = determineHumanApproval(allAlternatives, newAssignments);

  const revisedPlan = createRevisedPlan(
    activePlan,
    affectedAssignments,
    newAssignments,
    requiresHumanApproval
  );

  const replanningResult: ReplanningResult = {
    trigger: disruption,
    affectedIncidents,
    oldAssignments: affectedAssignments,
    alternatives: allAlternatives,
    newAssignments,
    reason: reasonParts.join(' '),
    requiresHumanApproval
  };

  return { replanningResult, revisedPlan, decisionLogs: recordedLogs };
};
