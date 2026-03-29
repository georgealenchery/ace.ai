import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { OPENAI_MODEL } from "../config";
import { buildFollowUpPrompt } from "../prompts/followUp";
import { buildEvaluationPrompt } from "../prompts/evaluation";
import { buildBehavioralPrompt } from "../prompts/behavioral";
import { buildTechnicalPrompt } from "../prompts/technical";
import { formatTranscript } from "../utils/formatter";
import type { Message, InterviewConfig, EvaluationResult, VapiTranscriptEntry, VapiInterviewConfig, VapiAnalysisResult } from "../types/interview";

const openai = new OpenAI();

const DEFAULT_EVALUATION: EvaluationResult = {
  score: 50,
  communication: 50,
  technicalAccuracy: 50,
  problemSolving: 50,
  strengths: ["Unable to fully evaluate"],
  improvements: ["Unable to fully evaluate"],
  nextSteps: ["Retry the interview for a complete evaluation"],
};

/**
 * Generate the opening question for an interview session.
 */
export async function generateFirstQuestion(config: InterviewConfig): Promise<string> {
  const { role, mode, difficulty, experienceLevel } = config;

  const prompt =
    mode === "technical"
      ? buildTechnicalPrompt(role, difficulty, experienceLevel)
      : buildBehavioralPrompt(role, experienceLevel);

  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: "system", content: prompt }],
  });

  return res.choices[0]?.message.content ?? "";
}

/**
 * Generate a follow-up question based on conversation history.
 */
export async function generateFollowUp(
  messages: Message[],
  config: InterviewConfig,
): Promise<string> {
  const prompt = buildFollowUpPrompt(config.role, config.difficulty);
  const transcript = formatTranscript(messages);

  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: transcript },
    ],
  });

  return res.choices[0]?.message.content ?? "";
}

/**
 * Evaluate the full interview transcript and return structured feedback.
 */
export async function evaluateInterview(
  messages: Message[],
  config: InterviewConfig,
): Promise<EvaluationResult> {
  const prompt = buildEvaluationPrompt(config.role, config.questionType);
  const transcript = formatTranscript(messages);

  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: transcript },
    ],
  });

  const raw = res.choices[0]?.message.content ?? "{}";

  try {
    const parsed = JSON.parse(raw) as Partial<EvaluationResult>;
    return {
      score: parsed.score ?? DEFAULT_EVALUATION.score,
      communication: parsed.communication ?? DEFAULT_EVALUATION.communication,
      technicalAccuracy: parsed.technicalAccuracy ?? DEFAULT_EVALUATION.technicalAccuracy,
      problemSolving: parsed.problemSolving ?? DEFAULT_EVALUATION.problemSolving,
      strengths: parsed.strengths ?? DEFAULT_EVALUATION.strengths,
      improvements: parsed.improvements ?? DEFAULT_EVALUATION.improvements,
      nextSteps: parsed.nextSteps ?? DEFAULT_EVALUATION.nextSteps,
    };
  } catch {
    console.error("Failed to parse evaluation response:", raw);
    return DEFAULT_EVALUATION;
  }
}

const DEFAULT_VAPI_ANALYSIS: VapiAnalysisResult = {
  score: 50,
  communication: 50,
  technicalAccuracy: 50,
  problemSolving: 50,
  strengths: ["Unable to fully evaluate"],
  improvements: ["Unable to fully evaluate"],
  nextSteps: ["Retry the interview for a complete evaluation"],
  questionBreakdown: [],
};

/**
 * Analyze a completed Vapi voice interview transcript.
 */
export async function analyzeVapiTranscript(
  transcript: VapiTranscriptEntry[],
  config: VapiInterviewConfig,
): Promise<VapiAnalysisResult> {
  const roleLabel = config.role.charAt(0).toUpperCase() + config.role.slice(1);

  const difficultyLabel =
    config.difficulty <= 30 ? "easy" : config.difficulty <= 60 ? "medium" : "hard";
  const strictnessLabel =
    config.strictness <= 30 ? "lenient" : config.strictness <= 60 ? "fair" : "strict";
  const experienceLabel =
    config.experienceLevel <= 30 ? "junior" : config.experienceLevel <= 60 ? "mid-level" : "senior";

  const formattedTranscript = transcript
    .map((entry) => `${entry.role === "assistant" ? "Interviewer" : "Candidate"}: ${entry.text}`)
    .join("\n");

  const prompt = `You are an expert interview evaluator. Analyze the following ${roleLabel} engineering interview transcript.

Interview settings:
- Role: ${roleLabel} engineer
- Question type: ${config.questionType}
- Difficulty: ${difficultyLabel} (${config.difficulty}/100)
- Candidate experience level: ${experienceLabel} (${config.experienceLevel}/100)
- Interviewer strictness: ${strictnessLabel} (${config.strictness}/100)

Evaluate the candidate's performance considering the difficulty and experience level. A junior candidate answering easy questions should be graded relative to junior expectations. A senior candidate answering hard questions should be graded relative to senior expectations.

Return a JSON object with exactly this structure:
{
  "score": <number 0-100, overall interview performance>,
  "communication": <number 0-100, clarity, articulation, conciseness of answers>,
  "technicalAccuracy": <number 0-100, correctness of technical content>,
  "problemSolving": <number 0-100, logical thinking, approach to problems>,
  "strengths": [<3-5 strings, specific strengths with brief examples from the transcript>],
  "improvements": [<3-5 strings, specific areas to improve with examples from the transcript>],
  "nextSteps": [<3-5 strings, actionable study or practice recommendations>],
  "questionBreakdown": [
    {
      "question": <the interviewer's question>,
      "candidateAnswer": <summary of the candidate's answer>,
      "score": <number 0-100>,
      "feedback": <specific feedback on this answer>
    }
  ]
}

Include every question-answer pair in questionBreakdown. Be specific and reference the candidate's actual words. Do not be generic.`;

  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: formattedTranscript },
    ],
  });

  const raw = res.choices[0]?.message.content ?? "{}";

  try {
    const parsed = JSON.parse(raw) as Partial<VapiAnalysisResult>;
    return {
      score: parsed.score ?? DEFAULT_VAPI_ANALYSIS.score,
      communication: parsed.communication ?? DEFAULT_VAPI_ANALYSIS.communication,
      technicalAccuracy: parsed.technicalAccuracy ?? DEFAULT_VAPI_ANALYSIS.technicalAccuracy,
      problemSolving: parsed.problemSolving ?? DEFAULT_VAPI_ANALYSIS.problemSolving,
      strengths: parsed.strengths ?? DEFAULT_VAPI_ANALYSIS.strengths,
      improvements: parsed.improvements ?? DEFAULT_VAPI_ANALYSIS.improvements,
      nextSteps: parsed.nextSteps ?? DEFAULT_VAPI_ANALYSIS.nextSteps,
      questionBreakdown: parsed.questionBreakdown ?? DEFAULT_VAPI_ANALYSIS.questionBreakdown,
    };
  } catch {
    console.error("Failed to parse Vapi analysis response:", raw);
    return DEFAULT_VAPI_ANALYSIS;
  }
}
