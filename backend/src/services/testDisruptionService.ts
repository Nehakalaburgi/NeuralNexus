import { DisruptionService } from './disruptionService';
import { getInitialScenario } from '../scenarios/emergencyScenario';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, failureMessage: string = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${failureMessage}`);
    failed++;
  }
}

console.log('====================================================');
console.log('🧪 DISRUPTION SERVICE UNIT & INTEGRATION TEST SUITE');
console.log('====================================================\n');

// -----------------------------------------------------------------
// Test 1: RESOURCE_UNAVAILABLE for AMB-02
// -----------------------------------------------------------------
console.log('[Test 1] RESOURCE_UNAVAILABLE for AMB-02');
{
  const scenario = getInitialScenario();
  const timestamp = new Date().toISOString();

  const result = DisruptionService.handleDisruption(
    {
      type: 'RESOURCE_UNAVAILABLE',
      resourceId: 'AMB-02',
      timestamp
    },
    scenario
  );

  assert(result.affectedResource?.id === 'AMB-02', 'Identifies affected resource AMB-02');
  assert(result.affectedResource?.status === 'out_of_service', 'Sets status to out_of_service');
  assert(result.affectedAssignments.length === 1, 'Finds 1 affected assignment (INC-002 -> AMB-02)');
  assert(result.affectedAssignments[0].incidentId === 'INC-002', 'Affected assignment belongs to INC-002');
  assert(result.affectedIncidents.includes('INC-002'), 'Identifies INC-002 in affectedIncidents array');
  assert(result.replanningRequired === true, 'Marks replanningRequired as true');
}

// -----------------------------------------------------------------
// Test 2: NEW_INCIDENT for INC-003
// -----------------------------------------------------------------
console.log('\n[Test 2] NEW_INCIDENT for INC-003');
{
  const scenario = getInitialScenario();
  const timestamp = new Date().toISOString();

  const result = DisruptionService.handleDisruption(
    {
      type: 'NEW_INCIDENT',
      incidentId: 'INC-003',
      timestamp
    },
    scenario
  );

  assert(result.affectedIncidents.length === 1, 'Identifies 1 affected incident');
  assert(result.affectedIncidents[0] === 'INC-003', 'Affected incident is INC-003');
  assert(result.replanningRequired === true, 'Marks replanningRequired as true');
}

// -----------------------------------------------------------------
// Test 3: Error Handling - Non-existent Resource
// -----------------------------------------------------------------
console.log('\n[Test 3] Error Handling - Non-existent Resource');
{
  const scenario = getInitialScenario();
  let caught = false;
  try {
    DisruptionService.handleDisruption(
      {
        type: 'RESOURCE_UNAVAILABLE',
        resourceId: 'AMB-999',
        timestamp: new Date().toISOString()
      },
      scenario
    );
  } catch (err: any) {
    caught = true;
    assert(err.message.includes('AMB-999'), 'Throws descriptive error for missing resource');
  }
  assert(caught, 'Throws error when resource does not exist');
}

// -----------------------------------------------------------------
// Test 4: Error Handling - Resource Already Out of Service
// -----------------------------------------------------------------
console.log('\n[Test 4] Error Handling - Resource Already Out of Service');
{
  const scenario = getInitialScenario();
  const amb01 = scenario.resources.find((r) => r.id === 'AMB-01')!;
  amb01.status = 'out_of_service';

  let caught = false;
  try {
    DisruptionService.handleDisruption(
      {
        type: 'RESOURCE_UNAVAILABLE',
        resourceId: 'AMB-01',
        timestamp: new Date().toISOString()
      },
      scenario
    );
  } catch (err: any) {
    caught = true;
    assert(err.message.includes('already out_of_service'), 'Throws error for already out_of_service resource');
  }
  assert(caught, 'Throws error when resource is already out_of_service');
}

// -----------------------------------------------------------------
// Test 5: Error Handling - Non-existent Incident
// -----------------------------------------------------------------
console.log('\n[Test 5] Error Handling - Non-existent Incident');
{
  const scenario = getInitialScenario();
  let caught = false;
  try {
    DisruptionService.handleDisruption(
      {
        type: 'NEW_INCIDENT',
        incidentId: 'INC-999',
        timestamp: new Date().toISOString()
      },
      scenario
    );
  } catch (err: any) {
    caught = true;
    assert(err.message.includes('INC-999'), 'Throws descriptive error for missing incident');
  }
  assert(caught, 'Throws error when incident does not exist');
}

// -----------------------------------------------------------------
// Test 6: Error Handling - Missing Required Fields
// -----------------------------------------------------------------
console.log('\n[Test 6] Error Handling - Missing Required Fields');
{
  const scenario = getInitialScenario();
  let caught = false;
  try {
    DisruptionService.handleDisruption(
      {
        type: 'RESOURCE_UNAVAILABLE',
        timestamp: new Date().toISOString()
      } as any,
      scenario
    );
  } catch (err: any) {
    caught = true;
    assert(err.message.includes('resourceId'), 'Throws error for missing resourceId');
  }
  assert(caught, 'Throws error when resourceId is missing');
}

console.log('\n====================================================');
console.log(`📊 SUMMARY: ${passed} PASSED | ${failed} FAILED`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
