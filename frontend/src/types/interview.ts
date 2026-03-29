export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export type InterviewState = {
  messages: Message[];
  question: string;
  isLoading: boolean;
};

export type InterviewMode = "behavioral" | "technical";

export type InterviewConfig = {
  mode: InterviewMode;
  questionType: InterviewMode;
  role: string;
  difficulty: number;
  strictness: number;
  experienceLevel: number;
  interviewer: string;
};

export type EvaluationResult = {
  score: number;
  communication: number;
  technicalAccuracy: number;
  problemSolving: number;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
};

export type InterviewStatus = "idle" | "running" | "finished";
