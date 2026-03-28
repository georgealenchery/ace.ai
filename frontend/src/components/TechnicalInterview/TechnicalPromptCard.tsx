import { motion } from "motion/react";

type Difficulty = "Easy" | "Medium" | "Hard";

type Example = {
  input: string;
  output: string;
  explanation?: string;
};

type Prompt = {
  title: string;
  difficulty: Difficulty;
  description: string;
  constraints: string[];
  examples: Example[];
};

type TechnicalPromptCardProps = {
  prompt: Prompt;
  questionNumber: number;
  totalQuestions: number;
};

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  Medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  Hard: "text-red-400 bg-red-500/10 border-red-500/30",
};

export function TechnicalPromptCard({ prompt, questionNumber, totalQuestions }: TechnicalPromptCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-lg bg-white/5 rounded-2xl border border-white/10 shadow-xl overflow-hidden"
    >
      {/* Prompt Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400">
            Question {questionNumber}/{totalQuestions}
          </span>
          <span className="text-white font-semibold">{prompt.title}</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${DIFFICULTY_STYLES[prompt.difficulty]}`}>
          {prompt.difficulty}
        </span>
      </div>

      {/* Prompt Body */}
      <div className="px-5 py-4 space-y-4 max-h-64 overflow-y-auto">
        {/* Description */}
        <p className="text-sm text-gray-300 leading-relaxed">{prompt.description}</p>

        {/* Examples */}
        {prompt.examples.map((ex, i) => (
          <div key={i} className="bg-gray-800/60 rounded-xl p-3 space-y-1.5 border border-white/5">
            <p className="text-xs font-semibold text-gray-400">Example {i + 1}</p>
            <p className="text-xs font-mono text-gray-300">
              <span className="text-gray-500">Input: </span>{ex.input}
            </p>
            <p className="text-xs font-mono text-gray-300">
              <span className="text-gray-500">Output: </span>{ex.output}
            </p>
            {ex.explanation && (
              <p className="text-xs text-gray-400">
                <span className="text-gray-500">Explanation: </span>{ex.explanation}
              </p>
            )}
          </div>
        ))}

        {/* Constraints */}
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">Constraints</p>
          <ul className="space-y-1">
            {prompt.constraints.map((c, i) => (
              <li key={i} className="text-xs font-mono text-gray-400 flex items-start gap-2">
                <span className="text-gray-600 mt-0.5">•</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
