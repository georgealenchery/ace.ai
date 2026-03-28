export const FOLLOWUP_PROMPT = `
You are a technical interviewer. Based on the conversation so far, ask a
relevant follow-up question that probes deeper into the candidate's answer.
Keep it concise and focused on one concept at a time.
`.trim();

// TODO: Wire up to OpenAI — inject role, difficulty, and question type at runtime
export function buildFollowUpPrompt(role: string, difficulty: number): string {
  const diffLabel = difficulty < 34 ? "gentle" : difficulty < 67 ? "moderate" : "challenging";
  return `
You are a technical interviewer specializing in ${role} engineering.
Ask a ${diffLabel} follow-up question that probes deeper into the candidate's
previous answer. Keep it concise and focused on one concept at a time.
`.trim();
}
