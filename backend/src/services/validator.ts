import { 
  AllocationProposal, 
  ProposedAssignment, 
  RejectedAssignment, 
  Resource, 
  Incident, 
  ValidationResult 
} from '../types/agentTypes.js';

/**
 * Database Authority Guardrail (Zero-Trust LLM Layer)
 * 
 * CORE ARCHITECTURAL RULE:
 * MongoDB / Backend is the single authoritative source of truth.
 * An LLM (Gemini) can suggest or hallucinate, but code MUST enforce DB state.
 * If Gemini suggests assigning a resource whose DB status is OUT_OF_SERVICE,
 * the validator STRIPS the assignment, records an audit log, and flags requiresHumanApproval = true.
 */
export function validateAllocationAgainstDatabase(
  proposal: AllocationProposal,
  authoritativeResources: Resource[],
  authoritativeIncidents: Incident[]
): ValidationResult {
  const validatedAssignments: ProposedAssignment[] = [];
  const rejectedAssignments: RejectedAssignment[] = [];
  const databaseOverrides: string[] = [];

  const resourceMap = new Map<string, Resource>(
    authoritativeResources.map(r => [r.id, r])
  );
  const incidentMap = new Map<string, Incident>(
    authoritativeIncidents.map(i => [i.id, i])
  );

  const claimedResourceIds = new Set<string>();

  for (const proposed of proposal.proposedAssignments) {
    const authResource = resourceMap.get(proposed.resourceId);
    const authIncident = incidentMap.get(proposed.incidentId);

    // Rule 1: Existence Check
    if (!authResource) {
      rejectedAssignments.push({
        assignment: proposed,
        violationReason: `DATABASE AUTHORITY REJECTION: Resource ID "${proposed.resourceId}" does not exist in MongoDB authority.`,
        authoritativeResourceStatus: 'OUT_OF_SERVICE',
      });
      databaseOverrides.push(`Stripped non-existent resource "${proposed.resourceName}" (${proposed.resourceId}).`);
      continue;
    }

    // Rule 2: CRITICAL - OUT_OF_SERVICE Check
    if (authResource.status === 'OUT_OF_SERVICE') {
      rejectedAssignments.push({
        assignment: proposed,
        violationReason: `DATABASE AUTHORITY REJECTION: Resource "${authResource.name}" is marked OUT_OF_SERVICE in the database. Gemini proposal overridden.`,
        authoritativeResourceStatus: authResource.status,
      });
      databaseOverrides.push(
        `OVERRIDE: Prevented dispatch of ${authResource.name} to ${proposed.incidentTitle}. Database confirmed unit is OUT_OF_SERVICE.`
      );
      continue;
    }

    // Rule 3: Incident Existence
    if (!authIncident) {
      rejectedAssignments.push({
        assignment: proposed,
        violationReason: `DATABASE AUTHORITY REJECTION: Incident ID "${proposed.incidentId}" does not exist in MongoDB authority.`,
        authoritativeResourceStatus: authResource.status,
      });
      continue;
    }

    // Rule 4: Resource Capability Alignment
    const requiresAny = authIncident.requiredResources.map(r => r.toLowerCase());
    const matchesCapability = requiresAny.length === 0 || 
      requiresAny.includes(authResource.type.toLowerCase()) ||
      authResource.capabilities.some(c => requiresAny.includes(c.toLowerCase()));

    if (!matchesCapability) {
      rejectedAssignments.push({
        assignment: proposed,
        violationReason: `CAPABILITY MISMATCH: Resource "${authResource.name}" (${authResource.type}) does not satisfy required types [${authIncident.requiredResources.join(', ')}] for ${authIncident.title}.`,
        authoritativeResourceStatus: authResource.status,
      });
      databaseOverrides.push(`Mismatched capability: ${authResource.name} cannot handle ${authIncident.title}.`);
      continue;
    }

    // Rule 5: Duplicate Collision within same proposal
    if (claimedResourceIds.has(authResource.id)) {
      rejectedAssignments.push({
        assignment: proposed,
        violationReason: `COLLISION DETECTED: Resource "${authResource.name}" was double-booked in proposal for multiple concurrent assignments.`,
        authoritativeResourceStatus: authResource.status,
      });
      databaseOverrides.push(`Collision prevented for ${authResource.name}.`);
      continue;
    }

    // Validated
    claimedResourceIds.add(authResource.id);
    validatedAssignments.push({
      ...proposed,
      resourceName: authResource.name, // Guarantee canonical name from DB
      resourceType: authResource.type,
    });
  }

  const hasRejections = rejectedAssignments.length > 0;
  const requiresHumanApproval = proposal.requiresHumanApproval || hasRejections || validatedAssignments.some(v => v.isPreemption);

  return {
    isValid: !hasRejections,
    validatedAssignments,
    rejectedAssignments,
    databaseOverrides,
    requiresHumanApproval,
    systemWarning: hasRejections 
      ? `Database Authority Overrode ${rejectedAssignments.length} LLM proposed assignment(s). Safety guardrails active.`
      : undefined,
  };
}
