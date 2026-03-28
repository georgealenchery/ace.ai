// TODO: Uncomment once OPENAI_API_KEY is set in .env
// import OpenAI from "openai";
// const openai = new OpenAI();

import type { TranscribeResult } from "../types/interview";

// TODO: Wire up real Whisper STT call
export async function transcribeAudio(_audioBuffer: Buffer): Promise<TranscribeResult> {
  // const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });
  // const res = await openai.audio.transcriptions.create({
  //   model: "whisper-1",
  //   file,
  // });
  // return { text: res.text };
  console.log("transcribeAudio called — returning placeholder");
  return { text: "placeholder transcription" };
}
