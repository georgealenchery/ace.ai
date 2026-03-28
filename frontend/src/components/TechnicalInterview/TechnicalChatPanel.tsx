import { useState } from "react";
import { motion } from "motion/react";
import { Mic, MicOff, MessageSquare } from "lucide-react";

type TranscriptEntry = {
  speaker: "AI" | "You";
  text: string;
};

type TechnicalChatPanelProps = {
  transcript: TranscriptEntry[];
  isAISpeaking: boolean;
};

export function TechnicalChatPanel({ transcript, isAISpeaking }: TechnicalChatPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [typedInput, setTypedInput] = useState("");

  function handleSend() {
    if (!typedInput.trim()) return;
    // TODO: wire to useInterview sendAnswer
    setTypedInput("");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex flex-col backdrop-blur-lg bg-white/5 rounded-2xl border border-white/10 shadow-xl overflow-hidden"
    >
      {/* Panel Header */}
      <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isAISpeaking ? "bg-purple-400 animate-pulse" : "bg-gray-600"}`} />
        <span className="text-xs font-medium text-gray-400">Live Conversation</span>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {transcript.map((entry, i) => (
          <div key={i} className={`flex gap-2.5 ${entry.speaker === "You" ? "flex-row-reverse" : ""}`}>
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
              entry.speaker === "AI"
                ? "bg-gradient-to-br from-purple-400 to-pink-400 text-white"
                : "bg-gradient-to-br from-blue-400 to-cyan-400 text-white"
            }`}>
              {entry.speaker === "AI" ? "C" : "U"}
            </div>
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
              entry.speaker === "AI"
                ? "bg-purple-500/10 border border-purple-500/20 text-gray-300"
                : "bg-blue-500/10 border border-blue-500/20 text-gray-300"
            }`}>
              <span className={`block text-[10px] font-semibold mb-1 ${
                entry.speaker === "AI" ? "text-purple-400" : "text-cyan-400"
              }`}>
                {entry.speaker === "AI" ? "Cassidy" : "You"}
              </span>
              {entry.text}
            </div>
          </div>
        ))}
      </div>

      {/* Type Input (conditional) */}
      {showTypeInput && (
        <div className="px-4 py-2 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Explain your approach..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
          <button
            onClick={handleSend}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors font-medium"
          >
            Send
          </button>
        </div>
      )}

      {/* Voice Controls */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsRecording((r) => !r)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all border ${
            isRecording
              ? "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
              : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
          }`}
        >
          {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          {isRecording ? "Stop Speaking" : "Start Speaking"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowTypeInput((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-white/5 border border-white/20 text-gray-300 hover:bg-white/10 transition-all"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {showTypeInput ? "Hide Input" : "Type Instead"}
        </motion.button>
      </div>
    </motion.div>
  );
}
