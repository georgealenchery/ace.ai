type Message = { role: string; content: string };

// Formats a messages array into a plain text transcript
export function formatTranscript(messages: Message[]): string {
  return messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");
}
