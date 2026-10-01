import { 
  Incident, 
  Resource, 
  TravelEstimate, 
  AllocationProposal, 
  ProposedAssignment 
} from '../types/agentTypes.js';
import { queryGeminiJson } from '../services/geminiClient.js';

const SYSTEM_INSTRUCTION = `You are ResQAlloc Resource Allocation Agent (Agent 2).
Your objective is to propose optimal resource-to-incident allocations based on triage priority, geographic travel time, and resource specialization.

Operational Principles:
1. Triage Priority First: Incidents with Severity 5 (Critical) take absolute precedence over Severity 4, 3, 2, 1.
2. Preemption Rule: If all resources of a required type are committed, you MAY reassign (preempt) a resource from a lower-severity incident (e.g., Severity 2 or 3) to save lives at a Severity 5 incident. Clearly flag isPreemption = true.
3. Proximity / Travel Time: Among eligible units, select the one with the lowest travel time.
4. Database Authority Respect: NEVER assign any resource marked with status "OUT_OF_SERVICE".
5. Non-Direct Execution: You do not modify the database. You ONLY output proposed assignments for backend validation and human commander approval.

Return ONLY pure JSON matching schema:
{
  "proposedAssignments": [
    {
      "incidentId": string,
      "incidentTitle": string,
      "resourceId": string,
      "resourceName": string,
      "resourceType": string,
      "estimatedTravelMinutes": number,
      "isPreemption": boolean,
      "preemptedFromIncidentId": string | null,
      "rationale": string
    }
  ],
  "unassignedIncidents": [
    {
      "incidentId": string,
      "incidentTitle": string,
      "reason": string,
      "urgency": string
    }
  ],
  "idleResources": string[],
  "tradeoffSummary": string,
  "requiresHumanApproval": boolean
}`;

export interface AllocationContext {
  incidents: Incident[];
  resources: Resource[];
  travelEstimates?: TravelEstimate[];
  activeAssignments?: Record<string, string>; // resourceId -> incidentId
}

export async function allocateResources(context: AllocationContext): Promise<AllocationProposal> {
  const { incidents, resources, travelEstimates = [], activeAssignments = {} } = context;

  const promptPayload = {
    activeIncidents: incidents.map(inc => ({
      id: inc.id,
      title: inc.title,
      severity: inc.severity,
      urgency: inc.urgency,
      status: inc.status,
      requiredResources: inc.requiredResources,
      location: inc.location.name,
      casualtyEstimate: inc.casualtyEstimate,
    })),
    resourcesFleet: resources.map(res => ({
      id: res.id,
      name: res.name,
      type: res.type,
      status: res.status,
      capabilities: res.capabilities,
      currentLocation: res.currentLocation.name,
      currentlyAssignedToIncident: activeAssignments[res.id] || res.assignedIncidentId || null,
    })),
    travelTimes: travelEstimates,
  };

  const prompt = `Formulate optimal emergency resource assignments for the current situation:\n${JSON.stringify(promptPayload, null, 2)}`;

  // Deterministic local optimization heuristic for fallback & benchmark
  const fallbackGenerator = (): AllocationProposal => {
    const proposedAssignments: ProposedAssignment[] = [];
    const assignedResourceIds = new Set<string>();
    const assignedIncidentIds = new Set<string>();

    // 1. Sort incidents by Severity DESC (5 to 1), then urgency
    const sortedIncidents = [...incidents].sort((a, b) => {
      if (b.severity !== a.severity) return b.severity - a.severity;
      const urgencyRank = { critical: 4, high: 3, medium: 2, low: 1 };
      return urgencyRank[b.urgency] - urgencyRank[a.urgency];
    });

    // Helper to find travel time
    const getTravelMinutes = (resId: string, incId: string): number => {
      const match = travelEstimates.find(t => t.resourceId === resId && t.incidentId === incId);
      return match ? match.estimatedMinutes : 12; // default 12 mins
    };

    // Track active assignments in memory during simulation
    const currentAssignmentMap = new Map<string, string>(); // resourceId -> incidentId
    for (const res of resources) {
      const incId = activeAssignments[res.id] || res.assignedIncidentId;
      if (incId) {
        currentAssignmentMap.set(res.id, incId);
      }
    }

    // Step 1: Assign truly AVAILABLE resources first
    for (const inc of sortedIncidents) {
      if (inc.status === 'RESOLVED') continue;

      for (const reqType of inc.requiredResources) {
        // Find available matching resources (excluding OUT_OF_SERVICE)
        const candidates = resources.filter(res => 
          res.type.toLowerCase() === reqType.toLowerCase() &&
          res.status === 'AVAILABLE' &&
          !assignedResourceIds.has(res.id)
        );

        if (candidates.length > 0) {
          // Sort candidates by travel time ascending
          candidates.sort((a, b) => getTravelMinutes(a.id, inc.id) - getTravelMinutes(b.id, inc.id));
          const chosen = candidates[0];

          assignedResourceIds.add(chosen.id);
          assignedIncidentIds.add(inc.id);
          currentAssignmentMap.set(chosen.id, inc.id);

          proposedAssignments.push({
            incidentId: inc.id,
            incidentTitle: inc.title,
            resourceId: chosen.id,
            resourceName: chosen.name,
            resourceType: chosen.type,
            estimatedTravelMinutes: getTravelMinutes(chosen.id, inc.id),
            isPreemption: false,
            preemptedFromIncidentId: null,
            rationale: `Dispatched available ${chosen.name} to ${inc.title} based on fastest arrival time (${getTravelMinutes(chosen.id, inc.id)}m).`,
          });
        }
      }
    }

    // Step 2: Preemption check for critical/high-severity incidents that are still missing resources
    for (const inc of sortedIncidents) {
      if (inc.status === 'RESOLVED') continue;
      
      const hasAssignment = proposedAssignments.some(p => p.incidentId === inc.id);
      if (!hasAssignment && inc.severity >= 4) {
        for (const reqType of inc.requiredResources) {
          // Look for resources of matching type currently assigned to lower severity incidents (< inc.severity)
          const preemptableCandidates = resources.filter(res => {
            if (res.type.toLowerCase() !== reqType.toLowerCase()) return false;
            if (res.status === 'OUT_OF_SERVICE') return false; // strictly respect DB status
            
            const currentIncId = currentAssignmentMap.get(res.id);
            if (!currentIncId) return false;

            const currentInc = incidents.find(i => i.id === currentIncId);
            return currentInc && currentInc.severity < inc.severity;
          });

          if (preemptableCandidates.length > 0) {
            // Sort by lowest travel time to new critical incident
            preemptableCandidates.sort((a, b) => getTravelMinutes(a.id, inc.id) - getTravelMinutes(b.id, inc.id));
            const preemptedResource = preemptableCandidates[0];
            const previousIncidentId = currentAssignmentMap.get(preemptedResource.id)!;
            const previousIncident = incidents.find(i => i.id === previousIncidentId);

            // Remove any previous proposed assignment for this resource
            const prevIndex = proposedAssignments.findIndex(p => p.resourceId === preemptedResource.id);
            if (prevIndex !== -1) {
              proposedAssignments.splice(prevIndex, 1);
            }

            assignedResourceIds.add(preemptedResource.id);
            assignedIncidentIds.add(inc.id);
            currentAssignmentMap.set(preemptedResource.id, inc.id);

            proposedAssignments.push({
              incidentId: inc.id,
              incidentTitle: inc.title,
              resourceId: preemptedResource.id,
              resourceName: preemptedResource.name,
              resourceType: preemptedResource.type,
              estimatedTravelMinutes: getTravelMinutes(preemptedResource.id, inc.id),
              isPreemption: true,
              preemptedFromIncidentId: previousIncidentId,
              rationale: `Emergency Preemption: Reassigned ${preemptedResource.name} from lower severity ${previousIncident?.title || 'routine incident'} (Severity ${previousIncident?.severity || '?'}) to high-severity critical incident ${inc.title} (Severity ${inc.severity}).`,
            });
            break;
          }
        }
      }
    }

    // Determine unassigned incidents
    const unassignedIncidents = sortedIncidents
      .filter(inc => inc.status !== 'RESOLVED' && !proposedAssignments.some(p => p.incidentId === inc.id))
      .map(inc => ({
        incidentId: inc.id,
        incidentTitle: inc.title,
        reason: inc.severity <= 3 
          ? 'Resources preempted or queued due to concurrent higher-severity critical emergencies.'
          : 'Insufficient fleet capacity: all matching units currently deployed.',
        urgency: inc.urgency,
      }));

    // Find idle resources
    const idleResources = resources
      .filter(r => r.status === 'AVAILABLE' && !assignedResourceIds.has(r.id))
      .map(r => r.id);

    const hasPreemption = proposedAssignments.some(p => p.isPreemption);
    const requiresHumanApproval = hasPreemption || unassignedIncidents.length > 0;

    let tradeoffSummary = 'All eligible incidents successfully allocated optimal resources.';
    if (hasPreemption) {
      tradeoffSummary = 'High-severity critical incidents triggered tactical resource preemption. Lower-priority incidents have been queued with monitored delay.';
    } else if (unassignedIncidents.length > 0) {
      tradeoffSummary = `${unassignedIncidents.length} incident(s) awaiting available units. Queue prioritized by clinical triage severity.`;
    }

    return {
      proposedAssignments,
      unassignedIncidents,
      idleResources,
      tradeoffSummary,
      requiresHumanApproval,
    };
  };

  const result = await queryGeminiJson<AllocationProposal>(prompt, SYSTEM_INSTRUCTION, fallbackGenerator);
  const data = result.data;

  return {
    proposedAssignments: Array.isArray(data.proposedAssignments) ? data.proposedAssignments : [],
    unassignedIncidents: Array.isArray(data.unassignedIncidents) ? data.unassignedIncidents : [],
    idleResources: Array.isArray(data.idleResources) ? data.idleResources : [],
    tradeoffSummary: data.tradeoffSummary || 'Resource reallocation generated.',
    requiresHumanApproval: Boolean(data.requiresHumanApproval ?? true),
  };
}
