import { getInitialScenario } from './scenarios/emergencyScenario.js';
import { handleDisruption } from './services/disruptionService.js';
import type { DisruptionEvent } from '@neuralnexus/shared';

console.log('====================================================');
console.log('🧪 TESTING DISRUPTION SERVICE: RESOURCE_UNAVAILABLE');
console.log('====================================================\n');

// 1. Load initial emergency scenario
const scenario = getInitialScenario();
const initialAmb02 = scenario.resources.find((r) => r.id === 'AMB-02');

console.log('--- Step 1: Initial State of AMB-02 ---');
console.log('Resource AMB-02:', JSON.stringify(initialAmb02, null, 2));
console.log('');

// 2. Prepare disruption event for AMB-02
const disruptionEvent: DisruptionEvent = {
  type: 'RESOURCE_UNAVAILABLE',
  resourceId: 'AMB-02',
  timestamp: new Date().toISOString()
};

console.log('--- Step 2: Triggering Disruption Event ---');
console.log('Event:', JSON.stringify(disruptionEvent, null, 2));

// 3. Call handleDisruption
const result = handleDisruption(disruptionEvent, scenario);

console.log('\n--- Step 3: Disruption Result Output ---');
console.log(JSON.stringify(result, null, 2));

console.log('\n--- Step 4: Verification Summary ---');
console.log(`- Resource Found: ${result.affectedResource ? 'YES (' + result.affectedResource.id + ')' : 'NO'}`);
console.log(`- Resource Status: ${result.affectedResource?.status}`);
console.log(`- Affected Assignments Count: ${result.affectedAssignments.length}`);
if (result.affectedAssignments.length > 0) {
  console.log(`  - Assignment: Resource ${result.affectedAssignments[0].resourceId} -> Incident ${result.affectedAssignments[0].incidentId}`);
}
console.log(`- Affected Incidents: ${JSON.stringify(result.affectedIncidents)}`);
console.log(`- Replanning Required: ${result.replanningRequired}`);

console.log('\n====================================================');
console.log('🧪 TESTING ERROR HANDLING: INVALID RESOURCE (AMB-999)');
console.log('====================================================\n');

const invalidDisruption: DisruptionEvent = {
  type: 'RESOURCE_UNAVAILABLE',
  resourceId: 'AMB-999',
  timestamp: new Date().toISOString()
};

try {
  handleDisruption(invalidDisruption, scenario);
  console.log('❌ Unexpected: Should have thrown an error for invalid resource.');
} catch (error: any) {
  console.log('✅ Error handled safely:');
  console.log(`  Message: "${error.message}"`);
}

console.log('\n🎉 Test completed successfully!');
