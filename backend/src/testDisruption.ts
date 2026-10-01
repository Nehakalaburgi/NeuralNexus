import { DisruptionService } from './services/disruptionService';
import { getInitialScenario } from './scenarios/emergencyScenario';
import { DisruptionEvent } from '@shared/emergency';

console.log('====================================================');
console.log('🔍 TESTING DISRUPTION SERVICE (RESOURCE_UNAVAILABLE)');
console.log('====================================================\n');

// 1. Load the initial emergency scenario
const scenario = getInitialScenario();

// 2. Find and print the initial state of AMB-02
const initialAmb02 = scenario.resources.find((r) => r.id === 'AMB-02');
console.log('📌 INITIAL STATE OF AMB-02:');
if (initialAmb02) {
  console.log(`  - ID: ${initialAmb02.id}`);
  console.log(`  - Type: ${initialAmb02.type}`);
  console.log(`  - Status: ${initialAmb02.status}`);
  console.log(`  - Location: Lat ${initialAmb02.location.lat}, Lng ${initialAmb02.location.lng}`);
  console.log(`  - Assigned Incident ID: ${initialAmb02.assignedIncidentId}`);
} else {
  console.log('  ❌ AMB-02 not found in initial scenario');
}

// 3. Call handleDisruption with RESOURCE_UNAVAILABLE for AMB-02
const disruptionEvent: DisruptionEvent = {
  type: 'RESOURCE_UNAVAILABLE',
  resourceId: 'AMB-02',
  timestamp: new Date().toISOString()
};

console.log('\n🚨 DISRUPTION EVENT TRIGGERED:');
console.log(JSON.stringify(disruptionEvent, null, 2));

console.log('\n⚙️ EXECUTING handleDisruption()...');
const result = DisruptionService.handleDisruption(disruptionEvent, scenario);

// 4. Print the returned disruption result
console.log('\n📋 DISRUPTION ANALYSIS RESULT:');
console.log(JSON.stringify(result, null, 2));

// 5. Explicitly output key verification points
console.log('\n✅ VERIFICATION CHECKLIST:');
console.log(`  1. Resource Found: ${result.affectedResource ? 'YES (' + result.affectedResource.id + ')' : 'NO'}`);
console.log(`  2. Updated Status: ${result.affectedResource?.status === 'out_of_service' ? 'out_of_service (CONFIRMED)' : result.affectedResource?.status}`);
console.log(`  3. Affected Assignment: Resource ${result.affectedAssignments[0]?.resourceId} was assigned to ${result.affectedAssignments[0]?.incidentId}`);
console.log(`  4. Affected Incidents: [ ${result.affectedIncidents.join(', ')} ]`);
console.log(`  5. Replanning Required: ${result.replanningRequired}`);

// 6. Test invalid resource ID (AMB-999) error handling
console.log('\n----------------------------------------------------');
console.log('⚠️ TESTING INVALID RESOURCE HANDLING (AMB-999)');
console.log('----------------------------------------------------');

const invalidEvent: DisruptionEvent = {
  type: 'RESOURCE_UNAVAILABLE',
  resourceId: 'AMB-999',
  timestamp: new Date().toISOString()
};

try {
  console.log('Executing handleDisruption() with resourceId "AMB-999"...');
  DisruptionService.handleDisruption(invalidEvent, scenario);
  console.log('❌ UNEXPECTED: Service did not throw an error');
} catch (error: any) {
  console.log(`✅ HANDLED SAFELY: Service returned clear error: "${error.message}"`);
}

console.log('\n====================================================');
console.log('🎯 DISRUPTION SERVICE TEST COMPLETE');
console.log('====================================================\n');
