import { DisruptionService } from './services/disruptionService';
import { ReplanningService } from './services/replanningService';
import { getInitialScenario } from './scenarios/emergencyScenario';

console.log('====================================================');
console.log('🔄 TESTING DYNAMIC REPLANNING SERVICE');
console.log('====================================================\n');

// -----------------------------------------------------------------
// Test Case 1: Standard Replanning (AMB-02 unavailable -> INC-002 affected -> AMB-04 selected)
// -----------------------------------------------------------------
console.log('----------------------------------------------------');
console.log('📌 TEST CASE 1: Standard Reassignment (AMB-02 Unavailable)');
console.log('----------------------------------------------------');

const scenario1 = getInitialScenario();

// 1. Trigger disruption analysis for AMB-02 unavailable
const disruptionResult1 = DisruptionService.handleDisruption(
  {
    type: 'RESOURCE_UNAVAILABLE',
    resourceId: 'AMB-02',
    timestamp: new Date().toISOString()
  },
  scenario1
);

// 2. Execute replanning service
const { replanningResult: result1, revisedResponsePlan: plan1 } = ReplanningService.replanResponsePlan(
  disruptionResult1,
  scenario1
);

console.log('\n📜 1. OLD ASSIGNMENT:');
console.log(JSON.stringify(result1.oldAssignments, null, 2));

console.log('\n💡 2. GENERATED ALTERNATIVES:');
console.log(JSON.stringify(result1.alternatives, null, 2));

console.log('\n✨ 3. SELECTED NEW ASSIGNMENT:');
console.log(JSON.stringify(result1.newAssignments, null, 2));

console.log(`\n📋 4. REVISED PLAN VERSION: ${plan1.version} (Status: ${plan1.status})`);
console.log(`   Preserved Unaffected Assignments: ${plan1.assignments.map(a => `${a.incidentId}->${a.resourceId}`).join(', ')}`);

console.log(`\n💬 5. REASON: "${result1.reason}"`);

console.log(`\n👤 6. HUMAN APPROVAL STATUS: ${result1.requiresHumanApproval ? 'REQUIRED' : 'NOT REQUIRED (Automated Success)'}`);

// -----------------------------------------------------------------
// Test Case 2: No Alternative Ambulance Available
// -----------------------------------------------------------------
console.log('\n----------------------------------------------------');
console.log('📌 TEST CASE 2: No Alternative Resource Available');
console.log('----------------------------------------------------');

const scenario2 = getInitialScenario();
// Mark AMB-04 as out_of_service so zero available ambulances remain
const amb04 = scenario2.resources.find((r) => r.id === 'AMB-04')!;
amb04.status = 'out_of_service';

const disruptionResult2 = DisruptionService.handleDisruption(
  {
    type: 'RESOURCE_UNAVAILABLE',
    resourceId: 'AMB-02',
    timestamp: new Date().toISOString()
  },
  scenario2
);

const { replanningResult: result2, revisedResponsePlan: plan2 } = ReplanningService.replanResponsePlan(
  disruptionResult2,
  scenario2
);

console.log('\n💡 ALTERNATIVES GENERATED:');
console.log(JSON.stringify(result2.alternatives, null, 2));

console.log('\n✨ NEW ASSIGNMENTS:');
console.log(JSON.stringify(result2.newAssignments, null, 2));

console.log(`\n💬 REASON: "${result2.reason}"`);

console.log(`\n👤 HUMAN APPROVAL STATUS: ${result2.requiresHumanApproval ? 'REQUIRED (Flagged for Dispatcher)' : 'NOT REQUIRED'}`);

console.log('\n====================================================');
console.log('🎯 DYNAMIC REPLANNING SERVICE TEST COMPLETE');
console.log('====================================================\n');
