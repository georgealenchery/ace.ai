import type { InterviewConfig, EvaluationResult } from "../types/interview";

export interface TestCase {
  input: unknown[];
  expectedOutput: unknown;
  description?: string;
}

export interface CodingProblem {
  prompt: string;
  functionName: string;
  functionSignature: string;
  testCases: TestCase[];
}
import type { VapiInterviewConfig } from "../hooks/useVapiInterview";
import { apiFetch } from "./auth";

// ---- Vapi analysis API ----

export interface VapiAnalysisResult {
  score: number;
  communication: number;
  technicalAccuracy: number;
  problemSolving: number;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
  questionBreakdown: Array<{
    question: string;
    candidateAnswer: string;
    score: number;
    feedback: string;
  }>;
}

export interface TranscriptEntry {
  role: "assistant" | "user";
  text: string;
  timestamp?: number;
}

export interface SavedInterview {
  id: string;
  date: string;
  role: string;
  questionType: string;
  config: VapiInterviewConfig;
  result: VapiAnalysisResult;
  transcript?: TranscriptEntry[];
}

export async function generateInterviewQuestions(
  role: string,
  difficulty: string,
  level: string,
  language?: string,
): Promise<CodingProblem[]> {
  const res = await apiFetch("/analysis/questions", {
    method: "POST",
    body: JSON.stringify({ role, difficulty, level, language }),
  });
  if (!res.ok) throw new Error("Failed to generate questions");
  const data = await res.json() as { problems: CodingProblem[] };
  return data.problems;
}

export async function evaluateVapiInterview(
  transcript: TranscriptEntry[],
  config: VapiInterviewConfig,
): Promise<{ id: string; result: VapiAnalysisResult }> {
  const res = await apiFetch("/analysis/evaluate", {
    method: "POST",
    body: JSON.stringify({ transcript, config }),
  });
  if (!res.ok) throw new Error("Failed to evaluate interview");
  return res.json();
}

export async function getInterviewHistory(): Promise<SavedInterview[]> {
  const res = await apiFetch("/analysis/history");
  if (!res.ok) throw new Error("Failed to fetch interview history");
  const data = await res.json();
  return data.interviews;
}

// ---- Replay API ----

export interface ReplayInterview {
  id: string;
  role: string;
  question_type: string;
  date: string;
  config?: VapiInterviewConfig;
  result: VapiAnalysisResult;
  transcript?: TranscriptEntry[];
}

export async function getInterviews(): Promise<ReplayInterview[]> {
  const res = await apiFetch("/interviews");
  if (!res.ok) throw new Error("Failed to fetch interviews");
  const data = await res.json() as { interviews: ReplayInterview[] };
  return data.interviews;
}

export async function getInterview(id: string): Promise<ReplayInterview> {
  const res = await apiFetch(`/interviews/${id}`);
  if (!res.ok) throw new Error("Failed to fetch interview");
  const data = await res.json() as { interview: ReplayInterview };
  return data.interview;
}

// ---- Text interview API ----

type StartResponse = {
  question: string;
  step: number;
  mode: string;
  phase: string;
};

type NextResponse =
  | { done: false; question: string; step: number; phase: string }
  | { done: true; result: EvaluationResult };

export async function startInterview(config: InterviewConfig): Promise<StartResponse> {
  const res = await apiFetch("/start", {
    method: "POST",
    body: JSON.stringify({ config }),
  });
  if (!res.ok) throw new Error("Failed to start interview");
  return res.json();
}

export async function nextStep(
  messages: { role: string; content: string }[],
  step: number,
  config: InterviewConfig,
): Promise<NextResponse> {
  const res = await apiFetch("/next", {
    method: "POST",
    body: JSON.stringify({ messages, step, config }),
  });
  if (!res.ok) throw new Error("Failed to get next step");
  return res.json();
}
