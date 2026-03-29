import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "motion/react";
import { RotateCcw, Play, FlaskConical, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { TechnicalProblem, Language } from "../../data/technicalProblems";

const LANGUAGE_LABELS: Record<Language, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
};

type OutputEntry = {
  type: "log" | "error" | "result" | "test-pass" | "test-fail";
  text: string;
};

function stripTypeAnnotations(tsCode: string): string {
  // Remove type annotations from TypeScript code to run as JavaScript
  // This is a simple approach — good enough for interview problems
  let code = tsCode;
  // Remove `: type` after parameters and variables (handles generics, arrays, etc.)
  code = code.replace(/:\s*[A-Za-z_][\w<>\[\],\s|&?]*(?=\s*[=,)\]{;])/g, "");
  // Remove `as type` casts
  code = code.replace(/\s+as\s+[A-Za-z_][\w<>\[\],\s|&?]*/g, "");
  // Remove angle bracket type assertions
  code = code.replace(/<[A-Za-z_][\w<>\[\],\s|&?]*>\s*(?=\()/g, "");
  // Remove interface/type declarations (entire blocks)
  code = code.replace(/^(interface|type)\s+\w+[\s\S]*?^}/gm, "");
  return code;
}

function executeJavaScript(
  code: string,
  testCases: TechnicalProblem["testCases"],
): OutputEntry[] {
  const outputs: OutputEntry[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  // Capture any console.log calls the user may have added
  console.log = (...args: unknown[]) => {
    outputs.push({
      type: "log",
      text: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "),
    });
  };
  console.error = (...args: unknown[]) => {
    outputs.push({
      type: "error",
      text: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "),
    });
  };
  console.warn = (...args: unknown[]) => {
    outputs.push({
      type: "log",
      text: "[warn] " + args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "),
    });
  };

  try {
    // Run the user's code, then auto-invoke the function with each example input
    for (const tc of testCases) {
      try {
        const runCode = `${code}\nreturn ${tc.call};`;
        const fn = new Function(runCode);
        const result = fn();
        const formatted = typeof result === "object" ? JSON.stringify(result) : String(result);
        outputs.push({
          type: "result",
          text: `${tc.call}  →  ${formatted}`,
        });
      } catch (err: unknown) {
        const error = err as Error;
        outputs.push({
          type: "error",
          text: `${tc.call}  →  ${error.name}: ${error.message}`,
        });
      }
    }
  } finally {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  }

  return outputs;
}

function runTestCases(
  code: string,
  testCases: TechnicalProblem["testCases"],
): OutputEntry[] {
  const outputs: OutputEntry[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  // Suppress console during test execution
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};

  try {
    // Define functions from the user's code, then run test calls
    for (const tc of testCases) {
      try {
        const testCode = `${code}\nreturn String(${tc.call});`;
        const fn = new Function(testCode);
        const result = String(fn());
        const expected = tc.expected;
        const passed = result === expected;
        outputs.push({
          type: passed ? "test-pass" : "test-fail",
          text: passed
            ? `PASS  Input: ${tc.input} => ${result}`
            : `FAIL  Input: ${tc.input} => Got ${result}, Expected ${expected}`,
        });
      } catch (err: unknown) {
        const error = err as Error;
        outputs.push({
          type: "test-fail",
          text: `ERROR  Input: ${tc.input} => ${error.message}`,
        });
      }
    }
  } finally {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  }

  return outputs;
}

type TechnicalCodeEditorProps = {
  problem: TechnicalProblem;
  onAllTestsPass?: () => void;
};

export function TechnicalCodeEditor({ problem, onAllTestsPass }: TechnicalCodeEditorProps) {
  const [language, setLanguage] = useState<Language>("javascript");
  const [code, setCode] = useState<string>(problem.starterCode.javascript);
  const [output, setOutput] = useState<OutputEntry[]>([]);
  const [showOutput, setShowOutput] = useState(false);

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    setCode(problem.starterCode[lang]);
  }, [problem]);

  function handleReset() {
    setCode(problem.starterCode[language]);
    setOutput([]);
  }

  function handleRunCode() {
    if (language === "python") {
      setOutput([{
        type: "error",
        text: "Python execution is not supported in the browser. Switch to JavaScript or TypeScript to run code locally.",
      }]);
      setShowOutput(true);
      return;
    }

    const execCode = language === "typescript" ? stripTypeAnnotations(code) : code;
    const results = executeJavaScript(execCode, problem.testCases);
    setOutput(results);
    setShowOutput(true);

    // If every result came back without errors, the solution works — notify parent
    const allPassed = results.length > 0 && results.every((r) => r.type !== "error");
    if (allPassed && onAllTestsPass) {
      onAllTestsPass();
    }
  }

  function handleRunTests() {
    if (language === "python") {
      setOutput([{
        type: "error",
        text: "Python test execution is not supported in the browser. Switch to JavaScript or TypeScript.",
      }]);
      setShowOutput(true);
      return;
    }

    const execCode = language === "typescript" ? stripTypeAnnotations(code) : code;
    const results = runTestCases(execCode, problem.testCases);
    setOutput(results);
    setShowOutput(true);
  }

  function handleClearOutput() {
    setOutput([]);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 border-b border-white/10 rounded-t-2xl">
        {/* Language Selector */}
        <div className="flex gap-1">
          {(Object.keys(problem.starterCode) as Language[]).map((lang) => (
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
            onClick={handleRunTests}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Run Tests
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRunCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            Run Code
          </motion.button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className={`${showOutput ? "flex-[7]" : "flex-1"} min-h-0 overflow-hidden`}>
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

      {/* Output Panel */}
      {showOutput && (
        <div className="flex-[3] min-h-0 flex flex-col border-t border-white/10 bg-gray-950">
          {/* Output Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400">Output</span>
              {output.some((o) => o.type === "test-pass" || o.type === "test-fail") && (
                <span className="text-[10px] text-gray-500">
                  {output.filter((o) => o.type === "test-pass").length}/{output.filter((o) => o.type === "test-pass" || o.type === "test-fail").length} passed
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearOutput}
                className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
                title="Clear Output"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowOutput(false)}
                className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
                title="Collapse Output"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Output Content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs space-y-1">
            {output.map((entry, i) => (
              <div
                key={i}
                className={
                  entry.type === "error"
                    ? "text-red-400"
                    : entry.type === "test-pass"
                      ? "text-emerald-400"
                      : entry.type === "test-fail"
                        ? "text-red-400"
                        : entry.type === "result"
                          ? "text-cyan-400"
                          : "text-green-400"
                }
              >
                <pre className="whitespace-pre-wrap">{entry.type === "test-pass" ? "\u2713 " : entry.type === "test-fail" ? "\u2717 " : ""}{entry.text}</pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapsed output toggle */}
      {!showOutput && output.length > 0 && (
        <button
          onClick={() => setShowOutput(true)}
          className="flex items-center justify-center gap-2 px-4 py-1.5 bg-gray-900/80 border-t border-white/10 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ChevronUp className="w-3 h-3" />
          Show Output ({output.length} {output.length === 1 ? "line" : "lines"})
        </button>
      )}
    </div>
  );
}
