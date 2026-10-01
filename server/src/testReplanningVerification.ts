import { DisruptionService } from './services/disruptionService';
import { ReplanningService } from './services/replanningService';
import { getInitialScenario } from './scenarios/emergencyScenario';

console.log('====================================================');
console.log('🔍 DYNAMIC REPLANNING SERVICE FULL VERIFICATION');
console.log('====================================================\n');

// -----------------------------------------------------------------
// TEST 1: AMB-02 Unavailable (AMB-04 Available)
// -----------------------------------------------------------------
console.log('----------------------------------------------------');
console.log('🧪 TEST 1: AMB-02 Breakdown with Available AMB-04');
console.log('----------------------------------------------------');

const scenario1 = getInitialScenario();

// Execute disruption analysis
const disruptionAnalysis1 = DisruptionService.handleDisruption(
  {
    type: 'RESOURCE_UNAVAILABLE',
    resourceId: 'AMB-02',
    timestamp: new Date().toISOString()
  },
  scenario1
);

// Execute dynamic replanning
const { replanningResult: result1, revisedResponsePlan: plan1 } =
  ReplanningService.replanResponsePlan(disruptionAnalysis1, scenario1);

console.log('\n📊 TEST 1 VERIFICATION CHECKLIST:');
console.log(`  1. AMB-02 is out_of_service: ${disruptionAnalysis1.affectedResource?.status === 'out_of_service' ? 'CONFIRMED' : 'FAILED'}`);
console.log(`  2. INC-002 identified as affected: ${result1.affectedIncidents.includes('INC-002') ? 'CONFIRMED' : 'FAILED'}`);
console.log(`  3. AMB-04 identified as compatible available ambulance: ${result1.alternatives.some((a) => a.resourceId === 'AMB-04') ? 'CONFIRMED' : 'FAILED'}`);
console.log(`  4. AMB-04 selected as replacement: ${result1.newAssignments.some((a) => a.resourceId === 'AMB-04') ? 'CONFIRMED' : 'FAILED'}`);
console.log(`  5. RES-01 remains assigned to INC-002: ${plan1.assignments.some((a) => a.incidentId === 'INC-002' && a.resourceId === 'RES-01') ? 'CONFIRMED' : 'FAILED'}`);
console.log(`  6. Old AMB-02 assignment preserved in oldAssignments: ${result1.oldAssignments.some((a) => a.resourceId === 'AMB-02') ? 'CONFIRMED' : 'FAILED'}`);
console.log(`  7. New assignment is INC-002 -> AMB-04: ${result1.newAssignments.some((a) => a.incidentId === 'INC-002' && a.resourceId === 'AMB-04') ? 'CONFIRMED' : 'FAILED'}`);
console.log(`  8. Response plan version changed from 1 to ${plan1.version}: ${plan1.version === 2 ? 'CONFIRMED' : 'FAILED'}`);
console.log(`  9. requiresHumanApproval is false: ${result1.requiresHumanApproval === false ? 'CONFIRMED (false)' : 'FAILED'}`);
console.log(` 10. Revised plan returned successfully: ${plan1 ? 'CONFIRMED' : 'FAILED'}`);

console.log('\n📜 OLD ASSIGNMENTS:', JSON.stringify(result1.oldAssignments, null, 2));
console.log('💡 ALTERNATIVES:', JSON.stringify(result1.alternatives, null, 2));
console.log('✨ NEW ASSIGNMENTS:', JSON.stringify(result1.newAssignments, null, 2));
console.log('📋 REVISED PLAN:', JSON.stringify(plan1, null, 2));
console.log('💬 REASON:', result1.reason);
console.log('👤 HUMAN APPROVAL:', result1.requiresHumanApproval);

// -----------------------------------------------------------------
// TEST 2: No Replacement Ambulance Available
// -----------------------------------------------------------------
console.log('\n----------------------------------------------------');
console.log('🧪 TEST 2: All Standby Ambulances Unavailable (No Replacement)');
console.log('----------------------------------------------------');

const scenario2 = getInitialScenario();
// Mark standby ambulance AMB-04 out_of_service so zero candidate ambulances exist
const amb04 = scenario2.resources.find((r) => r.id === 'AMB-04')!;
amb04.status = 'out_of_service';

const disruptionAnalysis2 = DisruptionService.handleDisruption(
  {
    type: 'RESOURCE_UNAVAILABLE',
    resourceId: 'AMB-02',
    timestamp: new Date().toISOString()
  },
  scenario2
);

const { replanningResult: result2, revisedResponsePlan: plan2 } =
  ReplanningService.replanResponsePlan(disruptionAnalysis2, scenario2);

console.log('\n📊 TEST 2 VERIFICATION CHECKLIST:');
console.log(`  1. No replacement resource invented: ${result2.newAssignments.length === 0 ? 'CONFIRMED (0 new assignments)' : 'FAILED'}`);
console.log(`  2. No invalid assignment created: ${result2.alternatives.length === 0 ? 'CONFIRMED (0 alternatives)' : 'FAILED'}`);
console.log(`  3. requiresHumanApproval is true: ${result2.requiresHumanApproval === true ? 'CONFIRMED (true)' : 'FAILED'}`);
console.log(`  4. Response plan status is pending_approval: ${plan2.status === 'pending_approval' ? 'CONFIRMED (pending_approval)' : 'FAILED (' + plan2.status + ')'}`);
console.log(`  5. Affected incident clearly identified: [ ${result2.affectedIncidents.join(', ')} ]`);

console.log('\n💬 REASON:', result2.reason);
console.log('📋 REVISED PLAN STATUS:', plan2.status);
console.log('👤 HUMAN APPROVAL:', result2.requiresHumanApproval);

console.log('\n====================================================');
console.log('🎯 FULL VERIFICATION COMPLETE');
console.log('====================================================\n');
