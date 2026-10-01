import {
  Incident,
  Resource,
  Assignment,
  DisruptionEvent,
  AlternativeAssignment,
  ReplanningResult,
  DecisionLog
} from '@shared/emergency';
import { calculateDistance, calculateEta } from '../utils/geo';

export interface ReplanningContext {
  incidents: Incident[];
  resources: Resource[];
  assignments: Assignment[];
}

export interface ReplanningOutput {
  result: ReplanningResult;
  updatedIncidents: Incident[];
  updatedResources: Resource[];
  updatedAssignments: Assignment[];
  logs: DecisionLog[];
}

/**
 * Core Dynamic Replanning Engine for NeuralNexus
 * Analyzes disruption events and dynamically reallocates emergency response resources.
 */
export class ReplanningEngine {
  /**
   * Process a Disruption Event against current emergency scenario state
   */
  public static replan(event: DisruptionEvent, context: ReplanningContext): ReplanningOutput {
    const timestamp = event.timestamp || new Date().toISOString();
    const logs: DecisionLog[] = [];
    const updatedIncidents: Incident[] = JSON.parse(JSON.stringify(context.incidents));
    const updatedResources: Resource[] = JSON.parse(JSON.stringify(context.resources));
    const oldAssignments: Assignment[] = JSON.parse(JSON.stringify(context.assignments));
    let newAssignments: Assignment[] = JSON.parse(JSON.stringify(context.assignments));

    const alternatives: AlternativeAssignment[] = [];
    const affectedIncidentsSet = new Set<string>();
    let reasonText = '';
    let requiresHumanApproval = false;

    logs.push({
      timestamp,
      event: event.type,
      affectedIncident: event.incidentId,
      resourceId: event.resourceId,
      action: 'PROCESS_DISRUPTION_START',
      reason: `Disruption triggered: ${event.type}`,
      requiresHumanApproval: false
    });

    if (event.type === 'RESOURCE_UNAVAILABLE') {
      const targetResourceId = event.resourceId;
      const resource = updatedResources.find((r) => r.id === targetResourceId);

      if (resource) {
        resource.status = 'out_of_service';
        resource.assignedIncidentId = null;
      }

      // Find affected assignment
      const affectedIndex = newAssignments.findIndex(
        (a) => a.resourceId === targetResourceId && a.status !== 'completed' && a.status !== 'cancelled'
      );

      if (affectedIndex !== -1) {
        const affectedAssignment = newAssignments[affectedIndex];
        affectedIncidentsSet.add(affectedAssignment.incidentId);

        // Mark previous assignment as cancelled
        affectedAssignment.status = 'cancelled';

        const incident = updatedIncidents.find((i) => i.id === affectedAssignment.incidentId);

        if (incident) {
          incident.status = 'pending';

          // Search for available resource of matching type
          const availableResource = updatedResources.find(
            (r) => r.status === 'available' && incident.requiredResources.includes(r.type)
          );

          if (availableResource) {
            const dist = calculateDistance(availableResource.location, incident.location);
            const eta = calculateEta(dist);

            availableResource.status = 'assigned';
            availableResource.assignedIncidentId = incident.id;
            incident.status = 'active';

            const newAssign: Assignment = {
              incidentId: incident.id,
              resourceId: availableResource.id,
              eta,
              status: 'assigned'
            };

            newAssignments.push(newAssign);

            const alt: AlternativeAssignment = {
              resourceId: availableResource.id,
              incidentId: incident.id,
              eta,
              impact: 'low',
              reason: `Reassigned from out_of_service ${targetResourceId} to available ${availableResource.id}`
            };

            alternatives.push(alt);
            reasonText = `Resource ${targetResourceId} became unavailable. Reassigned incident ${incident.id} to available resource ${availableResource.id} (ETA: ${eta} mins).`;

            logs.push({
              timestamp,
              event: event.type,
              affectedIncident: incident.id,
              resourceId: availableResource.id,
              action: 'REASSIGNMENT_SUCCESS',
              reason: reasonText,
              requiresHumanApproval: false
            });
          } else {
            // Attempt preemption from lower severity incident
            const preempted = this.attemptPreemption(incident, updatedIncidents, updatedResources, newAssignments);

            if (preempted) {
              alternatives.push(preempted.alt);
              newAssignments.push(preempted.newAssignment);
              affectedIncidentsSet.add(preempted.preemptedIncidentId);
              requiresHumanApproval = true;

              reasonText = `Resource ${targetResourceId} became unavailable. Preempted resource ${preempted.newAssignment.resourceId} from lower severity incident ${preempted.preemptedIncidentId} for critical incident ${incident.id}. Requires human approval.`;

              logs.push({
                timestamp,
                event: event.type,
                affectedIncident: incident.id,
                resourceId: preempted.newAssignment.resourceId,
                action: 'RESOURCE_PREEMPTED',
                reason: reasonText,
                requiresHumanApproval: true
              });
            } else {
              requiresHumanApproval = true;
              reasonText = `Resource ${targetResourceId} became unavailable. No available or preemptible resource found for incident ${incident.id}. Incident marked pending. Human intervention required.`;

              logs.push({
                timestamp,
                event: event.type,
                affectedIncident: incident.id,
                resourceId: targetResourceId,
                action: 'REASSIGNMENT_FAILED',
                reason: reasonText,
                requiresHumanApproval: true
              });
            }
          }
        }
      } else {
        reasonText = `Resource ${targetResourceId} marked out_of_service. No active assignment impacted.`;
      }
    } else if (event.type === 'NEW_INCIDENT') {
      const incidentId = event.incidentId;
      const newIncident = updatedIncidents.find((i) => i.id === incidentId);

      if (newIncident) {
        affectedIncidentsSet.add(newIncident.id);

        for (const reqType of newIncident.requiredResources) {
          const availableResource = updatedResources.find(
            (r) => r.status === 'available' && r.type === reqType
          );

          if (availableResource) {
            const dist = calculateDistance(availableResource.location, newIncident.location);
            const eta = calculateEta(dist);

            availableResource.status = 'assigned';
            availableResource.assignedIncidentId = newIncident.id;
            newIncident.status = 'active';

            const newAssign: Assignment = {
              incidentId: newIncident.id,
              resourceId: availableResource.id,
              eta,
              status: 'assigned'
            };

            newAssignments.push(newAssign);

            alternatives.push({
              resourceId: availableResource.id,
              incidentId: newIncident.id,
              eta,
              impact: 'low',
              reason: `Dispatched available ${availableResource.id} to new incident ${newIncident.id}`
            });

            logs.push({
              timestamp,
              event: event.type,
              affectedIncident: newIncident.id,
              resourceId: availableResource.id,
              action: 'NEW_INCIDENT_DISPATCHED',
              reason: `Dispatched ${availableResource.id} to new incident ${newIncident.id} (ETA: ${eta}m)`,
              requiresHumanApproval: false
            });
          } else if (newIncident.severity >= 4 || newIncident.urgency === 'critical') {
            const preempted = this.attemptPreemption(newIncident, updatedIncidents, updatedResources, newAssignments);
            if (preempted) {
              alternatives.push(preempted.alt);
              newAssignments.push(preempted.newAssignment);
              affectedIncidentsSet.add(preempted.preemptedIncidentId);
              requiresHumanApproval = true;
            } else {
              requiresHumanApproval = true;
            }
          }
        }

        reasonText = `Processed new incident ${newIncident.id} (${newIncident.type}, Severity: ${newIncident.severity}).`;
      }
    }

    const result: ReplanningResult = {
      trigger: event,
      affectedIncidents: Array.from(affectedIncidentsSet),
      oldAssignments,
      alternatives,
      newAssignments,
      reason: reasonText,
      requiresHumanApproval
    };

    return {
      result,
      updatedIncidents,
      updatedResources,
      updatedAssignments: newAssignments,
      logs
    };
  }

  /**
   * Helper to preempt a resource assigned to a lower severity incident for a higher severity incident
   */
  private static attemptPreemption(
    targetIncident: Incident,
    incidents: Incident[],
    resources: Resource[],
    assignments: Assignment[]
  ): { newAssignment: Assignment; alt: AlternativeAssignment; preemptedIncidentId: string } | null {
    for (const assignment of assignments) {
      if (assignment.status === 'assigned' || assignment.status === 'en_route') {
        const otherIncident = incidents.find((i) => i.id === assignment.incidentId);
        if (otherIncident && otherIncident.severity < targetIncident.severity) {
          const resource = resources.find((r) => r.id === assignment.resourceId);
          if (resource && targetIncident.requiredResources.includes(resource.type)) {
            assignment.status = 'cancelled';
            otherIncident.status = 'pending';

            const dist = calculateDistance(resource.location, targetIncident.location);
            const eta = calculateEta(dist);

            resource.assignedIncidentId = targetIncident.id;
            targetIncident.status = 'active';

            const newAssignment: Assignment = {
              incidentId: targetIncident.id,
              resourceId: resource.id,
              eta,
              status: 'assigned'
            };

            const alt: AlternativeAssignment = {
              resourceId: resource.id,
              incidentId: targetIncident.id,
              eta,
              impact: 'high',
              reason: `Preempted resource ${resource.id} from lower severity incident ${otherIncident.id} (${otherIncident.severity}) to critical incident ${targetIncident.id}`
            };

            return {
              newAssignment,
              alt,
              preemptedIncidentId: otherIncident.id
            };
          }
        }
      }
    }
    return null;
  }
}
