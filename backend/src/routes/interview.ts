import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

// POST /api/start
router.post("/start", (_req: Request, res: Response) => {
  res.json({ question: "placeholder question" });
});

// POST /api/next
router.post("/next", (req: Request, res: Response) => {
  const { step } = req.body as { messages: unknown[]; step: number };

  if (step < 3) {
    res.json({ question: "placeholder follow-up" });
  } else {
    res.json({ done: true, score: 80 });
  }
});

export default router;
