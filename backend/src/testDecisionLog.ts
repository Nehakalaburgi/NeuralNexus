import { Incident, DisruptionEvent } from '@shared/emergency';
import { DisruptionService } from './services/disruptionService';
import { ReplanningService } from './services/replanningService';
import { DecisionLogService } from './services/decisionLogService';
import { getInitialScenario } from './scenarios/emergencyScenario';

console.log('====================================================');
console.log('📝 TESTING DECISION LOG SERVICE (STEP 7)');
console.log('====================================================\n');

// Clear any previous logs
DecisionLogService.clearDecisionLogs();

// -----------------------------------------------------------------
// TEST 1: RESOURCE_UNAVAILABLE Decision Log
// -----------------------------------------------------------------
console.log('----------------------------------------------------');
console.log('📌 TEST 1: RESOURCE_UNAVAILABLE Logging');
console.log('----------------------------------------------------');

const scenario1 = getInitialScenario();

const event1: DisruptionEvent = {
  type: 'RESOURCE_UNAVAILABLE',
  resourceId: 'AMB-02',
  timestamp: new Date().toISOString()
};

const analysis1 = DisruptionService.handleDisruption(event1, scenario1);
ReplanningService.replanResponsePlan(analysis1, scenario1);

const logs1 = DecisionLogService.getDecisionLogs();
console.log(`Current Log Count: ${logs1.length}`);
console.log('Latest Decision Log:');
console.log(JSON.stringify(logs1[logs1.length - 1], null, 2));

// -----------------------------------------------------------------
// TEST 2: NEW_INCIDENT Decision Log (Automated Success)
// -----------------------------------------------------------------
console.log('\n----------------------------------------------------');
console.log('📌 TEST 2: NEW_INCIDENT Logging (Automated Success)');
console.log('----------------------------------------------------');

const scenario2 = getInitialScenario();

const newIncident1: Incident = {
  id: 'INC-004',
  type: 'Building Fire',
  severity: 5,
  urgency: 'critical',
  location: { lat: 12.9750, lng: 77.6094 },
  requiredResources: ['ambulance'],
  status: 'active'
};
scenario2.incidents.push(newIncident1);

const event2: DisruptionEvent = {
  type: 'NEW_INCIDENT',
  incidentId: 'INC-004',
  timestamp: new Date().toISOString()
};

const analysis2 = DisruptionService.handleDisruption(event2, scenario2);
ReplanningService.replanResponsePlan(analysis2, scenario2);

const logs2 = DecisionLogService.getDecisionLogs();
console.log(`Current Log Count: ${logs2.length}`);
console.log('Latest Decision Log:');
console.log(JSON.stringify(logs2[logs2.length - 1], null, 2));

// -----------------------------------------------------------------
// TEST 3: Human Approval Decision Log Scenario
// -----------------------------------------------------------------
console.log('\n----------------------------------------------------');
console.log('📌 TEST 3: Human Approval Scenario Logging');
console.log('----------------------------------------------------');

const scenario3 = getInitialScenario();

const newIncident2: Incident = {
  id: 'INC-004',
  type: 'Building Fire',
  severity: 5,
  urgency: 'critical',
  location: { lat: 12.9750, lng: 77.6094 },
  requiredResources: ['ambulance', 'rescue'],
  status: 'active'
};
scenario3.incidents.push(newIncident2);

const event3: DisruptionEvent = {
  type: 'NEW_INCIDENT',
  incidentId: 'INC-004',
  timestamp: new Date().toISOString()
};

const analysis3 = DisruptionService.handleDisruption(event3, scenario3);
ReplanningService.replanResponsePlan(analysis3, scenario3);

const logs3 = DecisionLogService.getDecisionLogs();
console.log(`Current Log Count: ${logs3.length}`);
console.log('Latest Decision Log:');
console.log(JSON.stringify(logs3[logs3.length - 1], null, 2));

// -----------------------------------------------------------------
// TEST 4 & 5: getDecisionLogs() Verification across multiple events
// -----------------------------------------------------------------
console.log('\n----------------------------------------------------');
console.log('📌 TEST 4 & 5: getDecisionLogs() Complete Accumulated History');
console.log('----------------------------------------------------');

const allLogs = DecisionLogService.getDecisionLogs();
console.log(`Total Accumulated Decision Logs: ${allLogs.length}`);
allLogs.forEach((log, index) => {
  console.log(`\n[Log #${index + 1}] Event: ${log.event} | Action: ${log.action}`);
  console.log(`  Affected Incident: ${log.affectedIncident || 'N/A'} | Resource: ${log.resourceId || 'N/A'}`);
  console.log(`  Reason: "${log.reason}"`);
  console.log(`  Requires Human Approval: ${log.requiresHumanApproval}`);
});

// -----------------------------------------------------------------
// TEST 6: clearDecisionLogs() Verification
// -----------------------------------------------------------------
console.log('\n----------------------------------------------------');
console.log('📌 TEST 6: clearDecisionLogs() Verification');
console.log('----------------------------------------------------');

DecisionLogService.clearDecisionLogs();
const clearedLogs = DecisionLogService.getDecisionLogs();
console.log(`Decision Log Count After clearDecisionLogs(): ${clearedLogs.length}`);

console.log('\n====================================================');
console.log('🎯 DECISION LOG SERVICE TEST COMPLETE');
console.log('====================================================\n');
