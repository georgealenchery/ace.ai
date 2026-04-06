import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  saveInterview,
  getInterviews,
  getInterviewById,
  getLatestInterview,
} from "../../services/storageService";
import type { VapiInterviewConfig, VapiAnalysisResult } from "../../types/interview";

// ---------------------------------------------------------------------------
// Mock Supabase — builder pattern mirrors the real Supabase client
// ---------------------------------------------------------------------------
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

vi.mock("../../services/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    })),
  },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockConfig: VapiInterviewConfig = {
  role: "frontend",
  difficulty: 50,
  experienceLevel: 50,
  strictness: 50,
  questionType: "behavioral",
};

const mockResult: VapiAnalysisResult = {
  score: 82,
  communication: 78,
  technicalAccuracy: 85,
  problemSolving: 80,
  strengths: ["Clear communication"],
  improvements: ["More depth"],
  nextSteps: ["Practice STAR format"],
  questionBreakdown: [
    { question: "Tell me about yourself", candidateAnswer: "I am...", score: 82, feedback: "Good" },
  ],
};

const mockRow = {
  id: "uuid-123",
  created_at: "2025-06-01T12:00:00Z",
  role: "frontend",
  question_type: "behavioral",
  config: mockConfig,
  result: mockResult,
  transcript: [{ role: "assistant", text: "Tell me about yourself", timestamp: 1000 }],
};

// ---------------------------------------------------------------------------
describe("saveInterview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Chain: from().insert().select().single()
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });
  });

  it("returns a mapped SavedInterview on success", async () => {
    mockSingle.mockResolvedValue({ data: mockRow, error: null });
    const saved = await saveInterview("user-1", mockConfig, mockResult, mockRow.transcript as never);
    expect(saved.id).toBe("uuid-123");
    expect(saved.date).toBe("2025-06-01T12:00:00Z");
    expect(saved.role).toBe("frontend");
    expect(saved.questionType).toBe("behavioral");
    expect(saved.config).toEqual(mockConfig);
    expect(saved.result).toEqual(mockResult);
    expect(saved.transcript).toHaveLength(1);
  });

  it("maps created_at → date (not a field called created_at)", async () => {
    mockSingle.mockResolvedValue({ data: mockRow, error: null });
    const saved = await saveInterview("user-1", mockConfig, mockResult);
    expect(saved).toHaveProperty("date");
    expect(saved).not.toHaveProperty("created_at");
  });

  it("maps question_type snake_case → questionType camelCase", async () => {
    mockSingle.mockResolvedValue({ data: mockRow, error: null });
    const saved = await saveInterview("user-1", mockConfig, mockResult);
    expect(saved).toHaveProperty("questionType");
    expect(saved).not.toHaveProperty("question_type");
  });

  it("defaults transcript to [] when row has null transcript", async () => {
    mockSingle.mockResolvedValue({ data: { ...mockRow, transcript: null }, error: null });
    const saved = await saveInterview("user-1", mockConfig, mockResult);
    expect(saved.transcript).toEqual([]);
  });

  it("throws when supabase returns an error", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "duplicate key" } });
    await expect(saveInterview("user-1", mockConfig, mockResult)).rejects.toThrow("duplicate key");
  });

  it("throws when data is null with no error message", async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });
    await expect(saveInterview("user-1", mockConfig, mockResult)).rejects.toThrow("Failed to save interview");
  });
});

// ---------------------------------------------------------------------------
describe("getInterviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Chain: from().select().eq().order()
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
  });

  it("returns an array of mapped interviews ordered newest-first", async () => {
    const rows = [mockRow, { ...mockRow, id: "uuid-456", created_at: "2025-05-01T00:00:00Z" }];
    mockOrder.mockResolvedValue({ data: rows, error: null });
    const result = await getInterviews("user-1");
    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe("uuid-123");
    expect(result[1]!.id).toBe("uuid-456");
  });

  it("returns empty array when user has no interviews", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    const result = await getInterviews("user-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when supabase returns null data", async () => {
    mockOrder.mockResolvedValue({ data: null, error: null });
    const result = await getInterviews("user-1");
    expect(result).toEqual([]);
  });

  it("throws when supabase returns an error", async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: "permission denied" } });
    await expect(getInterviews("user-1")).rejects.toThrow("permission denied");
  });

  it("maps each row's columns correctly", async () => {
    mockOrder.mockResolvedValue({ data: [mockRow], error: null });
    const [interview] = await getInterviews("user-1");
    expect(interview!.date).toBe(mockRow.created_at);
    expect(interview!.questionType).toBe("behavioral");
  });
});

// ---------------------------------------------------------------------------
describe("getInterviewById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Chain: from().select().eq(id).eq(user_id).single()
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle });
  });

  it("returns mapped interview when found", async () => {
    mockSingle.mockResolvedValue({ data: mockRow, error: null });
    const result = await getInterviewById("user-1", "uuid-123");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("uuid-123");
    expect(result!.date).toBe("2025-06-01T12:00:00Z");
  });

  it("returns null when not found (supabase returns error)", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "not found" } });
    const result = await getInterviewById("user-1", "nonexistent");
    expect(result).toBeNull();
  });

  it("returns null when data is null without error (row doesn't exist or belongs to another user)", async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });
    const result = await getInterviewById("user-1", "other-user-interview");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe("getLatestInterview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Chain: from().select().eq().order().limit().maybeSingle()
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ limit: mockLimit });
    mockLimit.mockReturnValue({ maybeSingle: mockMaybeSingle });
  });

  it("returns the most recent interview when one exists", async () => {
    mockMaybeSingle.mockResolvedValue({ data: mockRow, error: null });
    const result = await getLatestInterview("user-1");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("uuid-123");
  });

  it("returns null when user has no interviews", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const result = await getLatestInterview("user-1");
    expect(result).toBeNull();
  });

  it("returns null when supabase returns an error", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: "timeout" } });
    const result = await getLatestInterview("user-1");
    expect(result).toBeNull();
  });
});
