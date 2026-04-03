import { Router } from "express";
import type { Request, Response } from "express";
import { analyzeVapiTranscript, generateInterviewQuestions } from "../services/aiService";
import { saveInterview, getInterviews } from "../services/storageService";
import type { VapiTranscriptEntry, VapiInterviewConfig } from "../types/interview";

const router = Router();

// POST /api/analysis/questions — generate 3 role-aware technical questions
router.post("/questions", async (req: Request, res: Response) => {
  try {
    const { role, difficulty, level, language } = req.body as {
      role: string;
      difficulty: string;
      level: string;
      language?: string;
    };

    if (!role || !difficulty || !level) {
      return res.status(400).json({ error: "Missing required fields: role, difficulty, level" });
    }

    const problems = await generateInterviewQuestions(role, difficulty, level, language);
    res.json({ problems });
  } catch (err) {
    console.error("Error generating questions:", err);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

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

    // Strip timestamps for AI analysis; pass full entries (with timestamps) to storage
    const analysisTranscript = transcript.map(({ role, text }) => ({ role, text }));
    const result = await analyzeVapiTranscript(analysisTranscript, config);
    const saved = await saveInterview(req.user!.id, config, result, transcript);

    res.json({ id: saved.id, result });
  } catch (err) {
    console.error("Error analyzing interview:", err);
    res.status(500).json({ error: "Failed to analyze interview" });
  }
});

// GET /api/analysis/history — return all past interview results (includes transcripts)
router.get("/history", async (req: Request, res: Response) => {
  try {
    const interviews = await getInterviews(req.user!.id);
    res.json({ interviews });
  } catch (err) {
    console.error("Error fetching interview history:", err);
    res.status(500).json({ error: "Failed to fetch interview history" });
  }
});

export default router;
