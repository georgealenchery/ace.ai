import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { TechnicalToolbar } from "./TechnicalToolbar";
import { TechnicalPromptCard } from "./TechnicalPromptCard";
import { TechnicalChatPanel } from "./TechnicalChatPanel";
import { TechnicalCodeEditor } from "./TechnicalCodeEditor";

const MOCK_PROMPT = {
  title: "Two Sum",
  difficulty: "Medium" as const,
  description:
    "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    {
      input: "nums = [3,2,4], target = 6",
      output: "[1,2]",
    },
  ],
  constraints: [
    "2 ≤ nums.length ≤ 10⁴",
    "-10⁹ ≤ nums[i] ≤ 10⁹",
    "-10⁹ ≤ target ≤ 10⁹",
    "Only one valid answer exists.",
  ],
};

const MOCK_TRANSCRIPT = [
  {
    speaker: "AI" as const,
    text: "Welcome! Let's start with a classic problem. Take a moment to read the prompt, then walk me through your initial approach before you start coding.",
  },
  {
    speaker: "You" as const,
    text: "Sure — my first instinct is to use a hash map to store each number's index as I iterate, so I can check in O(1) whether the complement exists.",
  },
  {
    speaker: "AI" as const,
    text: "Good thinking. What's the time and space complexity of that approach?",
  },
];

export function TechnicalInterviewLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState(0);
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  // Pick up config passed from SetupDashboard via router state
  const state = location.state as {
    role?: string;
    questionType?: string;
    difficulty?: number;
  } | null;

  const role = state?.role ?? "Frontend Engineer Intern";
  const mode = (state?.questionType === "hybrid" ? "hybrid" : "technical") as "technical" | "hybrid";
  const difficultyLabel = (() => {
    const d = state?.difficulty ?? 50;
    if (d < 34) return "Easy";
    if (d < 67) return "Medium";
    return "Hard";
  })();

  useEffect(() => {
    const timer = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Simulate AI speaking pulse
    const interval = setInterval(() => setIsAISpeaking((prev) => !prev), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col p-4 overflow-hidden">
      {/* Toolbar */}
      <TechnicalToolbar
        role={role}
        difficulty={difficultyLabel}
        questionNumber={1}
        totalQuestions={3}
        time={time}
        mode={mode}
        onEnd={() => navigate("/analytics")}
      />

      {/* Split Layout */}
      <div className="flex-1 grid lg:grid-cols-[2fr_3fr] gap-4 min-h-0">
        {/* Left Panel — Prompt + Chat */}
        <div className="flex flex-col gap-4 min-h-0">
          <TechnicalPromptCard
            prompt={MOCK_PROMPT}
            questionNumber={1}
            totalQuestions={3}
          />
          <div className="flex-1 min-h-0">
            <TechnicalChatPanel
              transcript={MOCK_TRANSCRIPT}
              isAISpeaking={isAISpeaking}
            />
          </div>
        </div>

        {/* Right Panel — Code Editor */}
        <div className="backdrop-blur-lg bg-gray-900/80 rounded-2xl border border-white/10 shadow-xl overflow-hidden flex flex-col min-h-0">
          <TechnicalCodeEditor />
        </div>
      </div>
    </div>
  );
}
