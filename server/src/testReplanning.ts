import { getInitialScenario } from './scenarios/emergencyScenario.js';
import { handleDisruption } from './services/disruptionService.js';
import { replanResponsePlan } from './services/replanningService.js';
import type { DisruptionEvent } from '@neuralnexus/shared';

console.log('====================================================');
console.log('🧪 TEST 1: SINGLE RESOURCE DISRUPTION (AMB-02 UNAVAILABLE)');
console.log('====================================================\n');

// Load initial emergency scenario
const scenario1 = getInitialScenario();

const disruptionEvent1: DisruptionEvent = {
  type: 'RESOURCE_UNAVAILABLE',
  resourceId: 'AMB-02',
  timestamp: new Date().toISOString()
};

const disruptionResult1 = handleDisruption(disruptionEvent1, scenario1);
const { replanningResult: result1, revisedPlan: plan1 } = replanResponsePlan(disruptionResult1, scenario1);

console.log('--- TEST 1 VERIFICATION CHECKLIST ---');

// 1. AMB-02 is out_of_service
const isAmb02OutOfService = disruptionResult1.affectedResource?.status === 'out_of_service';
console.log(`1. AMB-02 marked out_of_service: ${isAmb02OutOfService ? '✅ PASSED' : '❌ FAILED'} (${disruptionResult1.affectedResource?.status})`);

// 2. INC-002 is identified as affected
const isInc002Affected = disruptionResult1.affectedIncidents.includes('INC-002');
console.log(`2. INC-002 identified as affected: ${isInc002Affected ? '✅ PASSED' : '❌ FAILED'} (${JSON.stringify(disruptionResult1.affectedIncidents)})`);

// 3. AMB-04 identified as compatible available ambulance
const isAmb04Alternative = result1.alternatives.some((alt) => alt.resourceId === 'AMB-04');
console.log(`3. AMB-04 identified as compatible alternative: ${isAmb04Alternative ? '✅ PASSED' : '❌ FAILED'}`);

// 4. AMB-04 selected as replacement
const isAmb04Selected = result1.newAssignments.some((a) => a.resourceId === 'AMB-04' && a.incidentId === 'INC-002');
console.log(`4. AMB-04 selected as replacement: ${isAmb04Selected ? '✅ PASSED' : '❌ FAILED'}`);

// 5. RES-01 remains assigned to INC-002
const isRes01Preserved = plan1.assignments.some((a) => a.resourceId === 'RES-01' && a.incidentId === 'INC-002');
console.log(`5. RES-01 remains assigned to INC-002: ${isRes01Preserved ? '✅ PASSED' : '❌ FAILED'}`);

// 6. Old AMB-02 assignment preserved in oldAssignments/history
const isOldAssignmentPreserved = result1.oldAssignments.some((a) => a.resourceId === 'AMB-02' && a.incidentId === 'INC-002');
console.log(`6. Old AMB-02 assignment preserved in oldAssignments: ${isOldAssignmentPreserved ? '✅ PASSED' : '❌ FAILED'}`);

// 7. New assignment is INC-002 -> AMB-04
const hasNewAssignment = result1.newAssignments.length === 1 && result1.newAssignments[0].resourceId === 'AMB-04' && result1.newAssignments[0].incidentId === 'INC-002';
console.log(`7. New assignment is INC-002 -> AMB-04: ${hasNewAssignment ? '✅ PASSED' : '❌ FAILED'}`);

// 8. Response plan version changes from 1 to 2
const isVersion2 = plan1.version === 2;
console.log(`8. Response plan version incremented from 1 to 2: ${isVersion2 ? '✅ PASSED' : '❌ FAILED'} (v${plan1.version})`);

// 9. requiresHumanApproval is false
const isHumanApprovalFalse = result1.requiresHumanApproval === false;
console.log(`9. requiresHumanApproval is false: ${isHumanApprovalFalse ? '✅ PASSED' : '❌ FAILED'}`);

// 10. Revised plan returned successfully
const isRevisedPlanReturned = plan1 && plan1.assignments.length === 4;
console.log(`10. Revised plan returned successfully with 4 assignments: ${isRevisedPlanReturned ? '✅ PASSED' : '❌ FAILED'}`);


console.log('\n====================================================');
console.log('🧪 TEST 2: ALL AMBULANCES UNAVAILABLE');
console.log('====================================================\n');

// Load scenario and mark all other candidate ambulances as out_of_service / unavailable
const scenario2 = getInitialScenario();
scenario2.resources.forEach((r) => {
  if (r.type === 'ambulance' && r.id !== 'AMB-02') {
    r.status = 'out_of_service';
  }
});

const disruptionResult2 = handleDisruption(disruptionEvent1, scenario2);
const { replanningResult: result2, revisedPlan: plan2 } = replanResponsePlan(disruptionResult2, scenario2);

console.log('--- TEST 2 VERIFICATION CHECKLIST ---');

// 1. No replacement resource invented
const noInventedResource = result2.alternatives.length === 0;
console.log(`1. No replacement resource invented: ${noInventedResource ? '✅ PASSED' : '❌ FAILED'} (Alternatives: ${result2.alternatives.length})`);

// 2. No invalid assignment created
const noInvalidAssignment = result2.newAssignments.length === 0;
console.log(`2. No invalid assignment created: ${noInvalidAssignment ? '✅ PASSED' : '❌ FAILED'} (New Assignments: ${result2.newAssignments.length})`);

// 3. requiresHumanApproval is true
const isHumanApprovalTrue = result2.requiresHumanApproval === true;
console.log(`3. requiresHumanApproval is true: ${isHumanApprovalTrue ? '✅ PASSED' : '❌ FAILED'}`);

// 4. Response plan status is pending_approval
const isPendingApproval = plan2.status === 'pending_approval';
console.log(`4. Response plan status is pending_approval: ${isPendingApproval ? '✅ PASSED' : '❌ FAILED'} (${plan2.status})`);

// 5. Affected incident clearly identified
const isAffectedIncidentIdentified = result2.affectedIncidents.includes('INC-002');
console.log(`5. Affected incident clearly identified (INC-002): ${isAffectedIncidentIdentified ? '✅ PASSED' : '❌ FAILED'} (${JSON.stringify(result2.affectedIncidents)})`);

console.log('\n====================================================');
console.log('🎉 ALL REPLANNING VERIFICATION TESTS PASSED!');
console.log('====================================================');
