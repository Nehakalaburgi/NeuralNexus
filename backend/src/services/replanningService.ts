import {
  Incident,
  Resource,
  Assignment,
  ResponsePlan,
  AlternativeAssignment,
  ReplanningResult,
  DecisionLog
} from '@shared/emergency';
import { DisruptionAnalysisResult } from './disruptionService';
import { DecisionLogService } from './decisionLogService';
import {
  getIncidents,
  getResources,
  getAssignments,
  getResponsePlan
} from '../scenarios/emergencyScenario';
import { calculateDistance, calculateEta } from '../utils/geo';

export interface ReplanningContext {
  incidents: Incident[];
  resources: Resource[];
  assignments: Assignment[];
  responsePlan: ResponsePlan;
}

/**
 * Dynamic Replanning Service for NeuralNexus
 * Takes a disruption analysis result and generates a revised emergency response plan.
 */
export class ReplanningService {
  /**
   * Main entry point to create a revised response plan from a disruption analysis result
   */
  public static replanResponsePlan(
    analysis: DisruptionAnalysisResult,
    context?: ReplanningContext
  ): { replanningResult: ReplanningResult; revisedResponsePlan: ResponsePlan } {
    const incidents = context ? context.incidents : getIncidents();
    const resources = context ? context.resources : getResources();
    const assignments = context ? context.assignments : getAssignments();
    const currentPlan = context ? context.responsePlan : getResponsePlan();

    const affectedIncidents = analysis.affectedIncidents || [];
    const oldAssignments = [...analysis.affectedAssignments];
    const alternatives: AlternativeAssignment[] = [];
    const newAssignments: Assignment[] = [];

    let requiresHumanApproval = false;
    let mainReason = '';

    // ----------------------------------------------------
    // Disruption Type 1: RESOURCE_UNAVAILABLE
    // ----------------------------------------------------
    if (analysis.disruption.type === 'RESOURCE_UNAVAILABLE') {
      const unavailableResourceId = analysis.disruption.resourceId;

      for (const incidentId of affectedIncidents) {
        const incident = incidents.find((i) => i.id === incidentId);
        if (!incident) continue;

        // Determine affected assignment for this incident
        const affectedAssign = oldAssignments.find((a) => a.incidentId === incidentId);
        if (!affectedAssign) continue;

        // Find the resource type of the lost assignment
        const lostResource = resources.find((r) => r.id === unavailableResourceId);
        const requiredType = lostResource ? lostResource.type : incident.requiredResources[0] || 'ambulance';

        // Find candidate available resources
        const candidates = this.findCandidateResources(requiredType, resources);

        if (candidates.length === 0) {
          // No available resource candidate
          requiresHumanApproval = true;
          mainReason = `Resource ${unavailableResourceId} became unavailable for ${incident.id}. No available compatible ${requiredType} found. Flagged for human dispatcher attention.`;

          DecisionLogService.addDecisionLog({
            timestamp: analysis.disruption.timestamp || new Date().toISOString(),
            event: 'RESOURCE_UNAVAILABLE',
            affectedIncident: incident.id,
            resourceId: unavailableResourceId,
            action: `Flagged ${incident.id} for human dispatcher attention`,
            reason: mainReason,
            requiresHumanApproval: true
          });
        } else {
          // Generate and rank alternatives
          const generatedAlts = this.generateAlternatives(incident, requiredType, candidates);
          alternatives.push(...generatedAlts);

          // Select best alternative (lowest ETA)
          const bestAlt = this.selectBestAlternative(generatedAlts);

          if (bestAlt) {
            // Check for duplicate assignment prevention
            const isAlreadyAssigned = assignments.some(
              (a) => a.incidentId === incident.id && a.resourceId === bestAlt.resourceId && a.status !== 'cancelled'
            );

            if (!isAlreadyAssigned) {
              const selectedRes = resources.find((r) => r.id === bestAlt.resourceId);
              if (selectedRes) {
                selectedRes.status = 'assigned';
                selectedRes.assignedIncidentId = incident.id;
              }

              const newAssignment: Assignment = {
                incidentId: incident.id,
                resourceId: bestAlt.resourceId,
                eta: bestAlt.eta,
                status: 'assigned'
              };

              newAssignments.push(newAssignment);
              mainReason = `${unavailableResourceId} became unavailable. ${bestAlt.resourceId} was selected as an available compatible ${requiredType}.`;

              DecisionLogService.addDecisionLog({
                timestamp: analysis.disruption.timestamp || new Date().toISOString(),
                event: 'RESOURCE_UNAVAILABLE',
                affectedIncident: incident.id,
                resourceId: unavailableResourceId,
                action: `Replanned ${incident.id} to ${bestAlt.resourceId}`,
                reason: `${unavailableResourceId} became unavailable.`,
                requiresHumanApproval: false
              });
            }
          } else {
            requiresHumanApproval = true;
            mainReason = `Failed to select an alternative resource for ${incident.id}. Requires human approval.`;

            DecisionLogService.addDecisionLog({
              timestamp: analysis.disruption.timestamp || new Date().toISOString(),
              event: 'RESOURCE_UNAVAILABLE',
              affectedIncident: incident.id,
              resourceId: unavailableResourceId,
              action: `Flagged ${incident.id} for human dispatcher selection`,
              reason: mainReason,
              requiresHumanApproval: true
            });
          }
        }
      }
    }
    // ----------------------------------------------------
    // Disruption Type 2: NEW_INCIDENT
    // ----------------------------------------------------
    else if (analysis.disruption.type === 'NEW_INCIDENT') {
      const incidentId = analysis.disruption.incidentId;
      const newIncident = incidents.find((i) => i.id === incidentId);

      if (newIncident) {
        const assignedForNewIncident: string[] = [];
        const missingRequirements: string[] = [];

        for (const reqType of newIncident.requiredResources) {
          const candidates = this.findCandidateResources(reqType, resources);

          if (candidates.length > 0) {
            const generatedAlts = this.generateAlternatives(newIncident, reqType, candidates);
            alternatives.push(...generatedAlts);

            const bestAlt = this.selectBestAlternative(generatedAlts);
            if (bestAlt) {
              const selectedRes = resources.find((r) => r.id === bestAlt.resourceId);
              if (selectedRes) {
                selectedRes.status = 'assigned';
                selectedRes.assignedIncidentId = newIncident.id;
              }

              const newAssign: Assignment = {
                incidentId: newIncident.id,
                resourceId: bestAlt.resourceId,
                eta: bestAlt.eta,
                status: 'assigned'
              };

              newAssignments.push(newAssign);
              assignedForNewIncident.push(bestAlt.resourceId);
            }
          } else {
            // Required resource not available in standby pool
            missingRequirements.push(reqType);
            requiresHumanApproval = true;

            // Evaluate if any assigned resource exists in system for this type
            const assignedInSystem = resources.filter((r) => r.type === reqType && r.status === 'assigned');
            if (assignedInSystem.length > 0) {
              alternatives.push({
                resourceId: assignedInSystem[0].id,
                incidentId: newIncident.id,
                eta: 15,
                impact: 'high',
                reason: `Reallocating ${assignedInSystem[0].id} from active incident ${assignedInSystem[0].assignedIncidentId} would negatively impact active response operations.`
              });
            }
          }
        }

        if (missingRequirements.length > 0) {
          if (assignedForNewIncident.length > 0) {
            mainReason = `New incident ${newIncident.id} received partial resources (${assignedForNewIncident.join(', ')}). Missing required resource types: [${missingRequirements.join(', ')}]. Reallocation requires human approval.`;
          } else {
            mainReason = `New incident ${newIncident.id} requires [${missingRequirements.join(', ')}], but no compatible resources exist or are available. Flagged for human approval.`;
          }

          DecisionLogService.addDecisionLog({
            timestamp: analysis.disruption.timestamp || new Date().toISOString(),
            event: 'REALLOCATION_PROPOSED',
            affectedIncident: newIncident.id,
            resourceId: missingRequirements[0] === 'rescue' ? 'RES-01' : missingRequirements[0],
            action: `Proposed ${missingRequirements[0]} reassignment for new critical incident`,
            reason: `New critical incident requires rescue resources.`,
            requiresHumanApproval: true
          });
        } else {
          mainReason = `New incident ${newIncident.id} successfully assigned suitable available resources (${assignedForNewIncident.join(', ')}) without impacting existing assignments.`;

          DecisionLogService.addDecisionLog({
            timestamp: analysis.disruption.timestamp || new Date().toISOString(),
            event: 'NEW_INCIDENT',
            affectedIncident: newIncident.id,
            resourceId: assignedForNewIncident.join(', '),
            action: `Assigned ${assignedForNewIncident.join(', ')} to new critical incident`,
            reason: `${assignedForNewIncident.join(', ')} was available and compatible.`,
            requiresHumanApproval: false
          });
        }
      }
    }

    // Build revised response plan preserving unaffected assignments
    const revisedResponsePlan = this.createRevisedPlan(
      currentPlan,
      assignments,
      oldAssignments,
      newAssignments,
      requiresHumanApproval
    );

    const replanningResult: ReplanningResult = {
      trigger: analysis.disruption,
      affectedIncidents,
      oldAssignments,
      alternatives,
      newAssignments,
      reason: mainReason || analysis.disruption.type,
      requiresHumanApproval
    };

    return {
      replanningResult,
      revisedResponsePlan
    };
  }

  /**
   * Helper 1: Finds resources that are available, match required type, not out_of_service, not assigned elsewhere
   */
  public static findCandidateResources(requiredType: string, resources: Resource[]): Resource[] {
    return resources.filter(
      (r) =>
        r.type === requiredType &&
        r.status === 'available' &&
        (!r.assignedIncidentId || r.assignedIncidentId === null)
    );
  }

  /**
   * Helper 2: Generates alternative assignment options with simulated ETAs and impact levels
   */
  public static generateAlternatives(
    incident: Incident,
    requiredType: string,
    candidates: Resource[]
  ): AlternativeAssignment[] {
    return candidates.map((candidate) => {
      const distanceKm = calculateDistance(candidate.location, incident.location);
      const eta = calculateEta(distanceKm);

      return {
        resourceId: candidate.id,
        incidentId: incident.id,
        eta,
        impact: 'low',
        reason: `${candidate.id} is available and compatible with the ${requiredType} requirement.`
      };
    });
  }

  /**
   * Helper 3: Selects best alternative ranked by lowest ETA and compatibility
   */
  public static selectBestAlternative(
    alternatives: AlternativeAssignment[]
  ): AlternativeAssignment | null {
    if (!alternatives || alternatives.length === 0) return null;

    // Sort by ETA ascending
    const sorted = [...alternatives].sort((a, b) => a.eta - b.eta);
    return sorted[0];
  }

  /**
   * Helper 4: Creates a revised ResponsePlan preserving unaffected assignments and increasing version
   */
  public static createRevisedPlan(
    currentPlan: ResponsePlan,
    allAssignments: Assignment[],
    oldAssignments: Assignment[],
    newAssignments: Assignment[],
    requiresHumanApproval: boolean = false
  ): ResponsePlan {
    const oldResourceIds = new Set(oldAssignments.map((a) => a.resourceId));

    // Preserve assignments that were not affected by the disruption
    const preservedAssignments = allAssignments.filter(
      (a) => !oldResourceIds.has(a.resourceId) && a.status !== 'cancelled'
    );

    const updatedAssignments = [...preservedAssignments, ...newAssignments];
    const status: ResponsePlan['status'] = requiresHumanApproval ? 'pending_approval' : 'active';

    return {
      id: currentPlan.id || 'PLAN-001',
      version: currentPlan.version + 1,
      assignments: updatedAssignments,
      status
    };
  }
}

export const replanResponsePlan = ReplanningService.replanResponsePlan.bind(ReplanningService);
export type ReplanningOutcome = {
  replanningResult: ReplanningResult;
  revisedPlan?: ResponsePlan;
  revisedResponsePlan?: ResponsePlan;
  decisionLogs?: DecisionLog[];
};
