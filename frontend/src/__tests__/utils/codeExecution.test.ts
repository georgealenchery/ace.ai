import { describe, it, expect, vi } from "vitest";
import { executeCode } from "../../hooks/useCodeExecution";
import { apiFetch } from "../../services/auth";
import type { CodingProblem } from "../../services/api";

// ---------------------------------------------------------------------------
// apiFetch is used for remote execution — mock it so tests stay in-browser
// ---------------------------------------------------------------------------
vi.mock("../../services/auth", () => ({
  apiFetch: vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      results: [{ passed: true, actual: "42", expected: "42" }],
    }),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function problem(overrides: Partial<CodingProblem> = {}): CodingProblem {
  return {
    prompt: "test",
    functionName: "solve",
    functionSignature: "function solve(x) {}",
    testCases: [{ input: [2], expectedOutput: 4 }],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
describe("executeCode — JavaScript dispatch", () => {
  it("passes when function returns the correct value", async () => {
    const p = problem({
      functionName: "double",
      testCases: [{ input: [3], expectedOutput: 6 }],
    });
    const results = await executeCode("JavaScript", "function double(x) { return x * 2; }", p);
    expect(results[0]!.passed).toBe(true);
  });

  it("fails and sets actual when function returns wrong value", async () => {
    const p = problem({
      functionName: "double",
      testCases: [{ input: [3], expectedOutput: 6 }],
    });
    const results = await executeCode("JavaScript", "function double(x) { return x; }", p);
    expect(results[0]!.passed).toBe(false);
    expect(results[0]!.actual).toBe("3");
  });

  it("fails and sets error when function throws", async () => {
    const p = problem({
      functionName: "boom",
      testCases: [{ input: [1], expectedOutput: 1 }],
    });
    const results = await executeCode("JavaScript", "function boom() { throw new Error('oops'); }", p);
    expect(results[0]!.passed).toBe(false);
    expect(results[0]!.error).toMatch(/oops/);
  });

  it("handles multiple test cases, failing and passing independently", async () => {
    const p = problem({
      functionName: "isEven",
      testCases: [
        { input: [2], expectedOutput: true },
        { input: [3], expectedOutput: true }, // intentionally wrong expected
      ],
    });
    const code = "function isEven(n) { return n % 2 === 0; }";
    const results = await executeCode("JavaScript", code, p);
    expect(results[0]!.passed).toBe(true);
    expect(results[1]!.passed).toBe(false);
  });

  it("Node.js language is routed the same as JavaScript", async () => {
    const p = problem({
      functionName: "add",
      testCases: [{ input: [1, 2], expectedOutput: 3 }],
    });
    const results = await executeCode("Node.js", "function add(a, b) { return a + b; }", p);
    expect(results[0]!.passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe("executeCode — TypeScript dispatch (type stripping)", () => {
  it("strips return type annotation and runs correctly", async () => {
    const p = problem({
      functionName: "greet",
      testCases: [{ input: ["Alice"], expectedOutput: "Hello Alice" }],
    });
    const tsCode = `function greet(name: string): string { return "Hello " + name; }`;
    const results = await executeCode("TypeScript", tsCode, p);
    expect(results[0]!.passed).toBe(true);
  });

  it("strips parameter type annotations", async () => {
    const p = problem({
      functionName: "add",
      testCases: [{ input: [2, 3], expectedOutput: 5 }],
    });
    const tsCode = `function add(a: number, b: number): number { return a + b; }`;
    const results = await executeCode("TypeScript", tsCode, p);
    expect(results[0]!.passed).toBe(true);
  });

  it("strips interface declarations without breaking logic", async () => {
    const p = problem({
      functionName: "getLength",
      testCases: [{ input: [[1, 2, 3]], expectedOutput: 3 }],
    });
    const tsCode = `
interface Arr { length: number; }
function getLength(arr: number[]): number { return arr.length; }
    `;
    const results = await executeCode("TypeScript", tsCode, p);
    expect(results[0]!.passed).toBe(true);
  });

  it("strips access modifiers in class methods", async () => {
    const p = problem({
      functionName: "makeCounter",
      testCases: [{ input: [], expectedOutput: 1 }],
    });
    const tsCode = `
function makeCounter(): number {
  class Counter {
    private count: number = 0;
    public increment(): number { return ++this.count; }
  }
  return new Counter().increment();
}
    `;
    const results = await executeCode("TypeScript", tsCode, p);
    expect(results[0]!.passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe("executeCode — float tolerance via deepEqual", () => {
  it("treats 0.1 + 0.2 as equal to 0.3 within 1e-6 tolerance", async () => {
    const p = problem({
      functionName: "floatAdd",
      testCases: [{ input: [], expectedOutput: 0.3 }],
    });
    // 0.1 + 0.2 = 0.30000000000000004 in IEEE 754
    const code = "function floatAdd() { return 0.1 + 0.2; }";
    const results = await executeCode("JavaScript", code, p);
    expect(results[0]!.passed).toBe(true);
  });

  it("exact integer equality is still enforced (no spurious pass)", async () => {
    const p = problem({
      functionName: "getTwo",
      testCases: [{ input: [], expectedOutput: 3 }],
    });
    const code = "function getTwo() { return 2; }";
    const results = await executeCode("JavaScript", code, p);
    expect(results[0]!.passed).toBe(false);
  });

  it("nested array equality works correctly", async () => {
    const p = problem({
      functionName: "matrix",
      testCases: [{ input: [], expectedOutput: [[1, 2], [3, 4]] }],
    });
    const code = "function matrix() { return [[1,2],[3,4]]; }";
    const results = await executeCode("JavaScript", code, p);
    expect(results[0]!.passed).toBe(true);
  });

  it("array length mismatch fails", async () => {
    const p = problem({
      functionName: "arr",
      testCases: [{ input: [], expectedOutput: [1, 2, 3] }],
    });
    const code = "function arr() { return [1, 2]; }";
    const results = await executeCode("JavaScript", code, p);
    expect(results[0]!.passed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe("executeCode — unsupported language", () => {
  it("returns an error result for every test case when language is unknown", async () => {
    const p = problem({
      testCases: [
        { input: [1], expectedOutput: 1 },
        { input: [2], expectedOutput: 2 },
      ],
    });
    const results = await executeCode("COBOL", "IDENTIFICATION DIVISION.", p);
    expect(results).toHaveLength(2);
    results.forEach((r) => {
      expect(r.passed).toBe(false);
      expect(r.error).toMatch(/not supported/i);
    });
  });
});

// ---------------------------------------------------------------------------
describe("executeCode — remote language dispatch (Java/C++/Bash)", () => {
  const mockApiFetch = vi.mocked(apiFetch);

  it("calls apiFetch for Java and returns results", async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ passed: true, actual: "5", expected: "5" }] }),
    } as Response);

    const p = problem({ testCases: [{ input: [2, 3], expectedOutput: 5 }] });
    const results = await executeCode("Java", "// java code", p);
    expect(mockApiFetch).toHaveBeenCalledWith("/execute", expect.objectContaining({ method: "POST" }));
    expect(results[0]!.passed).toBe(true);
  });

  it("returns error results when apiFetch returns non-ok response", async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Compilation failed" }),
    } as Response);

    const p = problem({ testCases: [{ input: [], expectedOutput: 0 }] });
    const results = await executeCode("C++", "invalid c++", p);
    expect(results[0]!.passed).toBe(false);
    expect(results[0]!.error).toMatch(/Compilation failed/i);
  });
});
