import { describe, it, expect } from "vitest";
import {
  getDifficulty,
  filterProblems,
  pickRandomProblems,
  toCodingProblem,
  TECHNICAL_PROBLEMS,
  TOPIC_CATEGORIES,
} from "../../data/technicalProblems";

// ---------------------------------------------------------------------------
describe("getDifficulty — boundary values", () => {
  it.each([
    [0, "Easy"],
    [30, "Easy"],
    [31, "Medium"],
    [60, "Medium"],
    [61, "Hard"],
    [100, "Hard"],
  ])("getDifficulty(%i) → %s", (val, expected) => {
    expect(getDifficulty(val)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
describe("TOPIC_CATEGORIES — structure", () => {
  it("exports 10 topic categories", () => {
    expect(TOPIC_CATEGORIES).toHaveLength(10);
  });

  it("every category has a unique id and a non-empty label", () => {
    const ids = TOPIC_CATEGORIES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    TOPIC_CATEGORIES.forEach((t) => expect(t.label.length).toBeGreaterThan(0));
  });

  it("includes system-design as a topic", () => {
    expect(TOPIC_CATEGORIES.map((t) => t.id)).toContain("system-design");
  });
});

// ---------------------------------------------------------------------------
describe("filterProblems — difficulty-only (no topics)", () => {
  it("returns only Easy problems when difficultyValue ≤ 30", () => {
    const result = filterProblems(30);
    expect(result.every((p) => p.difficulty === "Easy")).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns only Medium problems when difficultyValue = 50", () => {
    const result = filterProblems(50);
    expect(result.every((p) => p.difficulty === "Medium")).toBe(true);
  });

  it("returns only Hard problems when difficultyValue = 80", () => {
    const result = filterProblems(80);
    expect(result.every((p) => p.difficulty === "Hard")).toBe(true);
  });

  it("returns a subset of TECHNICAL_PROBLEMS", () => {
    const result = filterProblems(50);
    result.forEach((p) => expect(TECHNICAL_PROBLEMS).toContain(p));
  });
});

// ---------------------------------------------------------------------------
describe("filterProblems — with topics", () => {
  it("filters to problems that include at least one matching topic", () => {
    const result = filterProblems(50, ["hash-maps"]);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((p) => expect(p.topics).toContain("hash-maps"));
  });

  it("system-design-only topics returns difficulty fallback (never empty)", () => {
    const fallback = filterProblems(50);
    const result = filterProblems(50, ["system-design"]);
    // system-design is excluded from code problems, so falls back to difficulty-only
    expect(result).toEqual(fallback);
  });

  it("unmatched topic falls back to difficulty-only (never returns empty array)", () => {
    // Use a made-up topic that no problem has
    const result = filterProblems(50, ["nonexistent-topic-xyz"]);
    const fallback = filterProblems(50);
    expect(result).toEqual(fallback);
    expect(result.length).toBeGreaterThan(0);
  });

  it("matching topic returns a subset of the difficulty set", () => {
    const difficultySet = filterProblems(30);
    const topicSet = filterProblems(30, ["arrays"]);
    topicSet.forEach((p) => expect(difficultySet).toContain(p));
  });

  it("multiple topics returns union of problems across all matching topics", () => {
    const arraysOnly = filterProblems(30, ["arrays"]);
    const mathOnly = filterProblems(30, ["math"]);
    const combined = filterProblems(30, ["arrays", "math"]);
    // combined should contain all problems from either single-topic filter
    arraysOnly.forEach((p) => expect(combined).toContain(p));
    mathOnly.forEach((p) => expect(combined).toContain(p));
  });
});

// ---------------------------------------------------------------------------
describe("pickRandomProblems", () => {
  it("returns at most the requested count", () => {
    const result = pickRandomProblems(50, [], 3);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("returns fewer items gracefully when the pool is smaller than count", () => {
    // Hard problems with a very specific topic might give fewer than 3
    const result = pickRandomProblems(80, ["dynamic-programming"], 10);
    const available = filterProblems(80, ["dynamic-programming"]);
    expect(result.length).toBeLessThanOrEqual(available.length);
  });

  it("every returned problem comes from the correct difficulty pool", () => {
    const result = pickRandomProblems(30, [], 3);
    result.forEach((p) => expect(p.difficulty).toBe("Easy"));
  });

  it("every returned problem matches the given topic filter", () => {
    const result = pickRandomProblems(50, ["hash-maps"], 3);
    result.forEach((p) => expect(p.topics).toContain("hash-maps"));
  });

  it("returns distinct problems (no duplicates by id)", () => {
    const result = pickRandomProblems(50, [], 5);
    const ids = result.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
describe("toCodingProblem", () => {
  const problem = TECHNICAL_PROBLEMS.find((p) => p.id === "two-sum")!;

  it("maps description to prompt", () => {
    const coding = toCodingProblem(problem, "JavaScript");
    expect(coding.prompt).toBe(problem.description);
  });

  it("resolves the correct language's starter code", () => {
    const coding = toCodingProblem(problem, "Python");
    expect(coding.functionSignature).toBe(problem.starterCode["Python"]);
  });

  it("falls back to JavaScript when requested language is missing", () => {
    const coding = toCodingProblem(problem, "Ruby");
    expect(coding.functionSignature).toBe(problem.starterCode["JavaScript"]);
  });

  it("uses functionName from the problem", () => {
    const coding = toCodingProblem(problem);
    expect(coding.functionName).toBe(problem.functionName);
  });

  it("passes through testCases as-is", () => {
    const coding = toCodingProblem(problem, "JavaScript");
    expect(coding.testCases).toEqual(problem.testCases);
  });
});

// ---------------------------------------------------------------------------
describe("TECHNICAL_PROBLEMS — data integrity", () => {
  it("every problem has a unique id", () => {
    const ids = TECHNICAL_PROBLEMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every problem has at least one topic", () => {
    TECHNICAL_PROBLEMS.forEach((p) => expect(p.topics.length).toBeGreaterThan(0));
  });

  it("every problem has at least one test case", () => {
    TECHNICAL_PROBLEMS.forEach((p) => expect(p.testCases.length).toBeGreaterThan(0));
  });

  it("every problem has JavaScript starter code", () => {
    TECHNICAL_PROBLEMS.forEach((p) => expect(p.starterCode["JavaScript"]).toBeTruthy());
  });

  it("all topics referenced in problems exist in TOPIC_CATEGORIES", () => {
    const validIds = new Set(TOPIC_CATEGORIES.map((t) => t.id));
    TECHNICAL_PROBLEMS.forEach((p) =>
      p.topics.forEach((t) => expect(validIds).toContain(t))
    );
  });
});
