// TODO: Initialize OpenAI client once OPENAI_API_KEY is in .env
// import OpenAI from "openai";
// const openai = new OpenAI();

import { FOLLOWUP_PROMPT, buildFollowUpPrompt } from "../prompts/followUp";
import { EVALUATION_PROMPT, buildEvaluationPrompt } from "../prompts/evaluation";
import { buildBehavioralPrompt } from "../prompts/behavioral";
import { buildTechnicalPrompt } from "../prompts/technical";
import { formatTranscript } from "../utils/formatter";
import type { Message, InterviewConfig, EvaluationResult } from "../types/interview";

/**
 * Generate the opening question for an interview session.
 * TODO: Wire up real OpenAI call
 */
export async function generateFirstQuestion(config: InterviewConfig): Promise<string> {
  const { role, questionType, difficulty, experienceLevel } = config;

  // TODO: Uncomment once OpenAI client is initialized
  // const prompt =
  //   questionType === "behavioral"
  //     ? buildBehavioralPrompt(role, experienceLevel)
  //     : buildTechnicalPrompt(role, difficulty, experienceLevel);
  // const res = await openai.chat.completions.create({
  //   model: "gpt-4o-mini",
  //   messages: [{ role: "system", content: prompt }],
  // });
  // return res.choices[0]?.message.content ?? "";

  // Suppress unused-var warnings for imported builders used in TODO above
  void buildBehavioralPrompt;
  void buildTechnicalPrompt;

  console.log("generateFirstQuestion called:", { role, questionType, difficulty, experienceLevel });
  return `placeholder opening question for ${role} (${questionType})`;
}

/**
 * Generate a follow-up question based on conversation history.
 * TODO: Wire up real OpenAI call
 */
export async function generateFollowUp(
  messages: Message[],
  config: InterviewConfig,
): Promise<string> {
  // TODO: Uncomment once OpenAI client is initialized
  // const prompt = buildFollowUpPrompt(config.role, config.difficulty);
  // const transcript = formatTranscript(messages);
  // const res = await openai.chat.completions.create({
  //   model: "gpt-4o-mini",
  //   messages: [
  //     { role: "system", content: prompt },
  //     { role: "user", content: transcript },
  //   ],
  // });
  // return res.choices[0]?.message.content ?? "";

  void FOLLOWUP_PROMPT;
  void buildFollowUpPrompt;
  void formatTranscript;

  console.log("generateFollowUp called with", messages.length, "messages for", config.role);
  return "placeholder follow-up question";
}

/**
 * Evaluate the full interview transcript and return structured feedback.
 * TODO: Wire up real OpenAI call
 */
export async function evaluateInterview(
  messages: Message[],
  config: InterviewConfig,
): Promise<EvaluationResult> {
  // TODO: Uncomment once OpenAI client is initialized
  // const prompt = buildEvaluationPrompt(config.role, config.questionType);
  // const transcript = formatTranscript(messages);
  // const res = await openai.chat.completions.create({
  //   model: "gpt-4o-mini",
  //   response_format: { type: "json_object" },
  //   messages: [
  //     { role: "system", content: prompt },
  //     { role: "user", content: transcript },
  //   ],
  // });
  // return JSON.parse(res.choices[0]?.message.content ?? "{}") as EvaluationResult;

  void EVALUATION_PROMPT;
  void buildEvaluationPrompt;
  void formatTranscript;

  console.log("evaluateInterview called with", messages.length, "messages for", config.role);
  return {
    score: 80,
    communication: 75,
    technicalAccuracy: 82,
    problemSolving: 78,
    strengths: ["Clear communication", "Good problem breakdown"],
    improvements: ["Could discuss edge cases more", "Time complexity analysis"],
    nextSteps: ["Practice system design", "Review data structures"],
  };
}
