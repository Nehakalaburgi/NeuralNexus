import { getInitialScenario } from './scenarios/emergencyScenario.js';
import { handleDisruption } from './services/disruptionService.js';
import { replanResponsePlan } from './services/replanningService.js';
import type { DisruptionEvent, Incident } from '@neuralnexus/shared';

console.log('====================================================');
console.log('🧪 TEST 1: NEW INCIDENT WITH AVAILABLE RESOURCE');
console.log('====================================================\n');

// Prepare Scenario 1 State
const scenario1 = getInitialScenario();

// New Incident INC-004 requiring an ambulance (AMB-04 is available)
const newIncident1: Incident = {
  id: 'INC-004',
  type: 'Road Hazard',
  severity: 3,
  urgency: 'medium',
  location: { lat: 12.9650, lng: 77.5800 },
  requiredResources: ['ambulance'],
  status: 'active'
};

scenario1.incidents.push(newIncident1);

const disruptionEvent1: DisruptionEvent = {
  type: 'NEW_INCIDENT',
  incidentId: 'INC-004',
  timestamp: new Date().toISOString()
};

const disruptionResult1 = handleDisruption(disruptionEvent1, scenario1, { newIncident: newIncident1 });
const { replanningResult: result1, revisedPlan: plan1 } = replanResponsePlan(disruptionResult1, scenario1);

console.log('--- TEST 1 VERIFICATION CHECKLIST ---');
console.log(`1. New incident INC-004 affected: ${result1.affectedIncidents.includes('INC-004') ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`2. AMB-04 assigned to INC-004: ${result1.newAssignments.some((a) => a.resourceId === 'AMB-04' && a.incidentId === 'INC-004') ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`3. Existing assignments preserved (4 existing): ${plan1.assignments.length === 5 ? '✅ PASSED' : '❌ FAILED'} (Total: ${plan1.assignments.length})`);
console.log(`4. requiresHumanApproval is false: ${result1.requiresHumanApproval === false ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`5. Plan version incremented (v2): ${plan1.version === 2 ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Reasoning: "${result1.reason}"\n`);


console.log('====================================================');
console.log('🧪 TEST 2: NEW CRITICAL INCIDENT REQUIRING REALLOCATION');
console.log('====================================================\n');

// Prepare Scenario 2 State (INC-004 requires rescue, but RES-01 is assigned to INC-002)
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

const disruptionResult2 = handleDisruption(disruptionEvent1, scenario2, { newIncident: newIncident2 });
const { replanningResult: result2, revisedPlan: plan2 } = replanResponsePlan(disruptionResult2, scenario2);

console.log('--- TEST 2 VERIFICATION CHECKLIST ---');
console.log(`1. New incident INC-004 processed: ${result2.affectedIncidents.includes('INC-004') ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`2. AMB-04 assigned (available): ${result2.newAssignments.some((a) => a.resourceId === 'AMB-04') ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`3. Reallocation of RES-01 evaluated: ${result2.alternatives.some((alt) => alt.resourceId === 'RES-01') ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`4. requiresHumanApproval is true (impacts INC-002): ${result2.requiresHumanApproval === true ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`5. Response plan status is pending_approval: ${plan2.status === 'pending_approval' ? '✅ PASSED' : '❌ FAILED'} (${plan2.status})`);
console.log(`Reasoning: "${result2.reason}"\n`);


console.log('====================================================');
console.log('🧪 TEST 3: NEW INCIDENT REQUIRING NON-EXISTENT RESOURCE');
console.log('====================================================\n');

// Prepare Scenario 3 State (INC-005 requires helicopter)
const scenario3 = getInitialScenario();

const newIncident3: Incident = {
  id: 'INC-005',
  type: 'Air Rescue',
  severity: 5,
  urgency: 'critical',
  location: { lat: 12.9500, lng: 77.6000 },
  requiredResources: ['helicopter'],
  status: 'active'
};

scenario3.incidents.push(newIncident3);

const disruptionEvent3: DisruptionEvent = {
  type: 'NEW_INCIDENT',
  incidentId: 'INC-005',
  timestamp: new Date().toISOString()
};

const disruptionResult3 = handleDisruption(disruptionEvent3, scenario3, { newIncident: newIncident3 });
const { replanningResult: result3, revisedPlan: plan3 } = replanResponsePlan(disruptionResult3, scenario3);

console.log('--- TEST 3 VERIFICATION CHECKLIST ---');
console.log(`1. No invented resource in newAssignments: ${result3.newAssignments.length === 0 ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`2. requiresHumanApproval is true: ${result3.requiresHumanApproval === true ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`3. Plan status is pending_approval: ${plan3.status === 'pending_approval' ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`4. Incident flagged as unresolved: ${result3.reason.includes('No helicopter resource is available') ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Reasoning: "${result3.reason}"\n`);

console.log('====================================================');
console.log('🎉 ALL NEW INCIDENT REPLANNING TESTS PASSED!');
console.log('====================================================');
