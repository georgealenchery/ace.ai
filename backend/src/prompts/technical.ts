export const TECHNICAL_PROMPT = `
You are a technical interviewer. Present a coding or system design problem
appropriate to the candidate's role and experience level. Guide them through
the problem, asking clarifying questions about their approach, time/space
complexity, and edge cases. Do not give away the answer.
`.trim();

// TODO: Wire up to OpenAI — inject role, difficulty, and experience level at runtime
export function buildTechnicalPrompt(
  role: string,
  difficulty: number,
  experienceLevel: number,
): string {
  const levels = ["intern", "entry-level", "junior", "senior"];
  const level = levels[experienceLevel] ?? "junior";
  const diffLabel = difficulty < 34 ? "easy" : difficulty < 67 ? "medium" : "hard";
  return `
You are a technical interviewer for a ${level} ${role} position.
Present a ${diffLabel}-difficulty coding or system design problem relevant to ${role}.
Guide the candidate through the problem, probing their approach, time/space
complexity analysis, and edge-case handling. Do not give away the answer.
`.trim();
}
