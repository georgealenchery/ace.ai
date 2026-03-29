import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Mic, MicOff, X } from "lucide-react";
import {
  useVapiInterview,
  getDifficultyLabel,
  getExperienceLabel,
  getStrictnessLabel,
} from "../hooks/useVapiInterview";
import type { VapiInterviewConfig } from "../hooks/useVapiInterview";

export function VapiInterviewPanel() {
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
  } = useVapiInterview();

  const state = location.state as {
    role?: string;
    questionType?: string;
    difficulty?: number;
    strictness?: number;
    experienceLevel?: number;
    interviewer?: string;
  } | null;

  const interviewer = state?.interviewer ?? "Cassidy";
  const role = state?.role ?? "fullstack";
  const questionType = (state?.questionType ?? "behavioral") as VapiInterviewConfig["questionType"];
  const difficulty = state?.difficulty ?? 50;
  const experienceLevel = state?.experienceLevel ?? 50;
  const strictness = state?.strictness ?? 50;
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const interviewConfig: VapiInterviewConfig = {
    role,
    difficulty,
    experienceLevel,
    strictness,
    questionType,
  };

  // Timer — runs while call is active
  useEffect(() => {
    if (status !== "active") return;
    const timer = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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

  const statusLabel = isAnalyzing
    ? "Analyzing your interview…"
    : isSpeaking
      ? "AI is speaking…"
      : isListening
        ? "Listening to you…"
        : status === "connecting"
          ? "Connecting…"
          : status === "ended"
            ? "Interview ended"
            : "Ready to start";

  const statusColor = isAnalyzing
    ? "#a855f7"
    : status === "active"
      ? isSpeaking ? "#f59e0b" : "#22c55e"
      : status === "connecting" ? "#3b82f6" : "#9ca3af";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">{roleLabel} Engineer Interview</h1>
            <p className="text-gray-400">Voice Assessment</p>
          </div>
          <div className="text-3xl font-mono">{formatTime(time)}</div>
        </div>

        {/* Settings Summary */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300">{roleLabel}</span>
          <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300">{questionType.charAt(0).toUpperCase() + questionType.slice(1)}</span>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">{getDifficultyLabel(difficulty)} Difficulty</span>
          <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">{getExperienceLabel(experienceLevel)}</span>
          <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300">{getStrictnessLabel(strictness)} Strictness</span>
        </div>

        {/* Status Bar */}
        <div className="mb-6 flex items-center gap-3 backdrop-blur-lg bg-white/5 rounded-xl px-5 py-3 border border-white/10">
          <span
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: statusColor }}
          />
          <span className="text-sm font-medium text-gray-300">{statusLabel}</span>
        </div>

        {/* Interview Area */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Interviewer */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-lg bg-white/5 rounded-2xl p-8 border border-white/10 shadow-xl"
          >
            <h3 className="text-sm font-medium text-gray-400 mb-4">Interviewer</h3>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div
                  className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center transition-shadow duration-300"
                  style={isSpeaking ? { boxShadow: "0 0 40px rgba(168,85,247,0.5)" } : {}}
                >
                  <span className="text-6xl font-bold text-white">{interviewer.charAt(0)}</span>
                </div>
              </div>
              <h4 className="text-xl font-bold">{interviewer}</h4>
              <p className="text-sm text-gray-400">Senior Technical Interviewer</p>
              {isSpeaking && (
                <div className="mt-3 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-purple-400 rounded-full"
                      animate={{ height: [8, 20, 8] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* User */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-lg bg-white/5 rounded-2xl p-8 border border-white/10 shadow-xl"
          >
            <h3 className="text-sm font-medium text-gray-400 mb-4">You</h3>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div
                  className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center transition-shadow duration-300"
                  style={isListening ? { boxShadow: "0 0 40px rgba(59,130,246,0.5)" } : {}}
                >
                  <span className="text-6xl font-bold text-white">U</span>
                </div>
              </div>
              <h4 className="text-xl font-bold">You</h4>
              <p className="text-sm text-gray-400">
                {isListening ? "Your turn to speak" : "Waiting…"}
              </p>
              {isListening && (
                <div className="mt-3 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-blue-400 rounded-full"
                      animate={{ height: [8, 16, 8] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Transcript */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-lg bg-white/5 rounded-2xl p-6 border border-white/10 shadow-xl mb-6"
        >
          <h3 className="text-sm font-medium text-gray-400 mb-4">Live Transcript</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {messages.length === 0 && status !== "active" && (
              <p className="text-gray-500">Click Start to begin the interview…</p>
            )}
            {messages.length === 0 && status === "active" && (
              <p className="text-gray-500 animate-pulse">Waiting for assistant…</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="flex gap-3">
                <span className={`font-semibold shrink-0 ${msg.role === "assistant" ? "text-purple-400" : "text-cyan-400"}`}>
                  {msg.role === "assistant" ? "AI" : "You"}:
                </span>
                <p className="text-gray-300">{msg.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {isAnalyzing ? (
            <div className="px-8 py-4 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing your interview…</span>
            </div>
          ) : status === "idle" || status === "ended" ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => start(interviewConfig)}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Mic className="w-5 h-5" />
              <span>Start Interview</span>
            </motion.button>
          ) : status === "connecting" ? (
            <div className="px-8 py-4 rounded-full bg-white/10 border border-white/20 text-gray-400 flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span>Connecting…</span>
            </div>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stop}
                className="p-4 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all"
                title="Mute / Stop"
              >
                <MicOff className="w-6 h-6" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEnd}
                className="px-6 py-4 rounded-full bg-red-500/20 backdrop-blur-lg border border-red-500/50 hover:bg-red-500/30 transition-all flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                <span>End Interview</span>
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
