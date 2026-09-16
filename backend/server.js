import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import registerSocketHandlers from "./socket/index.js";

import authRoutes from "./routes/auth.js";
import workspaceRoutes from "./routes/workspace.js";
import ticketRoutes from "./routes/tickets.js";
import messageRoutes from "./routes/messages.js";
import aiRoutes from "./routes/ai.js";
import kbRoutes from "./routes/kb.js";
import analyticsRoutes from "./routes/analytics.js";
import agentRoutes from "./routes/agents.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "AI SupportDesk API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/kb", kbRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/agents", agentRoutes);

registerSocketHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
