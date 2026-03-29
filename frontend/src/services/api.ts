import type { InterviewConfig, EvaluationResult } from "../types/interview";
import type { VapiInterviewConfig } from "../hooks/useVapiInterview";

const BASE_URL = "http://localhost:3001/api";

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

export interface SavedInterview {
  id: string;
  date: string;
  role: string;
  questionType: string;
  config: VapiInterviewConfig;
  result: VapiAnalysisResult;
}

export async function evaluateVapiInterview(
  transcript: Array<{ role: string; text: string }>,
  config: VapiInterviewConfig,
): Promise<{ id: string; result: VapiAnalysisResult }> {
  const res = await fetch(`${BASE_URL}/analysis/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, config }),
  });
  if (!res.ok) throw new Error("Failed to evaluate interview");
  return res.json();
}

export async function getInterviewHistory(): Promise<SavedInterview[]> {
  const res = await fetch(`${BASE_URL}/analysis/history`);
  if (!res.ok) throw new Error("Failed to fetch interview history");
  const data = await res.json();
  return data.interviews;
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
  const res = await fetch(`${BASE_URL}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${BASE_URL}/next`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, step, config }),
  });
  if (!res.ok) throw new Error("Failed to get next step");
  return res.json();
}
