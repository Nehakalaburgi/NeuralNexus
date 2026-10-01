import {
  getInitialScenario,
  getIncidents,
  getResources,
  getAssignments,
  getResponsePlan
} from './emergencyScenario';

console.log('----------------------------------------------------');
console.log('🚑 EMERGENCY SCENARIO SIMULATION DATA VERIFICATION');
console.log('----------------------------------------------------');

const scenario = getInitialScenario();
console.log(`Incidents count: ${scenario.incidents.length}`);
console.log(`Resources count: ${scenario.resources.length}`);
console.log(`Assignments count: ${scenario.assignments.length}`);
console.log(`Response Plan ID: ${scenario.responsePlan.id} (v${scenario.responsePlan.version})`);

console.log('\n📌 INCIDENTS:');
getIncidents().forEach((i) => console.log(`  - [${i.id}] ${i.type} | Sev: ${i.severity} | Urg: ${i.urgency} | Status: ${i.status}`));

console.log('\n📌 RESOURCES:');
getResources().forEach((r) => console.log(`  - [${r.id}] Type: ${r.type} | Status: ${r.status} | AssignedTo: ${r.assignedIncidentId || 'NONE'}`));

console.log('\n📌 ASSIGNMENTS:');
getAssignments().forEach((a) => console.log(`  - ${a.incidentId} ➔ ${a.resourceId} (ETA: ${a.eta}m, Status: ${a.status})`));

console.log('\n📌 RESPONSE PLAN:');
console.log(`  - Plan Version: ${getResponsePlan().version}`);
console.log('----------------------------------------------------');
