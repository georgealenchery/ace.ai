import { Router } from "express";
import type { Request, Response } from "express";
import { transcribeAudio } from "../services/sttService";

const router = Router();

// TODO: Install multer and uncomment file upload handling
// import multer from "multer";
// const upload = multer({ storage: multer.memoryStorage() });
// router.post("/", upload.single("audio"), async (req: Request, res: Response) => {

router.post("/", async (_req: Request, res: Response) => {
  try {
    // TODO: Replace with actual audio buffer from multer
    // const audioBuffer = req.file?.buffer;
    // if (!audioBuffer) {
    //   res.status(400).json({ error: "No audio file provided" });
    //   return;
    // }
    // const result = await transcribeAudio(audioBuffer);

    const result = await transcribeAudio(Buffer.from(""));
    res.json(result);
  } catch (err) {
    console.error("Transcription error:", err);
    res.status(500).json({ error: "Transcription failed" });
  }
});

export default router;
