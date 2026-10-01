import { DecisionLog } from '@shared/emergency';

/**
 * In-Memory Decision Log Storage
 */
const decisionLogsStore: DecisionLog[] = [];

/**
 * DecisionLogService for NeuralNexus Dynamic Replanning & Integration Module
 * Records, retrieves, and manages decision audit history for replanning actions.
 */
export class DecisionLogService {
  /**
   * Adds a new DecisionLog entry to the decision history
   */
  public static addDecisionLog(log: DecisionLog): DecisionLog {
    const entry: DecisionLog = {
      timestamp: log.timestamp || new Date().toISOString(),
      event: log.event,
      affectedIncident: log.affectedIncident,
      resourceId: log.resourceId,
      action: log.action,
      reason: log.reason,
      requiresHumanApproval: log.requiresHumanApproval ?? false
    };
    decisionLogsStore.push(entry);
    return entry;
  }

  /**
   * Retrieves a copy of all accumulated decision logs
   */
  public static getDecisionLogs(): DecisionLog[] {
    return JSON.parse(JSON.stringify(decisionLogsStore));
  }

  /**
   * Clears all accumulated decision logs from in-memory storage
   */
  public static clearDecisionLogs(): void {
    decisionLogsStore.length = 0;
  }
}

export const addDecisionLog = DecisionLogService.addDecisionLog;
export const getDecisionLogs = DecisionLogService.getDecisionLogs;
export const clearDecisionLogs = DecisionLogService.clearDecisionLogs;
