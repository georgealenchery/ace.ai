import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { RotateCcw, X, Send } from "lucide-react";
import { useInterview } from "../hooks/useInterview";
import type { InterviewConfig } from "../types/interview";
import { DashboardNavbar } from "./DashboardNavbar";

export function LiveInterview() {
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState(0);
  const [typedInput, setTypedInput] = useState("");

  const {
    messages,
    isLoading,
    status,
    result,
    error,
    startInterview,
    sendAnswer,
    resetInterview,
  } = useInterview();

  // Build config from router state
  const state = location.state as {
    role?: string;
    questionType?: string;
    difficulty?: number;
    strictness?: number;
    experienceLevel?: number;
    interviewer?: string;
  } | null;

  // Start interview on mount
  useEffect(() => {
    const config: InterviewConfig = {
      mode: "behavioral",
      questionType: "behavioral",
      role: state?.role ?? "backend",
      difficulty: state?.difficulty ?? 50,
      strictness: state?.strictness ?? 50,
      experienceLevel: state?.experienceLevel ?? 2,
      interviewer: state?.interviewer ?? "Cassidy",
    };
    startInterview(config);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Navigate to analytics when finished
  useEffect(() => {
    if (status === "finished" && result) {
      navigate("/analytics", { state: { result } });
    }
  }, [status, result, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSend = () => {
    if (!typedInput.trim() || isLoading) return;
    sendAnswer(typedInput);
    setTypedInput("");
  };

  const handleEndInterview = () => {
    navigate("/analytics", { state: { result } });
  };

  // Map messages to transcript format
  const transcript = messages.map((m) => ({
    speaker: m.role === "assistant" ? "AI" : "You",
    text: m.content,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <DashboardNavbar activeTab="Practice Interviews" variant="dark" compact />
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">{(state?.role ?? "Backend").charAt(0).toUpperCase() + (state?.role ?? "backend").slice(1)} Engineer Interview</h1>
            <p className="text-gray-400">Behavioral Assessment</p>
          </div>
          <div className="text-3xl font-mono">{formatTime(time)}</div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Main Interview Area */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Left - Interviewer */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-lg bg-white/5 rounded-2xl p-8 border border-white/10 shadow-xl"
          >
            <h3 className="text-sm font-medium text-gray-400 mb-4">Interviewer</h3>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <span className="text-6xl font-bold text-white">C</span>
                </div>
              </div>
              <h4 className="text-xl font-bold">Cassidy</h4>
              <p className="text-sm text-gray-400">Senior Technical Interviewer</p>
            </div>
          </motion.div>

          {/* Right - User */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-lg bg-white/5 rounded-2xl p-8 border border-white/10 shadow-xl"
          >
            <h3 className="text-sm font-medium text-gray-400 mb-4">You</h3>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                  <span className="text-6xl font-bold text-white">U</span>
                </div>
              </div>
              <div className="w-full h-20 bg-gray-800/50 rounded-xl flex items-center justify-center">
                <p className="text-gray-500">Type your response below...</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Transcript Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-lg bg-white/5 rounded-2xl p-6 border border-white/10 shadow-xl mb-6"
        >
          <h3 className="text-sm font-medium text-gray-400 mb-4">Live Transcript</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {transcript.length === 0 && isLoading && (
              <p className="text-gray-500">Loading first question...</p>
            )}
            {transcript.map((entry, index) => (
              <div key={index} className="flex gap-3">
                <span className={`font-semibold ${entry.speaker === "AI" ? "text-purple-400" : "text-cyan-400"}`}>
                  {entry.speaker}:
                </span>
                <p className="text-gray-300">{entry.text}</p>
              </div>
            ))}
            {isLoading && transcript.length > 0 && (
              <div className="flex gap-3">
                <span className="font-semibold text-purple-400">AI:</span>
                <p className="text-gray-500 animate-pulse">Thinking...</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Text Input */}
        <div className="mb-6 flex gap-3">
          <input
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your answer..."
            disabled={isLoading || status !== "running"}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={isLoading || !typedInput.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              resetInterview();
              setTime(0);
            }}
            className="p-4 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all"
          >
            <RotateCcw className="w-6 h-6" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEndInterview}
            className="px-6 py-4 rounded-full bg-red-500/20 backdrop-blur-lg border border-red-500/50 hover:bg-red-500/30 transition-all flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            <span>End Interview</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
