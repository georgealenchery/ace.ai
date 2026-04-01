import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import interviewRoutes from "./routes/interview";
import interviewsRoutes from "./routes/interviews";
import executeRoutes from "./routes/execute";
import vapiRoutes from "./routes/vapi";
import analysisRoutes from "./routes/analysis";
import authRoutes from "./routes/auth";
import { authMiddleware } from "./middleware/auth";
import { validateEnv } from "./config";
import { initDb } from "./db";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
    res.send("Hello, AI Interviewer!");
});

// Public routes
app.use("/api/auth", authRoutes);
app.use("/api/vapi", vapiRoutes);

// Protected routes
app.use("/api/execute", authMiddleware, executeRoutes);
app.use("/api/analysis", authMiddleware, analysisRoutes);
app.use("/api/interviews", authMiddleware, interviewsRoutes);
app.use("/api", authMiddleware, interviewRoutes);

async function start() {
  try {
    validateEnv();
    await initDb();
    app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("[Server] Startup failed:", err);
    process.exit(1);
  }
}

start();
