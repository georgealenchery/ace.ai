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
