import { motion } from "motion/react";
import { X } from "lucide-react";

type TechnicalToolbarProps = {
  role: string;
  difficulty: string;
  questionNumber: number;
  totalQuestions: number;
  time: number;
  onEnd: () => void;
};

export function TechnicalToolbar({
  role,
  difficulty,
  questionNumber,
  totalQuestions,
  time,
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
              Technical Interview
            </h1>
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
