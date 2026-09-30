import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { socketService } from "./services/socketService";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server using Express
const server = http.createServer(app);

// Initialize WebSocket server
socketService.init(server);

// Routes
app.get("/", (_req, res) => {
    res.json({
        message: "ResQAlloc API is running",
    });
});

// Example API route
app.get("/api/state", (_req, res) => {
    res.json({
        status: "ok",
        message: "Current state endpoint",
    });
});

// Environment variables
const PORT = process.env.PORT || 5000;

const MONGO_URI =
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/resqalloc?directConnection=true";

// Connect to MongoDB
mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB successfully");

        // IMPORTANT:
        // Use server.listen(), NOT app.listen()
        server.listen(PORT, () => {
            console.log(
                `ResQAlloc WebSocket & HTTP server running on port ${PORT}`
            );
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err);
        process.exit(1);
    });