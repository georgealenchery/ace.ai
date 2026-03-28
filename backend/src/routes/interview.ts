import { Router } from "express";
import type { Request, Response } from "express";
import { startInterview, nextStep } from "../services/interviewEngine";
import type { InterviewConfig, Message } from "../types/interview";

const router = Router();

// POST /api/start — begin a new interview session
router.post("/start", async (req: Request, res: Response) => {
  try {
    const { config } = req.body as { config: InterviewConfig };

    if (!config) {
      return res.status(400).json({ error: "Missing required field: config" });
    }

    if (!config.role || !config.mode) {
      return res.status(400).json({
        error: "Missing required config fields: role, mode",
      });
    }

    const result = await startInterview(config);
    res.json(result);
  } catch (err) {
    console.error("Error starting interview:", err);
    res.status(500).json({ error: "Failed to start interview" });
  }
});

// POST /api/next — advance interview by one step (follow-up or evaluation)
router.post("/next", async (req: Request, res: Response) => {
  try {
    const { messages, step, config } = req.body as {
      messages: Message[];
      step: number;
      config: InterviewConfig;
    };

    if (!messages || step == null || !config) {
      res
        .status(400)
        .json({ error: "Missing required fields: messages, step, config" });
      return;
    }

    const result = await nextStep({ messages, step, config });
    res.json(result);
  } catch (err) {
    console.error("Error advancing interview:", err);
    res.status(500).json({ error: "Failed to advance interview" });
  }
});

export default router;
