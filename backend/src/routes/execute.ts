import { Router } from "express";
import type { Request, Response } from "express";
import { exec } from "child_process";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";

const router = Router();
const execAsync = promisify(exec);

// ── Types ──────────────────────────────────────────────────────────────────

interface TestCase {
  input: unknown[];
  expectedOutput: unknown;
}

interface TestResult {
  passed: boolean;
  actual: string;
  expected: string;
  error?: string;
}

// ── Temp-dir helpers ───────────────────────────────────────────────────────

async function makeTempDir(): Promise<string> {
  const base = path.join(os.tmpdir(), `exec_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  await fs.mkdir(base, { recursive: true });
  return base;
}

async function removeTempDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
}

// ── Run a shell command with timeout ──────────────────────────────────────

async function run(
  cmd: string,
  cwd: string,
  timeoutMs = 10_000,
): Promise<{ stdout: string; stderr: string; error?: string }> {
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd, timeout: timeoutMs });
    return { stdout, stderr };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    return {
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? "",
      error: e.message ?? "Unknown error",
    };
  }
}

// ── Literal converters ─────────────────────────────────────────────────────

function toJavaLiteral(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "string") {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
  }
  if (typeof value === "number") {
    if (Number.isInteger(value) && value >= -2_147_483_648 && value <= 2_147_483_647) {
      return String(value);
    }
    return value + "d";
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "new int[]{}";
    const allInts = value.every((v) => typeof v === "number" && Number.isInteger(v));
    const allNums = value.every((v) => typeof v === "number");
    const allStrs = value.every((v) => typeof v === "string");
    const allBools = value.every((v) => typeof v === "boolean");
    const allIntArrays = value.every(
      (v) => Array.isArray(v) && (v as unknown[]).every((e) => typeof e === "number" && Number.isInteger(e)),
    );
    if (allInts) return `new int[]{${value.join(", ")}}`;
    if (allNums) return `new double[]{${(value as number[]).map((v) => v + "d").join(", ")}}`;
    if (allStrs) return `new String[]{${(value as string[]).map((v) => `"${v.replace(/"/g, '\\"')}"`).join(", ")}}`;
    if (allBools) return `new boolean[]{${value.join(", ")}}`;
    if (allIntArrays) {
      const inner = (value as number[][]).map((row) => `{${row.join(", ")}}`).join(", ");
      return `new int[][]{${inner}}`;
    }
    return `new Object[]{${value.map(toJavaLiteral).join(", ")}}`;
  }
  return `"${JSON.stringify(value).replace(/"/g, '\\"')}"`;
}

function toCppLiteral(value: unknown): string {
  if (value === null || value === undefined) return "0";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return `"${value.replace(/"/g, '\\"')}"`;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    const allInts = value.every((v) => typeof v === "number" && Number.isInteger(v));
    const allStrs = value.every((v) => typeof v === "string");
    const allNums = value.every((v) => typeof v === "number");
    if (allInts) return `vector<int>{${value.join(", ")}}`;
    if (allStrs) return `vector<string>{${(value as string[]).map((v) => `"${v}"`).join(", ")}}`;
    if (allNums) return `vector<double>{${value.join(", ")}}`;
    return `vector<int>{}`;
  }
  return String(value);
}

function toBashArg(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(" ");
  return String(value);
}

// ── Parse stdout into per-test results ────────────────────────────────────

function parseResults(stdout: string, testCases: TestCase[]): TestResult[] {
  const lines = stdout.trim().split("\n");
  return testCases.map((tc, i) => {
    const line = (lines[i] ?? "").trim();
    const expected = JSON.stringify(tc.expectedOutput);
    if (line === "PASS") {
      return { passed: true, actual: expected, expected };
    }
    if (line.startsWith("FAIL:")) {
      const actual = line.slice(5);
      return { passed: false, actual, expected };
    }
    if (line.startsWith("ERROR:")) {
      return { passed: false, actual: "Error", expected, error: line.slice(6) };
    }
    return { passed: false, actual: line || "No output", expected };
  });
}

// ── Java executor ─────────────────────────────────────────────────────────

async function executeJava(
  code: string,
  functionName: string,
  testCases: TestCase[],
): Promise<TestResult[]> {
  const testInvocations = testCases
    .map((tc, i) => {
      const args = tc.input.map(toJavaLiteral).join(", ");
      const expected = toJavaLiteral(tc.expectedOutput);
      return `
        try {
            Object _r${i} = ${functionName}(${args});
            Object _e${i} = ${expected};
            System.out.println(deepEquals(_r${i}, _e${i}) ? "PASS" : "FAIL:" + toStr(_r${i}));
        } catch (Exception _ex${i}) {
            System.out.println("ERROR:" + _ex${i}.getMessage());
        }`;
    })
    .join("\n");

  const source = `
import java.util.*;
import java.util.Arrays;

public class Main {

    // ===== USER CODE =====
    ${code}
    // ===== END USER CODE =====

    private static boolean deepEquals(Object a, Object b) {
        if (a == b) return true;
        if (a == null || b == null) return false;
        if (a instanceof int[]   && b instanceof int[])   return Arrays.equals((int[])a,     (int[])b);
        if (a instanceof long[]  && b instanceof long[])  return Arrays.equals((long[])a,    (long[])b);
        if (a instanceof double[]&& b instanceof double[])return Arrays.equals((double[])a,  (double[])b);
        if (a instanceof boolean[]&&b instanceof boolean[])return Arrays.equals((boolean[])a,(boolean[])b);
        if (a instanceof int[][] && b instanceof int[][]) return Arrays.deepEquals((Object[])a,(Object[])b);
        if (a instanceof Object[]&& b instanceof Object[])return Arrays.deepEquals((Object[])a,(Object[])b);
        return a.equals(b);
    }

    private static String toStr(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof int[])    return Arrays.toString((int[])obj);
        if (obj instanceof long[])   return Arrays.toString((long[])obj);
        if (obj instanceof double[]) return Arrays.toString((double[])obj);
        if (obj instanceof boolean[])return Arrays.toString((boolean[])obj);
        if (obj instanceof Object[]) return Arrays.deepToString((Object[])obj);
        return String.valueOf(obj);
    }

    public static void main(String[] args) throws Exception {
        ${testInvocations}
    }
}`;

  const tmpDir = await makeTempDir();
  try {
    const srcFile = path.join(tmpDir, "Main.java");
    await fs.writeFile(srcFile, source);

    const compile = await run("javac Main.java", tmpDir, 30_000);
    if (compile.error && !compile.stdout) {
      const errMsg = compile.stderr || compile.error;
      return testCases.map((tc) => ({
        passed: false,
        actual: "Compile error",
        expected: JSON.stringify(tc.expectedOutput),
        error: errMsg,
      }));
    }

    const exec_ = await run("java Main", tmpDir, 10_000);
    console.log("Executing: Java");
    console.log("Results:", exec_.stdout);
    return parseResults(exec_.stdout, testCases);
  } finally {
    await removeTempDir(tmpDir);
  }
}

// ── C++ executor ──────────────────────────────────────────────────────────

async function executeCpp(
  code: string,
  functionName: string,
  testCases: TestCase[],
): Promise<TestResult[]> {
  const testInvocations = testCases
    .map((tc, i) => {
      const args = tc.input.map(toCppLiteral).join(", ");
      const expected = toCppLiteral(tc.expectedOutput);
      return `
    {
        auto _r${i} = ${functionName}(${args});
        auto _e${i} = ${expected};
        if (_r${i} == _e${i}) {
            cout << "PASS" << endl;
        } else {
            cout << "FAIL:" << _r${i} << endl;
        }
    }`;
    })
    .join("\n");

  const source = `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <sstream>
#include <numeric>
#include <cmath>
using namespace std;

// ===== USER CODE =====
${code}
// ===== END USER CODE =====

int main() {
    ${testInvocations}
    return 0;
}`;

  const tmpDir = await makeTempDir();
  try {
    const srcFile = path.join(tmpDir, "solution.cpp");
    const binFile = path.join(tmpDir, "solution");
    await fs.writeFile(srcFile, source);

    const compile = await run(`g++ -std=c++17 -o ${binFile} ${srcFile}`, tmpDir, 30_000);
    if (compile.error && !compile.stdout) {
      const errMsg = compile.stderr || compile.error;
      return testCases.map((tc) => ({
        passed: false,
        actual: "Compile error",
        expected: JSON.stringify(tc.expectedOutput),
        error: errMsg,
      }));
    }

    const exec_ = await run(binFile, tmpDir, 10_000);
    console.log("Executing: C++");
    console.log("Results:", exec_.stdout);
    return parseResults(exec_.stdout, testCases);
  } finally {
    await removeTempDir(tmpDir);
  }
}

// ── Bash executor ─────────────────────────────────────────────────────────

async function executeBash(
  code: string,
  functionName: string,
  testCases: TestCase[],
): Promise<TestResult[]> {
  const testInvocations = testCases
    .map((tc, i) => {
      const args = tc.input.map(toBashArg).join(" ");
      const expected = String(tc.expectedOutput);
      return `
_result${i}=$(${functionName} ${args})
_expected${i}="${expected}"
if [ "$_result${i}" = "$_expected${i}" ]; then
    echo "PASS"
else
    echo "FAIL:$_result${i}"
fi`;
    })
    .join("\n");

  const source = `#!/bin/bash
set -euo pipefail

# ===== USER CODE =====
${code}
# ===== END USER CODE =====

${testInvocations}`;

  const tmpDir = await makeTempDir();
  try {
    const scriptFile = path.join(tmpDir, "solution.sh");
    await fs.writeFile(scriptFile, source);
    await fs.chmod(scriptFile, 0o755);

    const exec_ = await run(`bash ${scriptFile}`, tmpDir, 10_000);
    console.log("Executing: Bash");
    console.log("Results:", exec_.stdout);
    return parseResults(exec_.stdout, testCases);
  } finally {
    await removeTempDir(tmpDir);
  }
}

// ── Route ──────────────────────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response) => {
  const { language, code, functionName, testCases } = req.body as {
    language?: string;
    code?: string;
    functionName?: string;
    testCases?: TestCase[];
  };

  if (!language || !code || !functionName || !Array.isArray(testCases) || testCases.length === 0) {
    res.status(400).json({ error: "Missing required fields: language, code, functionName, testCases" });
    return;
  }

  try {
    let results: TestResult[];

    switch (language.toLowerCase()) {
      case "java":
        results = await executeJava(code, functionName, testCases);
        break;
      case "c++":
      case "cpp":
        results = await executeCpp(code, functionName, testCases);
        break;
      case "bash":
        results = await executeBash(code, functionName, testCases);
        break;
      default:
        res.status(400).json({ error: `Unsupported language for backend execution: ${language}` });
        return;
    }

    res.json({ results });
  } catch (err) {
    console.error("Execution error:", err);
    res.status(500).json({ error: "Code execution failed" });
  }
});

export default router;
