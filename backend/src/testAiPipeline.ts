import { runEmergencyReassessmentPipeline } from './services/orchestrator.js';
import type { Incident, Resource, ReplanTrigger } from './types/agentTypes.js';

async function testAiPipeline() {
  console.log('====================================================');
  console.log('🧪 TESTING AI MULTI-AGENT ORCHESTRATION PIPELINE');
  console.log('====================================================\n');

  // 1. Define mock emergency scenario (2 incidents, 3 resources, 1 active assignment)
  const incidents: Incident[] = [
    {
      id: 'INC-001',
      title: 'Car Collision on MG Road',
      description: 'Two vehicles collided causing minor traffic bottleneck.',
      severity: 3,
      urgency: 'medium',
      status: 'ASSIGNED',
      requiredResources: ['ambulance'],
      location: { name: 'MG Road', latitude: 12.9756, longitude: 77.6066 },
      casualtyEstimate: 1,
      reportedAt: new Date().toISOString(),
      assignedResourceIds: ['AMB-01']
    },
    {
      id: 'INC-002',
      title: 'Commercial Building Fire',
      description: 'Active spreading fire on 2nd floor with dense smoke.',
      severity: 4,
      urgency: 'high',
      status: 'TRIAGED',
      requiredResources: ['fire', 'rescue'],
      location: { name: 'Indiranagar', latitude: 12.9784, longitude: 77.6408 },
      casualtyEstimate: 2,
      reportedAt: new Date().toISOString()
    }
  ];

  const resources: Resource[] = [
    {
      id: 'AMB-01',
      name: 'Ambulance Unit 1',
      type: 'ambulance',
      status: 'ASSIGNED',
      currentLocation: { name: 'MG Road', latitude: 12.9716, longitude: 77.5946 },
      assignedIncidentId: 'INC-001',
      capabilities: ['ambulance']
    },
    {
      id: 'AMB-02',
      name: 'Ambulance Unit 2',
      type: 'ambulance',
      status: 'AVAILABLE',
      currentLocation: { name: 'Indiranagar Station', latitude: 12.9780, longitude: 77.6480 },
      assignedIncidentId: null,
      capabilities: ['ambulance']
    },
    {
      id: 'RES-01',
      name: 'Rescue Truck 1',
      type: 'rescue',
      status: 'AVAILABLE',
      currentLocation: { name: 'Fire Base Indiranagar', latitude: 12.9790, longitude: 77.6430 },
      assignedIncidentId: null,
      capabilities: ['rescue', 'fire']
    }
  ];

  const activeAssignments = { 'AMB-01': 'INC-001' };

  const trigger: ReplanTrigger = {
    type: 'NEW_INCIDENT',
    description: 'Massive chemical explosion reported near Electronic City with multiple casualties trapped inside.',
    incidentId: 'INC-003'
  };

  const rawReportText = 'Massive chemical explosion reported near Electronic City with multiple casualties trapped inside.';

  console.log('--- Step 1: Input Scenario ---');
  console.log(`Incidents Count: ${incidents.length}`);
  console.log(`Resources Count: ${resources.length}`);
  console.log(`Active Assignment: AMB-01 -> INC-001`);
  console.log(`Trigger Event: ${trigger.type} (${trigger.description})\n`);

  console.log('--- Step 2: Executing Multi-Agent Pipeline ---');
  const response = await runEmergencyReassessmentPipeline({
    trigger,
    incidents,
    resources,
    activeAssignments,
    rawReportText
  });

  console.log('\n--- Step 3: Pipeline Output Verification ---');

  // Verify Agent 1: Assessment Agent
  const hasAssessment = !!response.assessment;
  console.log(`1. Agent 1 (Assessment Agent) Execution: ${hasAssessment ? '✅ PASSED' : '❌ FAILED'}`);
  if (response.assessment) {
    console.log(`   - Triaged Severity: ${response.assessment.severity}`);
    console.log(`   - Triaged Urgency: ${response.assessment.urgency}`);
    console.log(`   - Required Resources: ${JSON.stringify(response.assessment.requiredResources)}`);
    console.log(`   - Triaged Location: ${response.assessment.location}`);
  }

  // Verify Agent 2: Allocation Agent
  const hasAllocation = !!response.rawAiProposal && Array.isArray(response.rawAiProposal.proposedAssignments);
  console.log(`2. Agent 2 (Allocation Agent) Execution: ${hasAllocation ? '✅ PASSED' : '❌ FAILED'}`);
  if (response.rawAiProposal) {
    console.log(`   - Proposed Assignments Count: ${response.rawAiProposal.proposedAssignments.length}`);
    console.log(`   - Tradeoff Summary: "${response.rawAiProposal.tradeoffSummary}"`);
  }

  // Verify Step 3: Database Authority Validator
  const hasValidation = !!response.validation && typeof response.validation.isValid === 'boolean';
  console.log(`3. Database Authority Guardrail (Validator) Execution: ${hasValidation ? '✅ PASSED' : '❌ FAILED'}`);
  if (response.validation) {
    console.log(`   - Validation Result: ${response.validation.isValid ? 'VALID' : 'REJECTED_WITH_OVERRIDE'}`);
    console.log(`   - Validated Assignments: ${response.validation.validatedAssignments.length}`);
  }

  // Verify Agent 3: Planning Agent
  const hasPlan = !!response.plan && !!response.plan.headline && !!response.plan.executiveExplanation;
  console.log(`4. Agent 3 (Planning Agent) Execution: ${hasPlan ? '✅ PASSED' : '❌ FAILED'}`);
  if (response.plan) {
    console.log(`   - SITREP Headline: "${response.plan.headline}"`);
    console.log(`   - Executive Explanation: "${response.plan.executiveExplanation}"`);
    console.log(`   - Operational Risks: ${JSON.stringify(response.plan.operationalRisks)}`);
    console.log(`   - Recommended Actions: ${JSON.stringify(response.plan.recommendedActions)}`);
  }

  // Verify Overall Response Structure
  const isComplete = hasAssessment && hasAllocation && hasValidation && hasPlan && !!response.timestamp;
  console.log(`\n5. Complete ReplanResponse Structure: ${isComplete ? '✅ PASSED' : '❌ FAILED'}`);

  console.log('\n====================================================');
  if (isComplete) {
    console.log('🎉 AI MULTI-AGENT ORCHESTRATION PIPELINE PASSED 100%!');
  } else {
    console.log('❌ AI PIPELINE FAILED A VERIFICATION CHECK.');
  }
  console.log('====================================================');
}

testAiPipeline().catch((err) => {
  console.error('❌ Pipeline Test Crashed:', err);
  process.exit(1);
});
