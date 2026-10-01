import { DisruptionEvent } from '@shared/emergency';
import { getInitialScenario } from '../scenarios/emergencyScenario';
import { ReplanningEngine } from './replanningEngine';

console.log('----------------------------------------------------');
console.log('🤖 NEURALNEXUS DYNAMIC REPLANNING DEMO ENGINE');
console.log('----------------------------------------------------');

// 1. Initial State from Emergency Scenario
const scenario = getInitialScenario();

console.log('\n📌 [INITIAL SCENARIO STATE]');
console.log('Incidents:', scenario.incidents.map((i) => `${i.id} (${i.type} - Sev ${i.severity}, Urg ${i.urgency})`));
console.log('Resources:', scenario.resources.map((r) => `${r.id} (${r.type} - Status: ${r.status})`));
console.log('Assignments:', scenario.assignments.map((a) => `${a.incidentId} ➔ ${a.resourceId} (ETA: ${a.eta}m)`));

// 2. Disruption Event: AMB-01 suffers mechanical breakdown while assigned to INC-001
const disruption: DisruptionEvent = {
  type: 'RESOURCE_UNAVAILABLE',
  resourceId: 'AMB-01',
  incidentId: 'INC-001',
  timestamp: new Date().toISOString()
};

console.log('\n🚨 [DISRUPTION EVENT TRIGGERED]');
console.log(`Type: ${disruption.type}`);
console.log(`Resource Breakdown: ${disruption.resourceId} (Assigned to ${disruption.incidentId})`);

// 3. Run Replanning Engine
console.log('\n⚙️ [EXECUTING DYNAMIC REPLANNING ENGINE...]');
const output = ReplanningEngine.replan(disruption, {
  incidents: scenario.incidents,
  resources: scenario.resources,
  assignments: scenario.assignments
});

console.log('\n✅ [REPLANNING RESULT]');
console.log(JSON.stringify(output.result, null, 2));

console.log('\n📝 [DECISION LOGS]');
output.logs.forEach((log, index) => {
  console.log(`\n[Log #${index + 1}] Event: ${log.event} | Action: ${log.action}`);
  console.log(`  Reason: ${log.reason}`);
  console.log(`  Requires Human Approval: ${log.requiresHumanApproval}`);
});

console.log('\n🔄 [UPDATED RESOURCE STATUSES]');
output.updatedResources.forEach((r) => {
  console.log(`  ${r.id} (${r.type}): Status=${r.status} | AssignedTo=${r.assignedIncidentId || 'NONE'}`);
});
console.log('----------------------------------------------------\n');
