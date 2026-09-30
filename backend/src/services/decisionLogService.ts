import type { DecisionLog } from '@neuralnexus/shared';

const decisionLogs: DecisionLog[] = [];

/**
 * Adds a new decision log entry to the in-memory store.
 */
export const addDecisionLog = (log: DecisionLog): DecisionLog => {
  const logEntry: DecisionLog = {
    ...log,
    timestamp: log.timestamp || new Date().toISOString()
  };
  decisionLogs.push(logEntry);
  return { ...logEntry };
};

/**
 * Retrieves a fresh copy of all decision log entries.
 */
export const getDecisionLogs = (): DecisionLog[] => {
  return JSON.parse(JSON.stringify(decisionLogs));
};

/**
 * Clears all stored decision logs.
 */
export const clearDecisionLogs = (): void => {
  decisionLogs.length = 0;
};
