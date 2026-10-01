import { Incident, DisruptionEvent } from '@shared/emergency';
import { DisruptionService } from './services/disruptionService';
import { ReplanningService } from './services/replanningService';
import { getInitialScenario } from './scenarios/emergencyScenario';

console.log('====================================================');
console.log('🔥 TESTING NEW INCIDENT DYNAMIC REPLANNING (STEP 6)');
console.log('====================================================\n');

// -----------------------------------------------------------------
// TEST 1: New Critical Incident with Suitable Available Resource (AMB-04)
// -----------------------------------------------------------------
console.log('----------------------------------------------------');
console.log('📌 TEST 1: New Incident with Available Compatible Resource');
console.log('----------------------------------------------------');

const scenario1 = getInitialScenario();

const newIncident1: Incident = {
  id: 'INC-004',
  type: 'Building Fire',
  severity: 5,
  urgency: 'critical',
  location: { lat: 12.9750, lng: 77.6094 },
  requiredResources: ['ambulance'],
  status: 'active'
};

// Add new incident to scenario state
scenario1.incidents.push(newIncident1);

const disruptionEvent1: DisruptionEvent = {
  type: 'NEW_INCIDENT',
  incidentId: 'INC-004',
  timestamp: new Date().toISOString()
};

const analysis1 = DisruptionService.handleDisruption(disruptionEvent1, scenario1);
const { replanningResult: result1, revisedResponsePlan: plan1 } =
  ReplanningService.replanResponsePlan(analysis1, scenario1);

console.log('\n📊 TEST 1 VERIFICATION:');
console.log(`  - Affected Incident: ${result1.affectedIncidents.join(', ')}`);
console.log(`  - New Assignment: ${result1.newAssignments.map(a => `${a.incidentId} -> ${a.resourceId}`).join(', ')}`);
console.log(`  - Existing Assignments Preserved: ${plan1.assignments.length === 5 ? 'YES (5 total assignments)' : 'NO'}`);
console.log(`  - Plan Version: ${plan1.version} (Status: ${plan1.status})`);
console.log(`  - Reason: "${result1.reason}"`);
console.log(`  - Human Approval Required: ${result1.requiresHumanApproval ? 'YES' : 'NO (Automated Success)'}`);

console.log('\n✨ NEW ASSIGNMENTS:', JSON.stringify(result1.newAssignments, null, 2));
console.log('📋 REVISED RESPONSE PLAN:', JSON.stringify(plan1, null, 2));

// -----------------------------------------------------------------
// TEST 2: New Critical Incident with Missing Resource (Reallocation Impact)
// -----------------------------------------------------------------
console.log('\n----------------------------------------------------');
console.log('📌 TEST 2: New Incident Requiring Unavailable Resource (RES-01 Assigned)');
console.log('----------------------------------------------------');

const scenario2 = getInitialScenario();

const newIncident2: Incident = {
  id: 'INC-004',
  type: 'Building Fire',
  severity: 5,
  urgency: 'critical',
  location: { lat: 12.9750, lng: 77.6094 },
  requiredResources: ['ambulance', 'rescue'],
  status: 'active'
};

scenario2.incidents.push(newIncident2);

const disruptionEvent2: DisruptionEvent = {
  type: 'NEW_INCIDENT',
  incidentId: 'INC-004',
  timestamp: new Date().toISOString()
};

const analysis2 = DisruptionService.handleDisruption(disruptionEvent2, scenario2);
const { replanningResult: result2, revisedResponsePlan: plan2 } =
  ReplanningService.replanResponsePlan(analysis2, scenario2);

console.log('\n📊 TEST 2 VERIFICATION:');
console.log(`  - Affected Incident: ${result2.affectedIncidents.join(', ')}`);
console.log(`  - Alternatives Generated: ${result2.alternatives.map(a => `${a.resourceId} (Impact: ${a.impact})`).join(', ')}`);
console.log(`  - Plan Status: ${plan2.status}`);
console.log(`  - Reason: "${result2.reason}"`);
console.log(`  - Human Approval Required: ${result2.requiresHumanApproval ? 'YES (CONFIRMED)' : 'NO'}`);

console.log('\n💡 ALTERNATIVES:', JSON.stringify(result2.alternatives, null, 2));
console.log('📋 REVISED RESPONSE PLAN STATUS:', plan2.status);
console.log('👤 HUMAN APPROVAL STATUS:', result2.requiresHumanApproval);

// -----------------------------------------------------------------
// TEST 3: New Incident Requiring Non-existent Resource Type ('hazmat')
// -----------------------------------------------------------------
console.log('\n----------------------------------------------------');
console.log('📌 TEST 3: New Incident Requiring Non-existent Resource Type');
console.log('----------------------------------------------------');

const scenario3 = getInitialScenario();

const newIncident3: Incident = {
  id: 'INC-005',
  type: 'Chemical Leak',
  severity: 4,
  urgency: 'high',
  location: { lat: 12.9850, lng: 77.5750 },
  requiredResources: ['hazmat'],
  status: 'active'
};

scenario3.incidents.push(newIncident3);

const disruptionEvent3: DisruptionEvent = {
  type: 'NEW_INCIDENT',
  incidentId: 'INC-005',
  timestamp: new Date().toISOString()
};

const analysis3 = DisruptionService.handleDisruption(disruptionEvent3, scenario3);
const { replanningResult: result3, revisedResponsePlan: plan3 } =
  ReplanningService.replanResponsePlan(analysis3, scenario3);

console.log('\n📊 TEST 3 VERIFICATION:');
console.log(`  - Fake Resource Invented: ${result3.newAssignments.some(a => a.resourceId.includes('hazmat')) ? 'YES (FAIL)' : 'NO (CONFIRMED PASS)'}`);
console.log(`  - Incident Flagged for Human Attention: ${result3.requiresHumanApproval ? 'YES (CONFIRMED PASS)' : 'NO'}`);
console.log(`  - Plan Status: ${plan3.status}`);
console.log(`  - Reason: "${result3.reason}"`);

console.log('\n====================================================');
console.log('🎯 STEP 6 NEW INCIDENT REPLANNING TEST COMPLETE');
console.log('====================================================\n');
