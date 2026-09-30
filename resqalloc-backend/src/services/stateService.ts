import {
    IncidentModel,
    ResourceModel,
    AssignmentModel,
    DecisionLogModel,
} from "../models/models";
import { IIncident, IResource, IAssignment, IDecisionLog } from "../models/types";

export interface FullState {
    incidents: IIncident[];
    resources: IResource[];
    assignments: IAssignment[];
    logs: IDecisionLog[];
}

/**
 * Fetches the entire real-time operational state from the database.
 * Aggregates incidents, resources, assignments, and audit logs.
 */
export async function getFullState(): Promise<FullState> {
    const [incidents, resources, assignments, logs] = await Promise.all([
        IncidentModel.find().lean(),
        ResourceModel.find().lean(),
        AssignmentModel.find().lean(),
        DecisionLogModel.find().sort({ timestamp: -1 }).limit(50).lean(),
    ]);

    return {
        incidents: incidents as unknown as IIncident[],
        resources: resources as unknown as IResource[],
        assignments: assignments as unknown as IAssignment[],
        logs: logs as unknown as IDecisionLog[],
    };
}
