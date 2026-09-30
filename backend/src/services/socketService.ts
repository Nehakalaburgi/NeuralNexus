import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";

interface ExtendedWebSocket extends WebSocket {
    isAlive: boolean;
}

class SocketService {
    private wss: WebSocketServer | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;

    /**
     * Attach the WebSocket server to an existing Node.js HTTP server.
     */
    public init(server: HttpServer): void {
        this.wss = new WebSocketServer({ server });

        this.wss.on("connection", (ws: WebSocket) => {
            const extWs = ws as ExtendedWebSocket;
            extWs.isAlive = true;

            console.log("⚡ Frontend client connected via WebSocket");

            // Respond to heartbeat pongs from client
            extWs.on("pong", () => {
                extWs.isAlive = true;
            });

            // Handle client-to-server messages
            extWs.on("message", (rawMessage) => {
                try {
                    const parsed = JSON.parse(rawMessage.toString());
                    console.log("Received message from client:", parsed);
                } catch {
                    console.warn("Received non-JSON message:", rawMessage.toString());
                }
            });

            extWs.on("close", (code, reason) => {
                console.log(`Frontend client disconnected (Code: ${code}, Reason: ${reason.toString()})`);
            });

            extWs.on("error", (error) => {
                console.error("WebSocket connection error:", error);
            });
        });

        // Clean up broken connections every 30 seconds
        this.heartbeatInterval = setInterval(() => {
            if (!this.wss) return;

            this.wss.clients.forEach((client) => {
                const extWs = client as ExtendedWebSocket;
                if (!extWs.isAlive) {
                    extWs.terminate();
                    return;
                }
                extWs.isAlive = false;
                extWs.ping();
            });
        }, 30_000);

        this.wss.on("close", () => {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
                this.heartbeatInterval = null;
            }
        });
    }

    /**
     * Broadcast an event and payload to all connected WebSocket clients.
     */
    public broadcast(event: string, data: unknown): void {
        if (!this.wss) {
            console.warn("WebSocketServer has not been initialized yet.");
            return;
        }

        const payload = JSON.stringify({
            event,
            data,
            timestamp: new Date().toISOString(),
        });

        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
            }
        });
    }

    /**
     * Gracefully close the WebSocket server and clear timers.
     */
    public close(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.wss) {
            this.wss.close();
            this.wss = null;
        }
    }
}

export const socketService = new SocketService();
