import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Mic } from "lucide-react";
import { TechnicalToolbar } from "./TechnicalToolbar";
import { TechnicalPromptCard } from "./TechnicalPromptCard";
import { TechnicalChatPanel } from "./TechnicalChatPanel";
import { TechnicalCodeEditor } from "./TechnicalCodeEditor";
import { useVapiTechnicalInterview } from "../../hooks/useVapiTechnicalInterview";
import type { VapiTechnicalConfig } from "../../hooks/useVapiTechnicalInterview";
import { generateInterviewQuestions } from "../../services/api";
import { vapi } from "../../lib/vapi";
import type { CodingProblem } from "../../services/api";

const INTERVIEW_TIMER: Record<string, number> = {
  easy:   1200, // 20 minutes
  medium: 1500, // 25 minutes
  hard:   1800, // 30 minutes
};

const FALLBACK_PROBLEMS: CodingProblem[] = [
  {
    prompt: "Write a function that takes an array of numbers and returns the two numbers that add up to the given target. Return them as an array in the order they appear.",
    functionName: "twoSum",
    functionSignature: "function twoSum(nums, target) {\n  // Your implementation here\n}",
    testCases: [
      { input: [[2, 7, 11, 15], 9], expectedOutput: [2, 7] },
      { input: [[3, 2, 4], 6], expectedOutput: [2, 4] },
      { input: [[1, 5, 3, 7], 8], expectedOutput: [1, 7] },
    ],
  },
  {
    prompt: "Write a function that takes a string and returns true if it is a valid palindrome (ignoring non-alphanumeric characters and case), false otherwise.",
    functionName: "isPalindrome",
    functionSignature: "function isPalindrome(s) {\n  // Your implementation here\n}",
    testCases: [
      { input: ["A man, a plan, a canal: Panama"], expectedOutput: true },
      { input: ["race a car"], expectedOutput: false },
      { input: ["Was it a car or a cat I saw?"], expectedOutput: true },
    ],
  },
  {
    prompt: "Write a function that takes an array of integers and returns the maximum sum of any contiguous subarray.",
    functionName: "maxSubarraySum",
    functionSignature: "function maxSubarraySum(nums) {\n  // Your implementation here\n}",
    testCases: [
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expectedOutput: 6 },
      { input: [[1]], expectedOutput: 1 },
      { input: [[5, 4, -1, 7, 8]], expectedOutput: 23 },
    ],
  },
];

export function TechnicalInterviewLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  // Track which problems have all tests passing
  const [passed, setPassed] = useState<boolean[]>([false, false, false]);

  const {
    status,
    isSpeaking,
    isListening,
    isMuted,
    messages,
    isAnalyzing,
    callEndedNaturally,
    start,
    stop,
    toggleMute,
    evaluateTranscript,
  } = useVapiTechnicalInterview();

  const state = location.state as {
    role?: string;
    questionType?: string;
    language?: string;
    difficulty?: number;
    strictness?: number;
    experienceLevel?: number;
    interviewer?: string;
  } | null;

  const role = state?.role ?? "frontend";
  const language = state?.language ?? "JavaScript";
  const interviewer = state?.interviewer;
  const difficultyValue = state?.difficulty ?? 50;
  const experienceLevelValue = state?.experienceLevel ?? 50;

  const difficultyLabel = difficultyValue <= 30 ? "easy" : difficultyValue <= 60 ? "medium" : "hard";
  const difficultyDisplay = difficultyLabel.charAt(0).toUpperCase() + difficultyLabel.slice(1);
  const level = experienceLevelValue <= 30 ? "junior" : experienceLevelValue <= 60 ? "mid" : "senior";

  const totalTime = INTERVIEW_TIMER[difficultyLabel] ?? 1500;
  const [timeLeft, setTimeLeft] = useState(totalTime);

  // Refs that prevent each vapi.say() warning from firing more than once
  const warned2MinRef = useRef(false);
  const warned0MinRef = useRef(false);

  // Fetch AI-generated coding problems once on mount — do NOT regenerate mid-session
  useEffect(() => {
    setQuestionsLoading(true);
    console.log("Role:", role);
    console.log("Language:", language);
    generateInterviewQuestions(role, difficultyLabel, level, language)
      .then((ps) => {
        console.log("Generated coding problems:", ps);
        setProblems(ps);
      })
      .catch(() => {
        console.warn("Failed to generate problems, using fallback");
        setProblems(FALLBACK_PROBLEMS);
      })
      .finally(() => setQuestionsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const interviewConfig: VapiTechnicalConfig = {
    role,
    difficulty: difficultyValue,
    experienceLevel: experienceLevelValue,
    strictness: state?.strictness ?? 50,
    questionType: (state?.questionType ?? "technical") as VapiTechnicalConfig["questionType"],
    // Pass problem prompts as the voice questions so the interviewer reads them aloud
    questions: problems.map((p) => p.prompt),
    level,
    interviewer,
  };

  const handleStart = () => {
    start(interviewConfig);
  };

  // Countdown — ticks once per second while the call is active
  useEffect(() => {
    if (status !== "active" || timeLeft <= 0) return;
    const timer = setTimeout(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, status]);

  // Timer warnings — vapi.say() at 2 min, then auto-end with goodbye at 0
  useEffect(() => {
    if (status !== "active") return;

    if (timeLeft === 120 && !warned2MinRef.current) {
      warned2MinRef.current = true;
      try {
        vapi.say("We've got about two minutes left. Can you walk me through your current solution and explain your approach?");
      } catch {}
    }

    if (timeLeft === 0 && !warned0MinRef.current) {
      warned0MinRef.current = true;
      try {
        vapi.say("Time's up. Let's go over what you've got. Thanks for working through this.");
      } catch {}
      setTimeout(() => handleEnd(), 3000);
    }
  }, [timeLeft, status]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleTestResults = (allPassed: boolean) => {
    setPassed((prev) => {
      const updated = [...prev];
      updated[currentQuestion] = allPassed;
      return updated;
    });
  };

  const handleNext = () => {
    if (passed[currentQuestion]) {
      setCurrentQuestion((q) => Math.min(problems.length - 1, q + 1));
    }
  };

  const handlePrev = () => {
    setCurrentQuestion((q) => Math.max(0, q - 1));
  };

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
          <p className="text-gray-400 mb-2 capitalize">{role} · {difficultyDisplay} · {level} · {language}</p>
          <p className="text-sm text-gray-500 mb-8">
            {questionsLoading
              ? "Preparing your coding problems..."
              : `You'll solve 3 coding problems in ${totalTime / 60} minutes. Pass all tests to advance to the next problem. Your AI interviewer will guide you through each one.`}
          </p>
          {questionsLoading ? (
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
            >
              <Mic className="w-5 h-5" />
              <span>Start Interview</span>
            </motion.button>
          )}
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

  const currentProblem = problems[currentQuestion] ?? null;
  const nextLocked = !passed[currentQuestion];

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col p-4 overflow-hidden">
      {/* Toolbar */}
      <TechnicalToolbar
        role={role}
        difficulty={difficultyDisplay}
        level={level}
        questionNumber={currentQuestion + 1}
        totalQuestions={problems.length || 3}
        timeLeft={timeLeft}
        totalTime={totalTime}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onEnd={handleEnd}
      />

      {/* Split Layout */}
      <div className="flex-1 grid lg:grid-cols-[2fr_3fr] gap-4 min-h-0">
        {/* Left Panel — Problem Prompt + Chat */}
        <div className="flex flex-col gap-4 min-h-0">
          <TechnicalPromptCard
            problem={currentProblem}
            questionNumber={currentQuestion + 1}
            totalQuestions={problems.length || 3}
            passed={passed[currentQuestion]}
            onPrev={handlePrev}
            onNext={handleNext}
            nextLocked={nextLocked}
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
          <TechnicalCodeEditor
            problem={currentProblem}
            questionIndex={currentQuestion}
            language={language}
            onAllTestsPassed={handleTestResults}
          />
        </div>
      </div>
    </div>
  );
}
