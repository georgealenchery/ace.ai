import { Router } from "express";
import type { Request, Response } from "express";
import { analyzeVapiTranscript } from "../services/aiService";
import { saveInterview, getInterviews } from "../services/storageService";
import type { VapiTranscriptEntry, VapiInterviewConfig } from "../types/interview";

const router = Router();

// POST /api/analysis/evaluate — analyze a completed voice interview
router.post("/evaluate", async (req: Request, res: Response) => {
  try {
    const { transcript, config } = req.body as {
      transcript: VapiTranscriptEntry[];
      config: VapiInterviewConfig;
    };

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ error: "Missing or empty transcript" });
    }

    if (!config || !config.role || !config.questionType) {
      return res.status(400).json({ error: "Missing required config fields: role, questionType" });
    }

    const result = await analyzeVapiTranscript(transcript, config);
    const saved = saveInterview(config, result);

    res.json({ id: saved.id, result });
  } catch (err) {
    console.error("Error analyzing interview:", err);
    res.status(500).json({ error: "Failed to analyze interview" });
  }
});

// GET /api/analysis/history — return all past interview results
router.get("/history", (_req: Request, res: Response) => {
  try {
    const interviews = getInterviews();
    res.json({ interviews });
  } catch (err) {
    console.error("Error fetching interview history:", err);
    res.status(500).json({ error: "Failed to fetch interview history" });
  }
});

export default router;
