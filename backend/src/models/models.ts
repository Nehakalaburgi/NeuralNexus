import { Schema, model, models, Model } from "mongoose";
import { IIncident, IResource, IAssignment, IDecisionLog } from "./types.js";

const IncidentSchema = new Schema<IIncident>(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        locationName: { type: String, required: true },
        coordinates: { type: [Number], required: true },
        severity: { type: Number, min: 1, max: 5, required: true },
        urgency: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true },
        requiredResources: [{ type: String, enum: ["ambulance", "fireTruck", "rescueSquad"] }],
        status: { type: String, enum: ["PENDING", "ASSIGNED", "RESOLVED"], default: "PENDING" },
    },
    { timestamps: true }
);

const ResourceSchema = new Schema<IResource>(
    {
        callsign: { type: String, required: true, unique: true },
        type: { type: String, enum: ["ambulance", "fireTruck", "rescueSquad"], required: true },
        coordinates: { type: [Number], required: true },
        status: { type: String, enum: ["IDLE", "ASSIGNED", "OUT_OF_SERVICE"], default: "IDLE" },
        currentIncidentId: { type: Schema.Types.ObjectId, ref: "Incident", default: null },
    },
    { timestamps: true }
);

const AssignmentSchema = new Schema<IAssignment>(
    {
        incidentId: { type: Schema.Types.ObjectId, ref: "Incident", required: true },
        resourceId: { type: Schema.Types.ObjectId, ref: "Resource", required: true },
        assignedBy: { type: String, enum: ["AI_AGENT", "HUMAN_OVERRIDE"], default: "AI_AGENT" },
        status: { type: String, enum: ["ACTIVE", "PREEMPTED", "COMPLETED"], default: "ACTIVE" },
        assignedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const DecisionLogSchema = new Schema<IDecisionLog>(
    {
        action: { type: String, enum: ["DISPATCH", "PREEMPTION", "REJECTED_BY_DB"], required: true },
        details: { type: Schema.Types.Mixed, required: true },
        actor: { type: String, default: "Database Sentinel" },
        reason: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const IncidentModel = (models.Incident as Model<IIncident>) || model<IIncident>("Incident", IncidentSchema);
export const ResourceModel = (models.Resource as Model<IResource>) || model<IResource>("Resource", ResourceSchema);
export const AssignmentModel = (models.Assignment as Model<IAssignment>) || model<IAssignment>("Assignment", AssignmentSchema);
export const DecisionLogModel = (models.DecisionLog as Model<IDecisionLog>) || model<IDecisionLog>("DecisionLog", DecisionLogSchema);