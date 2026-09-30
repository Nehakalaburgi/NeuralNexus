import type { Incident, Resource, Assignment, ResponsePlan } from '@neuralnexus/shared';
import type { ScenarioState } from './disruptionService.js';
import {
  getIncidents as getMockIncidents,
  getResources as getMockResources,
  getAssignments as getMockAssignments,
  getResponsePlan as getMockResponsePlan,
  getInitialScenario as getMockInitialScenario
} from '../scenarios/emergencyScenario.js';

/**
 * StateProvider Abstraction Interface
 * Decouples services from data sources (Mock, MongoDB, REST API, etc.)
 */
export interface StateProvider {
  getIncidents(): Incident[];
  getResources(): Resource[];
  getAssignments(): Assignment[];
  getResponsePlan(): ResponsePlan;
  getState(): ScenarioState;
}

/**
 * MockStateProvider
 * In-memory implementation backed by emergencyScenario simulation data.
 */
export class MockStateProvider implements StateProvider {
  getIncidents(): Incident[] {
    return getMockIncidents();
  }

  getResources(): Resource[] {
    return getMockResources();
  }

  getAssignments(): Assignment[] {
    return getMockAssignments();
  }

  getResponsePlan(): ResponsePlan {
    return getMockResponsePlan();
  }

  getState(): ScenarioState {
    return getMockInitialScenario();
  }
}

/**
 * Default global state provider instance (MockStateProvider).
 */
export const defaultStateProvider: StateProvider = new MockStateProvider();
