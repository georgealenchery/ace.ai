import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Mic } from "lucide-react";
import { TechnicalToolbar } from "./TechnicalToolbar";
import { TechnicalPromptCard } from "./TechnicalPromptCard";
import { TechnicalChatPanel } from "./TechnicalChatPanel";
import { TechnicalCodeEditor } from "./TechnicalCodeEditor";
import { useVapiTechnicalInterview } from "../../hooks/useVapiTechnicalInterview";
import type { VapiTechnicalConfig } from "../../hooks/useVapiTechnicalInterview";
import { getRandomProblem } from "../../data/technicalProblems";
import type { TechnicalProblem } from "../../data/technicalProblems";

export function TechnicalInterviewLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState(0);

  const {
    status,
    isSpeaking,
    isListening,
    messages,
    isAnalyzing,
    callEndedNaturally,
    start,
    stop,
    evaluateTranscript,
  } = useVapiTechnicalInterview();

  const state = location.state as {
    role?: string;
    questionType?: string;
    difficulty?: number;
    strictness?: number;
    experienceLevel?: number;
    interviewer?: string;
  } | null;

  const role = state?.role ?? "frontend";
  const mode = "technical" as const;
  const difficultyValue = state?.difficulty ?? 50;
  const difficultyLabel = difficultyValue <= 30 ? "Easy" : difficultyValue <= 60 ? "Medium" : "Hard";

  const [problem] = useState<TechnicalProblem>(() => getRandomProblem(difficultyValue));

  const interviewConfig: VapiTechnicalConfig = {
    role,
    difficulty: difficultyValue,
    experienceLevel: state?.experienceLevel ?? 50,
    strictness: state?.strictness ?? 50,
    questionType: (state?.questionType ?? "technical") as VapiTechnicalConfig["questionType"],
    problemTitle: problem.title,
    problemDescription: problem.description,
  };

  // Start Vapi from a user click (required for browser audio/mic permissions)
  const handleStart = () => {
    start(interviewConfig);
  };

  // Timer — runs while call is active
  useEffect(() => {
    if (status !== "active") return;
    const timer = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const analyzeAndNavigate = async () => {
    const result = await evaluateTranscript(messages, interviewConfig);
    navigate("/analytics", { state: { result, config: interviewConfig } });
  };

  const handleEnd = () => {
    stop();
    if (messages.length >= 2) {
      analyzeAndNavigate();
    } else {
      navigate("/analytics", { state: { result: null } });
    }
  };

  // When Vapi ends the call naturally, auto-evaluate
  useEffect(() => {
    if (callEndedNaturally && messages.length >= 2 && !isAnalyzing) {
      analyzeAndNavigate();
    }
  }, [callEndedNaturally]); // eslint-disable-line react-hooks/exhaustive-deps

  // Analyzing overlay
  if (isAnalyzing) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-lg font-medium text-gray-300">Analyzing your interview...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
      </div>
    );
  }

  // Ready screen — user must click to grant mic/audio permissions
  if (status === "idle") {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Technical Interview</h1>
          <p className="text-gray-400 mb-2">{problem.title} — {problem.difficulty}</p>
          <p className="text-sm text-gray-500 mb-8">
            Your AI interviewer will guide you through the problem using voice. Make sure your microphone is ready.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
          >
            <Mic className="w-5 h-5" />
            <span>Start Interview</span>
          </motion.button>
        </div>
      </div>
    );
  }

  // Connecting overlay
  if (status === "connecting") {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-lg font-medium text-gray-300">Connecting to interviewer...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col p-4 overflow-hidden">
      {/* Toolbar */}
      <TechnicalToolbar
        role={role}
        difficulty={difficultyLabel}
        questionNumber={1}
        totalQuestions={1}
        time={time}
        mode="technical"
        onEnd={handleEnd}
      />

      {/* Split Layout */}
      <div className="flex-1 grid lg:grid-cols-[2fr_3fr] gap-4 min-h-0">
        {/* Left Panel — Prompt + Chat */}
        <div className="flex flex-col gap-4 min-h-0">
          <TechnicalPromptCard
            prompt={problem}
            questionNumber={1}
            totalQuestions={1}
          />
          <div className="flex-1 min-h-0">
            <TechnicalChatPanel
              messages={messages}
              status={status}
              isSpeaking={isSpeaking}
              isListening={isListening}
            />
          </div>
        </div>

        {/* Right Panel — Code Editor */}
        <div className="backdrop-blur-lg bg-gray-900/80 rounded-2xl border border-white/10 shadow-xl overflow-hidden flex flex-col min-h-0">
          <TechnicalCodeEditor problem={problem} />
        </div>
      </div>
    </div>
  );
}
