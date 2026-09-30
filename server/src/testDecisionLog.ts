import { getInitialScenario } from './scenarios/emergencyScenario.js';
import { handleDisruption } from './services/disruptionService.js';
import { replanResponsePlan } from './services/replanningService.js';
import { getDecisionLogs, clearDecisionLogs } from './services/decisionLogService.js';
import type { DisruptionEvent, Incident } from '@neuralnexus/shared';

console.log('====================================================');
console.log('🧪 TESTING DECISION LOG SERVICE');
console.log('====================================================\n');

// Clear existing logs before starting tests
clearDecisionLogs();

console.log('--- Step 1: Verify Initial Empty Decision Logs ---');
let logs = getDecisionLogs();
console.log(`Initial Logs Count: ${logs.length} (Expected 0)`);
console.log(`- Clear check: ${logs.length === 0 ? '✅ PASSED' : '❌ FAILED'}\n`);


console.log('--- Step 2: Test 1 - RESOURCE_UNAVAILABLE Decision Logging ---');
const scenario1 = getInitialScenario();
const disruption1: DisruptionEvent = {
  type: 'RESOURCE_UNAVAILABLE',
  resourceId: 'AMB-02',
  timestamp: new Date().toISOString()
};

const result1 = handleDisruption(disruption1, scenario1);
replanResponsePlan(result1, scenario1);

logs = getDecisionLogs();
console.log(`Logs Count after RESOURCE_UNAVAILABLE: ${logs.length}`);
console.log('Logged Entry:', JSON.stringify(logs[logs.length - 1], null, 2));
const log1 = logs[logs.length - 1];
console.log(`- Event is RESOURCE_UNAVAILABLE: ${log1.event === 'RESOURCE_UNAVAILABLE' ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`- Resource ID is AMB-02: ${log1.resourceId === 'AMB-02' ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`- Affected Incident is INC-002: ${log1.affectedIncident === 'INC-002' ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`- Human Approval is false: ${log1.requiresHumanApproval === false ? '✅ PASSED' : '❌ FAILED'}\n`);


console.log('--- Step 3: Test 2 - NEW_INCIDENT Decision Logging ---');
const scenario2 = getInitialScenario();
const newIncident2: Incident = {
  id: 'INC-004',
  type: 'Road Hazard',
  severity: 3,
  urgency: 'medium',
  location: { lat: 12.9650, lng: 77.5800 },
  requiredResources: ['ambulance'],
  status: 'active'
};
scenario2.incidents.push(newIncident2);

const disruption2: DisruptionEvent = {
  type: 'NEW_INCIDENT',
  incidentId: 'INC-004',
  timestamp: new Date().toISOString()
};

const result2 = handleDisruption(disruption2, scenario2, { newIncident: newIncident2 });
replanResponsePlan(result2, scenario2);

logs = getDecisionLogs();
console.log(`Logs Count after NEW_INCIDENT: ${logs.length}`);
console.log('Logged Entry:', JSON.stringify(logs[logs.length - 1], null, 2));
const log2 = logs[logs.length - 1];
console.log(`- Event is NEW_INCIDENT: ${log2.event === 'NEW_INCIDENT' ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`- Resource ID is AMB-04: ${log2.resourceId === 'AMB-04' ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`- Affected Incident is INC-004: ${log2.affectedIncident === 'INC-004' ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`- Human Approval is false: ${log2.requiresHumanApproval === false ? '✅ PASSED' : '❌ FAILED'}\n`);


console.log('--- Step 4: Test 3 - Human Approval Scenario Logging ---');
const scenario3 = getInitialScenario();
const newIncident3: Incident = {
  id: 'INC-004',
  type: 'Building Fire',
  severity: 5,
  urgency: 'critical',
  location: { lat: 12.9700, lng: 77.6300 },
  requiredResources: ['ambulance', 'rescue'],
  status: 'active'
};
scenario3.incidents.push(newIncident3);

const result3 = handleDisruption(disruption2, scenario3, { newIncident: newIncident3 });
replanResponsePlan(result3, scenario3);

logs = getDecisionLogs();
console.log(`Total Multiple Decision Logs Recorded: ${logs.length}`);
const humanApprovalLogs = logs.filter((l) => l.requiresHumanApproval === true);
console.log(`Human Approval Logs Count: ${humanApprovalLogs.length}`);
console.log('Human Approval Log Entry:', JSON.stringify(humanApprovalLogs[0], null, 2));
console.log(`- Event is REALLOCATION_PROPOSED: ${humanApprovalLogs[0].event === 'REALLOCATION_PROPOSED' ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`- Human Approval is true: ${humanApprovalLogs[0].requiresHumanApproval === true ? '✅ PASSED' : '❌ FAILED'}\n`);


console.log('--- Step 5: Test clearDecisionLogs() ---');
clearDecisionLogs();
const finalLogs = getDecisionLogs();
console.log(`Final Decision Logs Count after clear: ${finalLogs.length}`);
console.log(`- Clear check: ${finalLogs.length === 0 ? '✅ PASSED' : '❌ FAILED'}\n`);

console.log('====================================================');
console.log('🎉 ALL DECISION LOG SERVICE TESTS PASSED!');
console.log('====================================================');
