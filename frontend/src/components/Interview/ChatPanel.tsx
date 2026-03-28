import { useState } from "react";
import type { Message } from "../../types/interview";

const MOCK_MESSAGES: Message[] = [
  { id: "1", role: "assistant", content: "Tell me about yourself.", timestamp: new Date() },
  { id: "2", role: "user", content: "I'm a software engineer with 3 years of experience.", timestamp: new Date() },
];

type ChatPanelProps = {
  messages?: Message[];
  onSend?: (answer: string) => void;
};

export function ChatPanel({ messages = MOCK_MESSAGES, onSend }: ChatPanelProps) {
  const [input, setInput] = useState("");

  function handleSend() {
    if (!input.trim()) return;
    onSend?.(input.trim());
    setInput("");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
              msg.role === "user"
                ? "ml-auto bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <div className="border-t p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your answer..."
          className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
