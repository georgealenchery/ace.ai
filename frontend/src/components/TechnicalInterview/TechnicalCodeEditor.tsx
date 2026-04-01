import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Play, CheckCircle2, XCircle, Circle, Loader2 } from "lucide-react";
import type { CodingProblem } from "../../services/api";
import { executeCode, preloadPyodide, isPyodideReady } from "../../hooks/useCodeExecution";
import type { TestResult } from "../../hooks/useCodeExecution";

// Monaco language identifier for each selectable language
const LANGUAGE_MAP: Record<string, string> = {
  "JavaScript": "javascript",
  "TypeScript": "typescript",
  "Node.js":    "javascript",
  "Python":     "python",
  "Java":       "java",
  "C++":        "cpp",
  "Bash":       "shell",
};

// File extension shown in the editor tab header
const FILE_EXT_MAP: Record<string, string> = {
  "JavaScript": "js",
  "TypeScript": "ts",
  "Node.js":    "js",
  "Python":     "py",
  "Java":       "java",
  "C++":        "cpp",
  "Bash":       "sh",
};

function formatValue(val: string): string {
  try {
    return JSON.stringify(JSON.parse(val), null, 0);
  } catch {
    return val;
  }
}

type TechnicalCodeEditorProps = {
  problem: CodingProblem | null;
  questionIndex: number;
  language?: string;
  disabled?: boolean;
  onAllTestsPassed: (passed: boolean) => void;
};

export function TechnicalCodeEditor({
  problem,
  questionIndex,
  language = "JavaScript",
  disabled = false,
  onAllTestsPassed,
}: TechnicalCodeEditorProps) {
  const [code, setCode] = useState<string>("");
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  // Track whether Pyodide is loading so we can show a hint
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const prevIndexRef = useRef(questionIndex);

  const monacoLanguage = LANGUAGE_MAP[language] ?? "javascript";
  const fileExt = FILE_EXT_MAP[language] ?? "js";

  // Pre-warm Pyodide as soon as Python is the selected language
  useEffect(() => {
    if (language === "Python" && !isPyodideReady()) {
      setPyodideLoading(true);
      preloadPyodide();
      // Poll until ready (Pyodide can take 5-7s on first load)
      const interval = setInterval(() => {
        if (isPyodideReady()) {
          setPyodideLoading(false);
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    } else {
      setPyodideLoading(false);
    }
  }, [language]);

  // Reset editor when question or language changes
  useEffect(() => {
    if (prevIndexRef.current !== questionIndex) {
      prevIndexRef.current = questionIndex;
    }
    setResults(null);
    setHasRun(false);
    setIsRunning(false);
    setCode(problem?.functionSignature ?? "");
    onAllTestsPassed(false);
  }, [questionIndex, problem, language]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRunTests = async () => {
    if (!problem || disabled || isRunning) return;
    setIsRunning(true);
    try {
      const testResults = await executeCode(language, code, problem);
      setResults(testResults);
      setHasRun(true);
      const allPassed = testResults.every((r) => r.passed);
      console.log("Results:", testResults);
      onAllTestsPassed(allPassed);
    } catch (err) {
      console.error("Execution failed:", err);
      const errMsg = err instanceof Error ? err.message : "Execution failed";
      const fallback: TestResult[] = problem.testCases.map((tc) => ({
        passed: false,
        actual: "Error",
        expected: JSON.stringify(tc.expectedOutput),
        error: errMsg,
      }));
      setResults(fallback);
      setHasRun(true);
      onAllTestsPassed(false);
    } finally {
      setIsRunning(false);
    }
  };

  const allPassed = hasRun && results?.every((r) => r.passed);
  const passCount = results?.filter((r) => r.passed).length ?? 0;
  const totalCount = problem?.testCases.length ?? 0;

  const runButtonLabel = isRunning
    ? "Running..."
    : pyodideLoading && language === "Python"
      ? "Loading Python..."
      : "Run Tests";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 border-b border-white/10 rounded-t-2xl shrink-0">
        <div className="flex items-center gap-2 text-gray-300 text-xs font-medium">
          <span className="text-blue-400 font-mono">
            {problem?.functionName ?? "solution"}.{fileExt}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-gray-400">
            {language}
          </span>
          {hasRun && (
            <span className={allPassed ? "text-green-400" : "text-yellow-400"}>
              {passCount}/{totalCount} tests passed
            </span>
          )}
        </div>

        <button
          onClick={handleRunTests}
          disabled={!problem || disabled || isRunning || (pyodideLoading && language === "Python")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all"
        >
          {isRunning || (pyodideLoading && language === "Python") ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-white" />
          )}
          {runButtonLabel}
        </button>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0 overflow-hidden" style={{ minHeight: "200px" }}>
        <Editor
          height="100%"
          language={monacoLanguage}
          value={code}
          onChange={(val) => { if (!disabled) setCode(val ?? ""); }}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            wordWrap: "off",
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            tabSize: monacoLanguage === "python" ? 4 : 2,
            folding: false,
            lineDecorationsWidth: 4,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: { vertical: "auto", horizontal: "auto" },
            readOnly: disabled,
          }}
        />
      </div>

      {/* Test Results Panel */}
      <div className="dark-scrollbar shrink-0 border-t border-white/10 bg-gray-900/80 max-h-52 overflow-y-auto">
        {isRunning && (
          <div className="px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Running code against test cases…
          </div>
        )}

        {!isRunning && !hasRun && (
          <div className="px-4 py-3 text-xs text-gray-500 flex items-center gap-2">
            <Circle className="w-3.5 h-3.5" />
            {pyodideLoading && language === "Python"
              ? "Loading Python runtime (one-time, ~5s)…"
              : "Run your code to see test results"}
          </div>
        )}

        {!isRunning && hasRun && results && (
          <div className="divide-y divide-white/5">
            {results.map((result, i) => {
              const tc = problem?.testCases[i];
              return (
                <div
                  key={i}
                  className={`px-4 py-2.5 text-xs ${result.passed ? "bg-green-900/10" : "bg-red-900/10"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {result.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                    <span
                      className={
                        result.passed ? "text-green-400 font-semibold" : "text-red-400 font-semibold"
                      }
                    >
                      Test {i + 1}
                    </span>
                    {tc?.description && (
                      <span className="text-gray-500">— {tc.description}</span>
                    )}
                  </div>
                  <div className="ml-5 space-y-0.5 font-mono text-gray-400">
                    <div>
                      <span className="text-gray-500">input:&nbsp;&nbsp;&nbsp;</span>
                      <span className="text-gray-200">{JSON.stringify(tc?.input)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">expected: </span>
                      <span className="text-gray-200">{formatValue(result.expected)}</span>
                    </div>
                    {!result.passed && (
                      <div>
                        <span className="text-gray-500">actual:&nbsp;&nbsp; </span>
                        <span className={result.error ? "text-red-300" : "text-yellow-300"}>
                          {result.error
                            ? `Error: ${result.error}`
                            : formatValue(result.actual)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
