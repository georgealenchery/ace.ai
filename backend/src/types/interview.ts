export type InterviewMode = "behavioral" | "technical" | "hybrid";

export type Message = {
  role: "system" | "assistant" | "user";
  content: string;
};

export type InterviewConfig = {
  role: string;
  questionType: InterviewMode;
  difficulty: number;       // 0–100
  strictness: number;       // 0–100
  experienceLevel: number;  // 0–3 (Intern, Entry, Junior, Senior)
  interviewer: string;
  mode: InterviewMode;
};

export type InterviewStepInput = {
  messages: Message[];
  step: number;
  config: InterviewConfig;
};

export type InterviewStartResult = {
  question: string;
  step: number;
  mode: InterviewMode;
  phase: "behavioral" | "technical";
};

export type InterviewNextResult =
  | { done: false; question: string; step: number; phase: "behavioral" | "technical" }
  | { done: true; result: EvaluationResult };

export type EvaluationResult = {
  score: number;
  communication: number;
  technicalAccuracy: number;
  problemSolving: number;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
};

export type TranscribeResult = {
  text: string;
};

export type ApiErrorResponse = {
  error: string;
  details?: string;
};
