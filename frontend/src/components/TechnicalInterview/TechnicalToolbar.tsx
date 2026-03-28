import { motion } from "motion/react";
import { X } from "lucide-react";

type TechnicalToolbarProps = {
  role: string;
  difficulty: string;
  questionNumber: number;
  totalQuestions: number;
  time: number;
  mode: "technical" | "hybrid";
  onEnd: () => void;
};

export function TechnicalToolbar({
  role,
  difficulty,
  questionNumber,
  totalQuestions,
  time,
  mode,
  onEnd,
}: TechnicalToolbarProps) {
  const mins = Math.floor(time / 60).toString().padStart(2, "0");
  const secs = (time % 60).toString().padStart(2, "0");

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">
              {mode === "hybrid" ? "Hybrid Interview" : "Technical Interview"}
            </h1>
            {mode === "hybrid" && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300">
                Technical Round
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {role} · {difficulty} · Q{questionNumber}/{totalQuestions}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-2xl font-mono text-white tabular-nums">
          {mins}:{secs}
        </span>

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
  );
}
