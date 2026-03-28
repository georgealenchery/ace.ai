import { useState } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "motion/react";
import { RotateCcw, Play } from "lucide-react";

type Language = "javascript" | "typescript" | "python";

const STARTER_CODE: Record<Language, string> = {
  javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Your solution here

};`,
  typescript: `function twoSum(nums: number[], target: number): number[] {
  // Your solution here

};`,
  python: `def two_sum(nums: list[int], target: int) -> list[int]:
    # Your solution here
    pass`,
};

const LANGUAGE_LABELS: Record<Language, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
};

export function TechnicalCodeEditor() {
  const [language, setLanguage] = useState<Language>("javascript");
  const [code, setCode] = useState<string>(STARTER_CODE.javascript);

  function handleLanguageChange(lang: Language) {
    setLanguage(lang);
    setCode(STARTER_CODE[lang]);
  }

  function handleReset() {
    setCode(STARTER_CODE[language]);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 border-b border-white/10 rounded-t-2xl">
        {/* Language Selector */}
        <div className="flex gap-1">
          {(Object.keys(STARTER_CODE) as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                language === lang
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            Run Code
          </motion.button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0 rounded-b-2xl overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(val) => setCode(val ?? "")}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            renderLineHighlight: "all",
            padding: { top: 16, bottom: 16 },
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            tabSize: language === "python" ? 4 : 2,
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}
