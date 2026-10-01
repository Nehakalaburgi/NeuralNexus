import { Incident, Resource, Assignment, DisruptionEvent } from '@shared/emergency';
import { ReplanningEngine } from './replanningEngine';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, failureDetails: string = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${failureDetails}`);
    failed++;
  }
}

console.log('====================================================');
console.log('🧪 NEURALNEXUS DYNAMIC REPLANNING ENGINE TEST SUITE');
console.log('====================================================\n');

// -----------------------------------------------------------------
// Test 1: Resource Breakdown with Available Replacement (AMB-01 -> AMB-04)
// -----------------------------------------------------------------
console.log('[Test 1] RESOURCE_UNAVAILABLE - Reassign to Available Resource AMB-04');
{
  const incidents: Incident[] = [
    {
      id: 'INC-001',
      type: 'Road Accident',
      severity: 3,
      urgency: 'medium',
      location: { lat: 12.9784, lng: 77.6408 },
      requiredResources: ['ambulance'],
      status: 'active'
    }
  ];

  const resources: Resource[] = [
    {
      id: 'AMB-01',
      type: 'ambulance',
      status: 'assigned',
      location: { lat: 12.9720, lng: 77.6350 },
      assignedIncidentId: 'INC-001'
    },
    {
      id: 'AMB-04',
      type: 'ambulance',
      status: 'available',
      location: { lat: 12.9500, lng: 77.6000 },
      assignedIncidentId: null
    }
  ];

  const assignments: Assignment[] = [
    {
      incidentId: 'INC-001',
      resourceId: 'AMB-01',
      eta: 8,
      status: 'assigned'
    }
  ];

  const disruption: DisruptionEvent = {
    type: 'RESOURCE_UNAVAILABLE',
    resourceId: 'AMB-01',
    incidentId: 'INC-001',
    timestamp: new Date().toISOString()
  };

  const output = ReplanningEngine.replan(disruption, { incidents, resources, assignments });

  assert(output.result.alternatives.length === 1, 'Generates 1 alternative assignment');
  assert(output.result.alternatives[0].resourceId === 'AMB-04', 'Reassigns to available AMB-04');
  assert(output.updatedResources.find((r) => r.id === 'AMB-01')?.status === 'out_of_service', 'AMB-01 marked out_of_service');
  assert(output.updatedResources.find((r) => r.id === 'AMB-04')?.status === 'assigned', 'AMB-04 marked assigned');
}

// -----------------------------------------------------------------
// Test 2: New High Severity Incident Dispatch
// -----------------------------------------------------------------
console.log('\n[Test 2] NEW_INCIDENT - Dispatch Available Ambulance AMB-04');
{
  const incidents: Incident[] = [
    {
      id: 'INC-003',
      type: 'Medical Emergency',
      severity: 5,
      urgency: 'critical',
      location: { lat: 12.9352, lng: 77.6245 },
      requiredResources: ['ambulance'],
      status: 'active'
    }
  ];

  const resources: Resource[] = [
    {
      id: 'AMB-04',
      type: 'ambulance',
      status: 'available',
      location: { lat: 12.9500, lng: 77.6000 },
      assignedIncidentId: null
    }
  ];

  const assignments: Assignment[] = [];

  const disruption: DisruptionEvent = {
    type: 'NEW_INCIDENT',
    incidentId: 'INC-003',
    timestamp: new Date().toISOString()
  };

  const output = ReplanningEngine.replan(disruption, { incidents, resources, assignments });

  assert(output.result.alternatives.length === 1, 'Generates 1 alternative dispatch assignment');
  assert(output.result.newAssignments[0].resourceId === 'AMB-04', 'Dispatches AMB-04 to INC-003');
  assert(output.updatedIncidents[0].status === 'active', 'Incident INC-003 status is active');
}

// -----------------------------------------------------------------
// Summary
// -----------------------------------------------------------------
console.log('\n====================================================');
console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
