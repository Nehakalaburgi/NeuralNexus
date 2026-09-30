import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { ResourceModel, IncidentModel, AssignmentModel, DecisionLogModel } from "../models/models.js";
import { getFullState } from "./stateService.js";

class SocketService {
    private io: SocketIOServer | null = null;

    /**
     * Attach the Socket.IO server to an existing Node.js HTTP server.
     */
    public init(server: HttpServer): void {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
                methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                credentials: true,
            },
            transports: ["websocket", "polling"],
        });

        this.io.on("connection", async (socket: Socket) => {
            console.log(`⚡ Frontend client connected via Socket.IO [ID: ${socket.id}]`);

            // 1. Send immediate state snapshot upon client connection
            try {
                const state = await getFullState();
                socket.emit("state_update", state);
                socket.emit("STATE_UPDATED", state);
            } catch (err) {
                console.error("Failed to send initial state snapshot on connection:", err);
            }

            // 2. HITL Approval Listener: handle 'approve_reallocation' from frontend
            socket.on("approve_reallocation", async (data: { incidentId: string; resourceId: string; timestamp?: string }) => {
                console.log("📥 Received 'approve_reallocation' event from frontend:", data);
                try {
                    await this.handleApproveReallocation(data);
                } catch (err) {
                    console.error("Error processing 'approve_reallocation':", err);
                }
            });

            // 3. HITL Rejection Listener: handle 'reject_reallocation' from frontend
            socket.on("reject_reallocation", async (data: { incidentId: string }) => {
                console.log("📥 Received 'reject_reallocation' event from frontend:", data);
                try {
                    await this.handleRejectReallocation(data);
                } catch (err) {
                    console.error("Error processing 'reject_reallocation':", err);
                }
            });

            socket.on("disconnect", (reason) => {
                console.log(`Frontend client disconnected [ID: ${socket.id}, Reason: ${reason}]`);
            });
        });
    }

    /**
     * Broadcast an event and payload to all connected Socket.IO clients.
     */
    public broadcast(event: string, data: unknown): void {
        if (!this.io) {
            console.warn("Socket.IO server has not been initialized yet.");
            return;
        }

        this.io.emit(event, data);
        if (event === "state_update") {
            this.io.emit("STATE_UPDATED", data);
        } else if (event === "STATE_UPDATED") {
            this.io.emit("state_update", data);
        }
    }

    /**
     * Broadcast current database state snapshot to all connected clients.
     */
    public async broadcastState(): Promise<unknown> {
        try {
            const state = await getFullState();
            this.broadcast("state_update", state);
            return state;
        } catch (err) {
            console.error("Error broadcasting updated state snapshot:", err);
            return null;
        }
    }

    /**
     * Commit Human-In-The-Loop Reallocation Approval:
     * Updates assignment record, sets resource and incident status, logs decision, and broadcasts updated state.
     */
    public async handleApproveReallocation(data: { incidentId: string; resourceId: string; timestamp?: string }): Promise<void> {
        const { incidentId, resourceId } = data;
        if (!incidentId || !resourceId) {
            console.warn("Invalid approve_reallocation payload: missing incidentId or resourceId");
            return;
        }

        try {
            // 1. Preempt existing active assignments for this resource or incident
            await AssignmentModel.updateMany(
                {
                    $or: [
                        { resourceId, status: "ACTIVE" },
                        { incidentId, status: "ACTIVE" },
                    ],
                },
                { status: "PREEMPTED" }
            );

            // 2. Create new active assignment
            const newAssignment = await AssignmentModel.create({
                incidentId,
                resourceId,
                assignedBy: "HUMAN_OVERRIDE",
                status: "ACTIVE",
                assignedAt: new Date(),
            });

            // 3. Update Resource and Incident status
            const [resource, incident] = await Promise.all([
                ResourceModel.findByIdAndUpdate(
                    resourceId,
                    { status: "ASSIGNED", currentIncidentId: incidentId },
                    { new: true }
                ),
                IncidentModel.findByIdAndUpdate(
                    incidentId,
                    { status: "ASSIGNED" },
                    { new: true }
                ),
            ]);

            // 4. Append Decision Audit Log
            const decisionLog = await DecisionLogModel.create({
                action: "DISPATCH",
                actor: "Human Commander (HITL)",
                details: {
                    assignmentId: newAssignment._id,
                    resourceId,
                    incidentId,
                    callsign: resource?.callsign || resourceId,
                    incidentTitle: incident?.title || incidentId,
                },
                reason: `HUMAN OPERATOR AUTHORIZED: Resource ${resource?.callsign || resourceId} reallocated to ${incident?.title || incidentId}.`,
                timestamp: new Date(),
            });

            this.broadcast("DECISION_LOG_ADDED", decisionLog);

            // 5. Broadcast new state snapshot immediately to all clients
            await this.broadcastState();
        } catch (err) {
            console.error("Failed to commit reallocation approval in DB:", err);
            throw err;
        }
    }

    /**
     * Handle HITL Reallocation Rejection
     */
    public async handleRejectReallocation(data: { incidentId: string }): Promise<void> {
        const { incidentId } = data;
        try {
            const rejectionLog = await DecisionLogModel.create({
                action: "REJECTED_BY_DB",
                actor: "Human Commander (HITL)",
                details: { incidentId },
                reason: `OVERRIDE: Human commander rejected reallocation proposal for ${incidentId}.`,
                timestamp: new Date(),
            });

            this.broadcast("DECISION_LOG_ADDED", rejectionLog);
            await this.broadcastState();
        } catch (err) {
            console.error("Failed to process reallocation rejection in DB:", err);
            throw err;
        }
    }

    /**
     * Gracefully close Socket.IO server and clear connections.
     */
    public close(): void {
        if (this.io) {
            this.io.close();
            this.io = null;
        }
    }
}

export const socketService = new SocketService();
