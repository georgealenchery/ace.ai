import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { MessageSquare } from "lucide-react";
import type { TranscriptMessage, CallStatus } from "../../hooks/useVapiInterview";
import { MicVisualizer } from "../MicVisualizer";

type TechnicalChatPanelProps = {
  messages: TranscriptMessage[];
  status: CallStatus;
  isSpeaking: boolean;
  isListening: boolean;
  volumeLevel: number;
};

export function TechnicalChatPanel({ messages, status, isSpeaking, isListening, volumeLevel }: TechnicalChatPanelProps) {
  const [showTypeInput, setShowTypeInput] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const statusDot = isSpeaking
    ? "bg-purple-400 animate-pulse"
    : isListening
      ? "bg-green-400 animate-pulse"
      : status === "connecting"
        ? "bg-blue-400 animate-pulse"
        : "bg-gray-600";

  const statusLabel = isSpeaking
    ? "AI Speaking..."
    : isListening
      ? "Listening..."
      : status === "connecting"
        ? "Connecting..."
        : status === "ended"
          ? "Interview ended"
          : "Ready";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex flex-col h-full backdrop-blur-lg bg-white/5 rounded-2xl border border-white/10 shadow-xl overflow-hidden"
    >
      {/* Panel Header with Status */}
      <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusDot}`} />
          <span className="text-xs font-medium text-gray-400">Live Conversation</span>
        </div>
        <div className="flex items-center gap-3">
          <MicVisualizer
            volumeLevel={volumeLevel}
            isListening={isListening}
            isSpeaking={isSpeaking}
          />
        </div>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="dark-scrollbar flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && status === "connecting" && (
          <p className="text-xs text-gray-500 animate-pulse">Connecting to interviewer...</p>
        )}
        {messages.length === 0 && status === "active" && (
          <p className="text-xs text-gray-500 animate-pulse">Waiting for interviewer...</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
              msg.role === "assistant"
                ? "bg-gradient-to-br from-purple-400 to-pink-400 text-white"
                : "bg-gradient-to-br from-blue-400 to-cyan-400 text-white"
            }`}>
              {msg.role === "assistant" ? "I" : "U"}
            </div>
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
              msg.role === "assistant"
                ? "bg-purple-500/10 border border-purple-500/20 text-gray-300"
                : "bg-blue-500/10 border border-blue-500/20 text-gray-300"
            }`}>
              <span className={`block text-[10px] font-semibold mb-1 ${
                msg.role === "assistant" ? "text-purple-400" : "text-cyan-400"
              }`}>
                {msg.role === "assistant" ? "Interviewer" : "You"}
              </span>
              {msg.text}
            </div>
          </div>
        ))}
        {isSpeaking && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold bg-gradient-to-br from-purple-400 to-pink-400 text-white">
              I
            </div>
            <div className="px-3 py-2 rounded-xl text-xs bg-purple-500/10 border border-purple-500/20 text-gray-500">
              <div className="flex items-center gap-1">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-purple-400 rounded-full"
                    animate={{ height: [4, 12, 4] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Type Input (conditional fallback) */}
      {showTypeInput && (
        <div className="px-4 py-2 border-t border-white/10">
          <p className="text-[10px] text-gray-500 mb-1">Voice is the primary input. Use text as a fallback only.</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type if voice isn't working..."
              disabled
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>
      )}

      {/* Input Controls */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowTypeInput((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-white/5 border border-white/20 text-gray-300 hover:bg-white/10 transition-all"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {showTypeInput ? "Hide Input" : "Type Response"}
        </motion.button>
      </div>
    </motion.div>
  );
}
