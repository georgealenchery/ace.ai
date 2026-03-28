import { useState } from "react";
import type { Message } from "../types/interview";

export function useInterview() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState<string>("");

  // setMessages and setQuestion will be used when API calls are wired up
  void setMessages;
  void setQuestion;

  function sendAnswer(answer: string) {
    // TODO: call api.nextStep and update messages
    console.log("sendAnswer:", answer);
  }

  return { messages, question, sendAnswer };
}
