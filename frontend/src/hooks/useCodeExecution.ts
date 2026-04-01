import { apiFetch } from "../services/auth";
import type { CodingProblem, TestCase } from "../services/api";

// ── Types ──────────────────────────────────────────────────────────────────

export interface TestResult {
  passed: boolean;
  actual: string;
  expected: string;
  error?: string;
}

// ── TypeScript type-stripping transpiler ──────────────────────────────────
// Handles the common TypeScript patterns found in interview code.
// Not a full compiler — edge cases fall through as runtime errors.

function stripTypeScript(code: string): string {
  let out = code;

  // Remove `import type` statements
  out = out.replace(/^import\s+type\s+[^;]+;\s*$/gm, "");

  // Remove standalone interface declarations
  out = out.replace(/\binterface\s+\w+(\s+extends\s+[\w,\s<>]+)?\s*\{[^}]*\}/gs, "");

  // Remove type alias declarations: type Foo = ...;
  out = out.replace(/\btype\s+\w+(\s*<[^>]*>)?\s*=\s*[^;]+;/g, "");

  // Remove class access modifiers (private, public, protected, readonly)
  out = out.replace(/\b(private|public|protected|readonly|abstract|override)\s+(?=\w)/g, "");

  // Remove generic type parameters from function/class declarations
  // Only removes <T>, <T, U>, <T extends U> — avoids < in comparisons
  out = out.replace(/<([A-Z][A-Za-z0-9\s,]*(?:\s+extends\s+[A-Za-z0-9<>\[\]|&\s,]+)?)>/g, "");

  // Remove return type annotations:  ): ReturnType {  or  ): ReturnType\n
  out = out.replace(/\)\s*:\s*[A-Za-z][A-Za-z0-9<>\[\]|&\s,.?]*(?=\s*[{=\n])/g, ")");

  // Remove parameter type annotations:  param: Type  or  param?: Type
  out = out.replace(/(\b\w+)\s*\??\s*:\s*[A-Za-z][A-Za-z0-9<>\[\]|&\s,.?]*(?=[,)=\n])/g, "$1");

  // Remove `as Type` assertions
  out = out.replace(/\s+as\s+[A-Za-z][A-Za-z0-9<>\[\]|&\s,.?]*(?=[;,)}\n\s])/g, "");

  // Remove non-null assertions: value!.prop → value.prop
  out = out.replace(/(\w)!(?=[.\[])/g, "$1");

  return out;
}

// ── Pyodide loader (CDN, singleton) ───────────────────────────────────────

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: {
    set: (key: string, value: unknown) => void;
  };
}

let _pyodide: PyodideInterface | null = null;
let _pyodidePromise: Promise<PyodideInterface> | null = null;

export function isPyodideReady(): boolean {
  return _pyodide !== null;
}

export function preloadPyodide(): void {
  if (_pyodide || _pyodidePromise) return;
  _pyodidePromise = _loadPyodide();
  _pyodidePromise.then((p) => { _pyodide = p; }).catch(() => {});
}

async function _loadPyodide(): Promise<PyodideInterface> {
  // Inject the Pyodide script tag if not already present
  if (!(window as Record<string, unknown>)["loadPyodide"]) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Pyodide script"));
      document.head.appendChild(script);
    });
  }

  const instance = await (window as Record<string, unknown>)["loadPyodide"] as (opts: Record<string, string>) => Promise<PyodideInterface>;
  return instance({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
  });
}

async function getPyodide(): Promise<PyodideInterface> {
  if (_pyodide) return _pyodide;
  if (!_pyodidePromise) _pyodidePromise = _loadPyodide();
  _pyodide = await _pyodidePromise;
  return _pyodide;
}

// ── Deep equality with float tolerance ───────────────────────────────────
// Handles: numbers (exact for ints, 1e-6 tolerance for floats), arrays, strings

function deepEqual(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number") {
    if (Number.isInteger(a) && Number.isInteger(b)) return a === b;
    return Math.abs(a - b) < 1e-6;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object" && typeof b === "object" && a !== null && b !== null) {
    const ka = Object.keys(a as object).sort();
    const kb = Object.keys(b as object).sort();
    if (ka.join() !== kb.join()) return false;
    return ka.every((k) =>
      deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
    );
  }
  return a === b;
}

// ── JS / Node.js executor (new Function sandbox) ─────────────────────────

function runJavaScript(
  code: string,
  functionName: string,
  testCases: TestCase[],
): TestResult[] {
  return testCases.map((tc) => {
    const expected = JSON.stringify(tc.expectedOutput);
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(`${code}; return ${functionName};`)() as (...args: unknown[]) => unknown;
      const result = fn(...tc.input);
      const passed = deepEqual(result, tc.expectedOutput);
      return { passed, actual: JSON.stringify(result), expected };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return { passed: false, actual: "Error", expected, error };
    }
  });
}

// ── TypeScript executor (strip types → JS sandbox) ────────────────────────

function runTypeScript(
  code: string,
  functionName: string,
  testCases: TestCase[],
): TestResult[] {
  const stripped = stripTypeScript(code);
  return runJavaScript(stripped, functionName, testCases);
}

// ── Python executor (Pyodide WASM) ────────────────────────────────────────

async function runPython(
  code: string,
  functionName: string,
  testCases: TestCase[],
): Promise<TestResult[]> {
  const pyodide = await getPyodide();

  // Define the user's function in the Python environment
  try {
    await pyodide.runPythonAsync(code);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return testCases.map((tc) => ({
      passed: false,
      actual: "Error",
      expected: JSON.stringify(tc.expectedOutput),
      error,
    }));
  }

  // Run each test case via JSON round-trip to avoid PyProxy conversion issues
  const results: TestResult[] = [];

  for (const tc of testCases) {
    const expected = JSON.stringify(tc.expectedOutput);
    try {
      pyodide.globals.set("_input_json", JSON.stringify(tc.input));

      // Execute the function and round floats to avoid IEEE 754 noise
      const resultJson = (await pyodide.runPythonAsync(`
import json, math

def _round_floats(x):
    if isinstance(x, float):
        return round(x, 6)
    if isinstance(x, list):
        return [_round_floats(e) for e in x]
    if isinstance(x, dict):
        return {k: _round_floats(v) for k, v in x.items()}
    return x

_args = json.loads(_input_json)
_result = ${functionName}(*_args)
json.dumps(_round_floats(_result))
`)) as string;

      // Also round expected floats for fair comparison
      const expectedParsed = JSON.parse(expected);
      const roundedExpected = JSON.parse(JSON.stringify(expectedParsed, (_, v) =>
        typeof v === "number" && !Number.isInteger(v)
          ? Math.round(v * 1_000_000) / 1_000_000
          : v,
      ));

      const actual = JSON.parse(resultJson) as unknown;
      const passed = deepEqual(actual, roundedExpected);
      results.push({ passed, actual: resultJson, expected: JSON.stringify(roundedExpected) });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      results.push({ passed: false, actual: "Error", expected, error });
    }
  }

  return results;
}

// ── Backend executor (Java, C++, Bash) ───────────────────────────────────

async function runRemote(
  language: string,
  code: string,
  functionName: string,
  testCases: TestCase[],
): Promise<TestResult[]> {
  const res = await apiFetch("/execute", {
    method: "POST",
    body: JSON.stringify({ language, code, functionName, testCases }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
    const errMsg = data.error ?? `HTTP ${res.status}`;
    return testCases.map((tc) => ({
      passed: false,
      actual: "Error",
      expected: JSON.stringify(tc.expectedOutput),
      error: errMsg,
    }));
  }

  const data = await res.json() as { results: TestResult[] };
  return data.results;
}

// ── Public entry point ────────────────────────────────────────────────────

export async function executeCode(
  language: string,
  code: string,
  problem: CodingProblem,
): Promise<TestResult[]> {
  console.log("Executing:", language);

  switch (language) {
    case "JavaScript":
    case "Node.js":
      return runJavaScript(code, problem.functionName, problem.testCases);

    case "TypeScript":
      return runTypeScript(code, problem.functionName, problem.testCases);

    case "Python":
      return await runPython(code, problem.functionName, problem.testCases);

    case "Java":
    case "C++":
    case "Bash":
      return await runRemote(language, code, problem.functionName, problem.testCases);

    default:
      return problem.testCases.map((tc) => ({
        passed: false,
        actual: "Error",
        expected: JSON.stringify(tc.expectedOutput),
        error: `Execution not supported for: ${language}`,
      }));
  }
}
