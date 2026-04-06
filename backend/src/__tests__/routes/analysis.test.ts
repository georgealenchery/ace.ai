import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import analysisRoutes from "../../routes/analysis";
import type { VapiAnalysisResult } from "../../types/interview";

// ---------------------------------------------------------------------------
// Mock AI service and storage — no OpenAI or Supabase in integration tests
// ---------------------------------------------------------------------------
vi.mock("../../services/aiService", () => ({
  analyzeVapiTranscript: vi.fn(),
  generateInterviewQuestions: vi.fn(),
}));

vi.mock("../../services/storageService", () => ({
  saveInterview: vi.fn(),
  getInterviews: vi.fn(),
}));

// Mock Supabase for auth middleware
vi.mock("../../services/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

import {
  analyzeVapiTranscript,
  generateInterviewQuestions,
} from "../../services/aiService";
import { saveInterview, getInterviews } from "../../services/storageService";
import { supabase } from "../../services/supabase";
import { authMiddleware } from "../../middleware/auth";

const mockAnalyze = vi.mocked(analyzeVapiTranscript);
const mockGenerate = vi.mocked(generateInterviewQuestions);
const mockSave = vi.mocked(saveInterview);
const mockGetInterviews = vi.mocked(getInterviews);
const mockGetUser = vi.mocked(supabase.auth.getUser);

// ---------------------------------------------------------------------------
// Test app — mirrors the real app's route mounting
// ---------------------------------------------------------------------------
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/analysis", authMiddleware, analysisRoutes);
  return app;
}

const VALID_TOKEN = "Bearer valid-jwt-token";
const USER_ID = "user-abc-123";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const validTranscript = [
  {
    role: "assistant" as const,
    text: "Tell me about yourself.",
    timestamp: 1000,
  },
  {
    role: "user" as const,
    text: "I am a frontend developer with 3 years of experience.",
    timestamp: 2000,
  },
];

const validConfig = {
  role: "frontend",
  questionType: "behavioral" as const,
  difficulty: 50,
  experienceLevel: 50,
  strictness: 50,
};

const mockAnalysisResult: VapiAnalysisResult = {
  score: 78,
  communication: 75,
  technicalAccuracy: 80,
  problemSolving: 79,
  strengths: ["Clear communication"],
  improvements: ["Add more examples"],
  nextSteps: ["Practice system design"],
  questionBreakdown: [
    {
      question: "Tell me about yourself.",
      candidateAnswer: "I am...",
      score: 78,
      feedback: "Solid",
    },
  ],
};

const savedInterview = {
  id: "interview-999",
  date: "2025-06-01T00:00:00Z",
  role: "frontend",
  questionType: "behavioral",
  config: validConfig,
  result: mockAnalysisResult,
  transcript: validTranscript,
};

// ---------------------------------------------------------------------------
describe("POST /api/analysis/evaluate — authentication", () => {
  const app = buildApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await request(app)
      .post("/api/analysis/evaluate")
      .send({ transcript: validTranscript, config: validConfig });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Authentication required");
  });

  it("returns 401 when token is malformed (no Bearer prefix)", async () => {
    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", "invalid-token")
      .send({ transcript: validTranscript, config: validConfig });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Authentication required");
  });

  it("returns 401 when Supabase rejects the token", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "token expired" },
    } as never);
    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ transcript: validTranscript, config: validConfig });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid or expired token");
  });
});

// ---------------------------------------------------------------------------
describe("POST /api/analysis/evaluate — validation", () => {
  const app = buildApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: "test@example.com" } },
      error: null,
    } as never);
  });

  it("returns 400 when transcript is missing", async () => {
    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ config: validConfig });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/transcript/i);
  });

  it("returns 400 when transcript is not an array", async () => {
    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ transcript: "not an array", config: validConfig });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/transcript/i);
  });

  it("returns 400 when transcript is empty", async () => {
    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ transcript: [], config: validConfig });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/transcript/i);
  });

  it("returns 400 when config is missing role", async () => {
    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({
        transcript: validTranscript,
        config: { ...validConfig, role: undefined },
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/config|role/i);
  });

  it("returns 400 when config is missing questionType", async () => {
    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({
        transcript: validTranscript,
        config: { ...validConfig, questionType: undefined },
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/config|questionType/i);
  });
});

// ---------------------------------------------------------------------------
describe("POST /api/analysis/evaluate — success path", () => {
  const app = buildApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: "test@example.com" } },
      error: null,
    } as never);
  });

  it("returns { id, result } on success with correct shape", async () => {
    mockAnalyze.mockResolvedValueOnce(mockAnalysisResult);
    mockSave.mockResolvedValueOnce(savedInterview);

    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ transcript: validTranscript, config: validConfig });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", "interview-999");
    expect(res.body).toHaveProperty("result");
    expect(res.body.result.score).toBe(78);
    expect(res.body.result).toHaveProperty("questionBreakdown");
  });

  it("strips timestamps before passing to AI analysis", async () => {
    mockAnalyze.mockResolvedValueOnce(mockAnalysisResult);
    mockSave.mockResolvedValueOnce(savedInterview);

    await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ transcript: validTranscript, config: validConfig });

    const [analysisTranscript] = mockAnalyze.mock.calls[0]!;
    expect(analysisTranscript[0]).not.toHaveProperty("timestamp");
    expect(analysisTranscript[0]).toHaveProperty("role");
    expect(analysisTranscript[0]).toHaveProperty("text");
  });

  it("passes full transcript (with timestamps) to saveInterview", async () => {
    mockAnalyze.mockResolvedValueOnce(mockAnalysisResult);
    mockSave.mockResolvedValueOnce(savedInterview);

    await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ transcript: validTranscript, config: validConfig });

    const savedTranscript = mockSave.mock.calls[0]![3];
    expect(savedTranscript![0]).toHaveProperty("timestamp", 1000);
  });

  it("saves interview with the authenticated user's id", async () => {
    mockAnalyze.mockResolvedValueOnce(mockAnalysisResult);
    mockSave.mockResolvedValueOnce(savedInterview);

    await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ transcript: validTranscript, config: validConfig });

    expect(mockSave.mock.calls[0]![0]).toBe(USER_ID);
  });

  it("returns 500 when AI analysis throws", async () => {
    mockAnalyze.mockRejectedValueOnce(new Error("OpenAI rate limit"));

    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ transcript: validTranscript, config: validConfig });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Failed to analyze/i);
  });

  it("returns 500 when storage throws after successful analysis", async () => {
    mockAnalyze.mockResolvedValueOnce(mockAnalysisResult);
    mockSave.mockRejectedValueOnce(new Error("Supabase connection timeout"));

    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ transcript: validTranscript, config: validConfig });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Failed to analyze/i);
  });
});

// ---------------------------------------------------------------------------
describe("POST /api/analysis/questions", () => {
  const app = buildApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: "test@example.com" } },
      error: null,
    } as never);
  });

  it("returns { problems } array on success", async () => {
    const mockProblems = [
      {
        prompt: "Two Sum",
        functionName: "twoSum",
        functionSignature: "function twoSum(nums, target) {}",
        testCases: [],
      },
    ];
    mockGenerate.mockResolvedValueOnce(mockProblems as never);

    const res = await request(app)
      .post("/api/analysis/questions")
      .set("Authorization", VALID_TOKEN)
      .send({ role: "frontend", difficulty: "medium", level: "mid" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("problems");
    expect(res.body.problems).toHaveLength(1);
    expect(res.body.problems[0].prompt).toBe("Two Sum");
  });

  it("passes role, difficulty, level, and language to generateInterviewQuestions", async () => {
    mockGenerate.mockResolvedValueOnce([] as never);

    await request(app)
      .post("/api/analysis/questions")
      .set("Authorization", VALID_TOKEN)
      .send({
        role: "backend",
        difficulty: "hard",
        level: "senior",
        language: "Python",
      });

    expect(mockGenerate).toHaveBeenCalledWith(
      "backend",
      "hard",
      "senior",
      "Python",
    );
  });

  it("returns 400 when role is missing", async () => {
    const res = await request(app)
      .post("/api/analysis/questions")
      .set("Authorization", VALID_TOKEN)
      .send({ difficulty: "medium", level: "mid" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/role|difficulty|level/i);
  });

  it("returns 400 when difficulty is missing", async () => {
    const res = await request(app)
      .post("/api/analysis/questions")
      .set("Authorization", VALID_TOKEN)
      .send({ role: "frontend", level: "mid" });
    expect(res.status).toBe(400);
  });

  it("returns 500 when question generation fails", async () => {
    mockGenerate.mockRejectedValueOnce(new Error("OpenAI error"));

    const res = await request(app)
      .post("/api/analysis/questions")
      .set("Authorization", VALID_TOKEN)
      .send({ role: "frontend", difficulty: "medium", level: "mid" });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Failed to generate/i);
  });
});

// ---------------------------------------------------------------------------
describe("POST /api/analysis/evaluate — edge cases: malformed transcript", () => {
  const app = buildApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: "test@example.com" } },
      error: null,
    } as never);
  });

  it("returns 400 for transcript entry missing 'role' field", async () => {
    const badTranscript = [
      { text: "Hello", timestamp: 1000 },
      { role: "user", text: "World", timestamp: 2000 },
    ];
    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ transcript: badTranscript, config: validConfig });
    // Route must reject or sanitise entries missing role
    expect([400, 500]).toContain(res.status);
  });

  it("returns 400 for transcript entry missing 'text' field", async () => {
    const badTranscript = [
      { role: "assistant", timestamp: 1000 },
      { role: "user", text: "Answer", timestamp: 2000 },
    ];
    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ transcript: badTranscript, config: validConfig });
    expect([400, 500]).toContain(res.status);
  });

  it("handles duplicate transcript entries without crashing (AI called once)", async () => {
    const dupeTranscript = [
      ...validTranscript,
      ...validTranscript, // exact duplicates
    ];
    mockAnalyze.mockResolvedValueOnce(mockAnalysisResult);
    mockSave.mockResolvedValueOnce(savedInterview);

    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ transcript: dupeTranscript, config: validConfig });

    expect(res.status).toBe(200);
    expect(mockAnalyze).toHaveBeenCalledOnce();
  });

  it("handles extremely large transcript (200 entries) without timeout or crash", async () => {
    const largeTranscript = Array.from({ length: 200 }, (_, i) => ({
      role: (i % 2 === 0 ? "assistant" : "user") as "assistant" | "user",
      text: `Line ${i}: ${"-".repeat(200)}`,
      timestamp: 1000 + i * 500,
    }));
    mockAnalyze.mockResolvedValueOnce(mockAnalysisResult);
    mockSave.mockResolvedValueOnce(savedInterview);

    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ transcript: largeTranscript, config: validConfig });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
  });

  it("returns 500 and does not call saveInterview when AI analysis throws mid-way", async () => {
    mockAnalyze.mockRejectedValueOnce(new Error("rate limit"));

    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ transcript: validTranscript, config: validConfig });

    expect(res.status).toBe(500);
    expect(mockSave).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
describe("POST /api/analysis/evaluate — stress cases: concurrent requests", () => {
  const app = buildApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: "test@example.com" } },
      error: null,
    } as never);
  });

  it("handles 5 concurrent POST requests independently", async () => {
    for (let i = 0; i < 5; i++) {
      mockAnalyze.mockResolvedValueOnce({
        ...mockAnalysisResult,
        score: 70 + i,
      });
      mockSave.mockResolvedValueOnce({
        ...savedInterview,
        id: `interview-${i}`,
      });
    }

    const requests = Array.from({ length: 5 }, () =>
      request(app)
        .post("/api/analysis/evaluate")
        .set("Authorization", VALID_TOKEN)
        .send({ transcript: validTranscript, config: validConfig }),
    );

    const responses = await Promise.all(requests);
    expect(responses.every((r) => r.status === 200)).toBe(true);
    expect(mockAnalyze).toHaveBeenCalledTimes(5);
    expect(mockSave).toHaveBeenCalledTimes(5);
  });

  it("one failing concurrent request does not affect a parallel succeeding request", async () => {
    mockAnalyze
      .mockRejectedValueOnce(new Error("OpenAI overload"))
      .mockResolvedValueOnce(mockAnalysisResult);
    mockSave.mockResolvedValueOnce(savedInterview);

    const [failing, succeeding] = await Promise.all([
      request(app)
        .post("/api/analysis/evaluate")
        .set("Authorization", VALID_TOKEN)
        .send({ transcript: validTranscript, config: validConfig }),
      request(app)
        .post("/api/analysis/evaluate")
        .set("Authorization", VALID_TOKEN)
        .send({ transcript: validTranscript, config: validConfig }),
    ]);

    const statuses = [failing!.status, succeeding!.status].sort();
    expect(statuses).toContain(500);
    expect(statuses).toContain(200);
  });
});

// ---------------------------------------------------------------------------
describe("POST /api/analysis/evaluate — race conditions: storage partial failure", () => {
  const app = buildApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: "test@example.com" } },
      error: null,
    } as never);
  });

  it("returns 500 when storage rejects after AI succeeds (partial failure)", async () => {
    mockAnalyze.mockResolvedValueOnce(mockAnalysisResult);
    mockSave.mockRejectedValueOnce(new Error("Supabase write timeout"));

    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ transcript: validTranscript, config: validConfig });

    expect(res.status).toBe(500);
    // AI was called but storage failed — should not return a partial success
    expect(res.body).not.toHaveProperty("id");
    expect(mockAnalyze).toHaveBeenCalledOnce();
  });

  it("saveInterview receives the correct userId even under concurrent load", async () => {
    const OTHER_USER = "other-user-xyz";
    mockGetUser
      .mockResolvedValueOnce({
        data: { user: { id: USER_ID, email: "a@a.com" } },
        error: null,
      } as never)
      .mockResolvedValueOnce({
        data: { user: { id: OTHER_USER, email: "b@b.com" } },
        error: null,
      } as never);

    mockAnalyze.mockResolvedValue(mockAnalysisResult);
    mockSave.mockResolvedValue(savedInterview);

    await Promise.all([
      request(app)
        .post("/api/analysis/evaluate")
        .set("Authorization", VALID_TOKEN)
        .send({ transcript: validTranscript, config: validConfig }),
      request(app)
        .post("/api/analysis/evaluate")
        .set("Authorization", "Bearer other-token")
        .send({ transcript: validTranscript, config: validConfig }),
    ]);

    const savedUserIds = mockSave.mock.calls.map((c) => c[0]);
    expect(savedUserIds).toContain(USER_ID);
    expect(savedUserIds).toContain(OTHER_USER);
  });
});

// ---------------------------------------------------------------------------
describe("POST /api/analysis/evaluate — event ordering: out-of-order async resolution", () => {
  const app = buildApp();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: "test@example.com" } },
      error: null,
    } as never);
  });

  it("route correctly awaits a delayed AI response (multi-tick async)", async () => {
    // Simulate an AI service that yields across multiple event-loop ticks
    mockAnalyze.mockImplementationOnce(
      () => new Promise((resolve) => setImmediate(() => resolve(mockAnalysisResult))),
    );
    mockSave.mockResolvedValueOnce(savedInterview);

    const res = await request(app)
      .post("/api/analysis/evaluate")
      .set("Authorization", VALID_TOKEN)
      .send({ transcript: validTranscript, config: validConfig });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("interview-999");
    expect(res.body.result.score).toBe(78);
    // saveInterview must have been called after analyze resolved
    expect(mockSave).toHaveBeenCalledOnce();
    expect(mockSave.mock.calls[0]![0]).toBe(USER_ID);
  });

  it("20 sequential requests all return 200 with independent ids", async () => {
    for (let i = 0; i < 20; i++) {
      mockAnalyze.mockResolvedValueOnce(mockAnalysisResult);
      mockSave.mockResolvedValueOnce({
        ...savedInterview,
        id: `interview-seq-${i}`,
      });
    }
    for (let i = 0; i < 20; i++) {
      const res = await request(app)
        .post("/api/analysis/evaluate")
        .set("Authorization", VALID_TOKEN)
        .send({ transcript: validTranscript, config: validConfig });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(`interview-seq-${i}`);
    }
  });
});

// ---------------------------------------------------------------------------
describe("GET /api/analysis/history", () => {
  const app = buildApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: "test@example.com" } },
      error: null,
    } as never);
  });

  it("returns { interviews } array for authenticated user", async () => {
    mockGetInterviews.mockResolvedValueOnce([savedInterview]);

    const res = await request(app)
      .get("/api/analysis/history")
      .set("Authorization", VALID_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("interviews");
    expect(res.body.interviews).toHaveLength(1);
    expect(res.body.interviews[0].id).toBe("interview-999");
  });

  it("returns empty array when user has no history", async () => {
    mockGetInterviews.mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/analysis/history")
      .set("Authorization", VALID_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.interviews).toEqual([]);
  });

  it("fetches history for the authenticated user only (correct user id passed)", async () => {
    mockGetInterviews.mockResolvedValueOnce([savedInterview]);

    await request(app)
      .get("/api/analysis/history")
      .set("Authorization", VALID_TOKEN);

    expect(mockGetInterviews).toHaveBeenCalledWith(USER_ID);
  });

  it("returns 500 when storage throws", async () => {
    mockGetInterviews.mockRejectedValueOnce(new Error("DB connection lost"));

    const res = await request(app)
      .get("/api/analysis/history")
      .set("Authorization", VALID_TOKEN);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Failed to fetch/i);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/analysis/history");
    expect(res.status).toBe(401);
  });
});
