import {
  Incident,
  Resource,
  Assignment,
  DecisionLog,
  DisruptionEvent,
  ResponsePlan
} from '@shared/emergency';
import { getInitialScenario } from '../scenarios/emergencyScenario';
import { ReplanningEngine, ReplanningOutput } from '../replanning/replanningEngine';

/**
 * In-Memory Crisis Command State Manager
 * Maintains active incidents, available/assigned resources, active assignments, and decision history.
 */
export class StateManager {
  private incidents: Map<string, Incident> = new Map();
  private resources: Map<string, Resource> = new Map();
  private assignments: Map<string, Assignment> = new Map();
  private responsePlan: ResponsePlan;
  private logs: DecisionLog[] = [];

  constructor() {
    const scenario = getInitialScenario();
    scenario.incidents.forEach((i) => this.incidents.set(i.id, i));
    scenario.resources.forEach((r) => this.resources.set(r.id, r));
    scenario.assignments.forEach((a) => this.assignments.set(`${a.incidentId}-${a.resourceId}`, a));
    this.responsePlan = scenario.responsePlan;
  }

  public getIncidents(): Incident[] {
    return Array.from(this.incidents.values());
  }

  public getIncidentById(id: string): Incident | undefined {
    return this.incidents.get(id);
  }

  public addIncident(incident: Incident): void {
    this.incidents.set(incident.id, incident);
  }

  public getResources(): Resource[] {
    return Array.from(this.resources.values());
  }

  public getResourceById(id: string): Resource | undefined {
    return this.resources.get(id);
  }

  public addResource(resource: Resource): void {
    this.resources.set(resource.id, resource);
  }

  public getAssignments(): Assignment[] {
    return Array.from(this.assignments.values());
  }

  public getResponsePlan(): ResponsePlan {
    return { ...this.responsePlan, assignments: this.getAssignments() };
  }

  public getLogs(): DecisionLog[] {
    return [...this.logs];
  }

  /**
   * Process a Disruption Event through the Replanning Engine and commit state changes
   */
  public handleDisruption(event: DisruptionEvent): ReplanningOutput {
    const context = {
      incidents: this.getIncidents(),
      resources: this.getResources(),
      assignments: this.getAssignments()
    };

    const output = ReplanningEngine.replan(event, context);

    // Commit state changes
    output.updatedIncidents.forEach((inc) => this.incidents.set(inc.id, inc));
    output.updatedResources.forEach((res) => this.resources.set(res.id, res));

    // Update assignments list
    this.assignments.clear();
    output.updatedAssignments.forEach((assign) => {
      this.assignments.set(`${assign.incidentId}-${assign.resourceId}`, assign);
    });

    // Increment response plan version
    this.responsePlan.version += 1;
    this.responsePlan.assignments = this.getAssignments();

    // Record decision logs
    this.logs.push(...output.logs);

    return output;
  }
}

// Global Singleton Instance for backend
export const stateManager = new StateManager();
