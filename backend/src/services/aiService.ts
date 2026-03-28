export async function generateFollowUp(messages: unknown[]): Promise<string> {
  // TODO: call OpenAI with FOLLOWUP_PROMPT
  console.log("generateFollowUp called with", messages.length, "messages");
  return "placeholder follow-up question";
}

export async function evaluate(messages: unknown[]): Promise<number> {
  // TODO: call OpenAI with EVALUATION_PROMPT
  console.log("evaluate called with", messages.length, "messages");
  return 80;
}
