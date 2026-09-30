import { Document, Types } from "mongoose";

export interface IIncident extends Document {
    title: string;
    description: string;
    locationName: string;
    coordinates: [number, number]; // [longitude, latitude]
    severity: 1 | 2 | 3 | 4 | 5;
    urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    requiredResources: ("ambulance" | "fireTruck" | "rescueSquad")[];
    status: "PENDING" | "ASSIGNED" | "RESOLVED";
}

export interface IResource extends Document {
    callsign: string;
    type: "ambulance" | "fireTruck" | "rescueSquad";
    coordinates: [number, number];
    status: "IDLE" | "ASSIGNED" | "OUT_OF_SERVICE";
    currentIncidentId: Types.ObjectId | null;
}

export interface IAssignment extends Document {
    incidentId: Types.ObjectId;
    resourceId: Types.ObjectId;
    assignedBy: "AI_AGENT" | "HUMAN_OVERRIDE";
    status: "ACTIVE" | "PREEMPTED" | "COMPLETED";
    assignedAt: Date;
}

export interface IDecisionLog extends Document {
    action: "DISPATCH" | "PREEMPTION" | "REJECTED_BY_DB";
    details: Record<string, any>;
    actor: string;
    reason: string;
    timestamp: Date;
}