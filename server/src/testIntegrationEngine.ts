import { getInitialScenario } from './scenarios/emergencyScenario.js';
import { runIntegratedReplanningPipeline } from './services/integratedReplanningEngine.js';
import { getDecisionLogs, clearDecisionLogs } from './services/decisionLogService.js';
import type { DisruptionEvent, Incident } from '@neuralnexus/shared';

async function testIntegrationEngine() {
  console.log('====================================================');
  console.log('🧪 TESTING INTEGRATED REPLANNING ENGINE PIPELINE');
  console.log('====================================================\n');

  clearDecisionLogs();

  // ====================================================
  // TEST 1: RESOURCE_UNAVAILABLE INTEGRATION
  // ====================================================
  console.log('--- TEST 1: RESOURCE_UNAVAILABLE (AMB-02 OUT OF SERVICE) ---');

  const scenario1 = getInitialScenario();
  const disruption1: DisruptionEvent = {
    type: 'RESOURCE_UNAVAILABLE',
    resourceId: 'AMB-02',
    timestamp: new Date().toISOString()
  };

  const output1 = await runIntegratedReplanningPipeline(disruption1, scenario1);

  console.log('\n[1. Disruption Analysis]');
  console.log(`- Affected Resource: ${output1.disruptionAnalysis.affectedResource?.id} (${output1.disruptionAnalysis.affectedResource?.status})`);
  console.log(`- Affected Incidents: ${JSON.stringify(output1.disruptionAnalysis.affectedIncidents)}`);
  console.log(`- Replanning Required: ${output1.disruptionAnalysis.replanningRequired}`);

  console.log('\n[2. AI Orchestration Pipeline Output]');
  console.log(`- Validation Valid: ${output1.aiReplanResponse.validation.isValid}`);
  console.log(`- AI SITREP Headline: "${output1.aiReplanResponse.plan.headline}"`);
  console.log(`- AI Executive Rationale: "${output1.aiReplanResponse.plan.executiveExplanation}"`);

  console.log('\n[3. Replanning Service Output]');
  console.log(`- Replanned New Assignment: ${JSON.stringify(output1.replanningOutcome.replanningResult.newAssignments)}`);
  console.log(`- Revised Plan Version: ${output1.replanningOutcome.revisedPlan.version}`);
  console.log(`- Revised Plan Status: ${output1.replanningOutcome.revisedPlan.status}`);
  console.log(`- Requires Human Approval: ${output1.replanningOutcome.replanningResult.requiresHumanApproval}`);

  console.log('\n[4. Decision Logs Verification]');
  const logs1 = getDecisionLogs();
  console.log(`- Recorded Decision Logs Count: ${logs1.length}`);
  console.log(`- Latest Log Action: "${logs1[logs1.length - 1]?.action}"`);

  // Verification Checklist Test 1
  const test1Passed =
    output1.disruptionAnalysis.affectedResource?.status === 'out_of_service' &&
    output1.disruptionAnalysis.affectedIncidents.includes('INC-002') &&
    output1.replanningOutcome.replanningResult.newAssignments.some((a) => a.resourceId === 'AMB-04') &&
    output1.replanningOutcome.revisedPlan.version === 2 &&
    logs1.length > 0;

  console.log(`\n>>> TEST 1 RESULT: ${test1Passed ? '✅ PASSED' : '❌ FAILED'}\n`);


  // ====================================================
  // TEST 2: NEW_INCIDENT INTEGRATION
  // ====================================================
  console.log('====================================================');
  console.log('--- TEST 2: NEW_INCIDENT (CRITICAL BUILDING FIRE INC-004) ---');
  console.log('====================================================\n');

  clearDecisionLogs();

  const scenario2 = getInitialScenario();
  const newIncident2: Incident = {
    id: 'INC-004',
    type: 'Building Fire',
    severity: 5,
    urgency: 'critical',
    location: { lat: 12.9700, lng: 77.6300 },
    requiredResources: ['ambulance', 'rescue'],
    status: 'active'
  };
  scenario2.incidents.push(newIncident2);

  const disruption2: DisruptionEvent = {
    type: 'NEW_INCIDENT',
    incidentId: 'INC-004',
    timestamp: new Date().toISOString()
  };

  const rawReportText2 = 'Massive building fire reported near Indiranagar with multiple casualties trapped inside.';

  const output2 = await runIntegratedReplanningPipeline(disruption2, scenario2, { rawReportText: rawReportText2 });

  console.log('\n[1. Disruption Analysis]');
  console.log(`- Affected Incident: ${JSON.stringify(output2.disruptionAnalysis.affectedIncidents)}`);
  console.log(`- Replanning Required: ${output2.disruptionAnalysis.replanningRequired}`);

  console.log('\n[2. AI Orchestration Pipeline Output]');
  console.log(`- AI Triaged Location: ${output2.aiReplanResponse.assessment?.location}`);
  console.log(`- AI Triaged Severity: ${output2.aiReplanResponse.assessment?.severity}`);
  console.log(`- AI SITREP Headline: "${output2.aiReplanResponse.plan.headline}"`);
  console.log(`- AI Executive Rationale: "${output2.aiReplanResponse.plan.executiveExplanation}"`);

  console.log('\n[3. Replanning Service Output]');
  console.log(`- Replanned New Assignment: ${JSON.stringify(output2.replanningOutcome.replanningResult.newAssignments)}`);
  console.log(`- Revised Plan Version: ${output2.replanningOutcome.revisedPlan.version}`);
  console.log(`- Revised Plan Status: ${output2.replanningOutcome.revisedPlan.status}`);
  console.log(`- Requires Human Approval: ${output2.replanningOutcome.replanningResult.requiresHumanApproval}`);

  console.log('\n[4. Decision Logs Verification]');
  const logs2 = getDecisionLogs();
  console.log(`- Recorded Decision Logs Count: ${logs2.length}`);
  console.log(`- Latest Log Event: "${logs2[logs2.length - 1]?.event}"`);
  console.log(`- Latest Log Action: "${logs2[logs2.length - 1]?.action}"`);

  // Verification Checklist Test 2
  const test2Passed =
    output2.disruptionAnalysis.affectedIncidents.includes('INC-004') &&
    output2.aiReplanResponse.assessment?.severity === 5 &&
    output2.replanningOutcome.replanningResult.requiresHumanApproval === true &&
    output2.replanningOutcome.revisedPlan.status === 'pending_approval' &&
    logs2.length > 0;

  console.log(`\n>>> TEST 2 RESULT: ${test2Passed ? '✅ PASSED' : '❌ FAILED'}\n`);

  console.log('====================================================');
  if (test1Passed && test2Passed) {
    console.log('🎉 INTEGRATED REPLANNING ENGINE PASSED 100%!');
  } else {
    console.log('❌ INTEGRATED REPLANNING ENGINE FAILED A TEST.');
  }
  console.log('====================================================');
}

testIntegrationEngine().catch((err) => {
  console.error('❌ Integration Test Crashed:', err);
  process.exit(1);
});
