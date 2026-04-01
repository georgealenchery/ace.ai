import { motion } from "motion/react";
import { Mic, MicOff, X } from "lucide-react";

type TechnicalToolbarProps = {
  role: string;
  difficulty: string;
  level: string;
  questionNumber: number;
  totalQuestions: number;
  timeLeft: number;
  totalTime: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onEnd: () => void;
};

export function TechnicalToolbar({
  role,
  difficulty,
  level,
  questionNumber,
  totalQuestions,
  timeLeft,
  totalTime,
  isMuted,
  onToggleMute,
  onEnd,
}: TechnicalToolbarProps) {
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");

  // Absolute-threshold colours + pulse when time is low
  const timerColor =
    timeLeft <= 120 ? "text-red-400 animate-pulse" :
    timeLeft <= 300 ? "text-amber-400 animate-pulse" :
    "text-white";

  const elapsed = totalTime - timeLeft;
  const progressPct = totalTime > 0 ? Math.min((elapsed / totalTime) * 100, 100) : 0;

  const bannerText =
    timeLeft <= 120 ? "Under 2 minutes remaining" :
    timeLeft <= 300 ? "5 minutes remaining — start wrapping up your solution" :
    null;

  const bannerColor = timeLeft <= 120
    ? "bg-red-500/20 border-red-500/30 text-red-300"
    : "bg-amber-500/20 border-amber-500/30 text-amber-300";

  return (
    <div className="mb-4">
      {/* Main toolbar row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Technical Interview</h1>
            <p className="text-sm text-gray-400 capitalize">
              {role} · {difficulty} · {level} · Q{questionNumber}/{totalQuestions}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={`text-2xl font-mono tabular-nums transition-colors duration-500 ${timerColor}`}>
            {mins}:{secs}
          </span>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleMute}
            className="p-2 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all"
            title={isMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-white" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEnd}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 backdrop-blur-lg border border-red-500/50 hover:bg-red-500/30 transition-all text-sm text-white"
          >
            <X className="w-4 h-4" />
            End Interview
          </motion.button>
        </div>
      </div>

      {/* Warning banner */}
      {bannerText && (
        <div className={`mt-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${bannerColor}`}>
          {bannerText}
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 rounded-full"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
