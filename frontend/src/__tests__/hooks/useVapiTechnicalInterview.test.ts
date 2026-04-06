import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useVapiTechnicalInterview } from "../../hooks/useVapiTechnicalInterview";
import type { VapiTechnicalConfig } from "../../hooks/useVapiTechnicalInterview";
import { evaluateVapiInterview } from "../../services/api";

// ---------------------------------------------------------------------------
// Vapi mock — hoisted so it's available in vi.mock factory
// ---------------------------------------------------------------------------
type Handler = (...args: unknown[]) => void;

const { vapiHandlers, mockVapi } = vi.hoisted(() => {
  const handlers = new Map<string, ((...args: unknown[]) => void)[]>();
  return {
    vapiHandlers: handlers,
    mockVapi: {
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        if (!handlers.has(event)) handlers.set(event, []);
        handlers.get(event)!.push(handler);
      }),
      removeListener: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        handlers.set(event, (handlers.get(event) ?? []).filter((h) => h !== handler));
      }),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      setMuted: vi.fn(),
      say: vi.fn(),
    },
  };
});

function emit(event: string, ...args: unknown[]) {
  vapiHandlers.get(event)?.forEach((h) => h(...args));
}

vi.mock("../../lib/vapi", () => ({ vapi: mockVapi }));

vi.mock("../../services/api", () => ({
  evaluateVapiInterview: vi.fn(),
}));

// ---------------------------------------------------------------------------
const baseConfig: VapiTechnicalConfig = {
  role: "backend",
  difficulty: 50,
  experienceLevel: 50,
  strictness: 50,
  questionType: "technical",
  questions: ["Explain REST vs GraphQL", "How does indexing work?", "What is a memory leak?"],
  level: "mid",
};

class MockAudioContext {
  state = "running";
  resume = vi.fn().mockResolvedValue(undefined);
}

// ---------------------------------------------------------------------------
describe("useVapiTechnicalInterview — state machine", () => {
  beforeEach(() => {
    vapiHandlers.clear();
    vi.clearAllMocks();
    mockVapi.start.mockResolvedValue(undefined);
    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("initial state is idle with no messages and no audio", () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    expect(result.current.status).toBe("idle");
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isListening).toBe(false);
    expect(result.current.isMuted).toBe(false);
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.callEndedNaturally).toBe(false);
  });

  it("status is connecting after start() resolves but before call-start fires", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    // vapi.start has resolved but the Vapi SDK hasn't emitted call-start yet
    expect(result.current.status).toBe("connecting");
  });

  it("call-start: transitions to active, sets isListening, unmutes mic", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    act(() => emit("call-start"));
    expect(result.current.status).toBe("active");
    expect(result.current.isListening).toBe(true);
    expect(result.current.isMuted).toBe(false);
    expect(mockVapi.setMuted).toHaveBeenCalledWith(false);
  });

  it("speech-start: isSpeaking=true, isListening=false", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    act(() => emit("call-start"));
    act(() => emit("speech-start"));
    expect(result.current.isSpeaking).toBe(true);
    expect(result.current.isListening).toBe(false);
  });

  it("speech-end: isSpeaking=false, isListening=true (candidate's turn)", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    act(() => emit("call-start"));
    act(() => emit("speech-start"));
    act(() => emit("speech-end"));
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isListening).toBe(true);
  });

  it("call-end: status=ended, all speaking/listening flags cleared, callEndedNaturally=true", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    act(() => emit("call-start"));
    act(() => emit("speech-start"));
    act(() => emit("call-end"));
    expect(result.current.status).toBe("ended");
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isListening).toBe(false);
    expect(result.current.callEndedNaturally).toBe(true);
  });

  it("stop(): immediately sets ended state without waiting for call-end event", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    act(() => emit("call-start"));
    act(() => { result.current.stop(); });
    expect(result.current.status).toBe("ended");
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isListening).toBe(false);
    expect(result.current.isMuted).toBe(false);
    expect(mockVapi.stop).toHaveBeenCalledOnce();
  });

  it("start() resets messages and callEndedNaturally before reconnecting", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    act(() => {
      emit("call-start");
      emit("message", { type: "transcript", transcriptType: "final", role: "assistant", transcript: "Q1" });
      emit("call-end");
    });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.callEndedNaturally).toBe(true);

    vapiHandlers.clear();
    vi.clearAllMocks();
    mockVapi.start.mockResolvedValue(undefined);
    await act(async () => { await result.current.start(baseConfig); });
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.callEndedNaturally).toBe(false);
  });

  it("start() falls back to idle when vapi.start throws", async () => {
    mockVapi.start.mockRejectedValueOnce(new Error("network error"));
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    expect(result.current.status).toBe("idle");
  });
});

// ---------------------------------------------------------------------------
describe("useVapiTechnicalInterview — transcript handling", () => {
  beforeEach(() => {
    vapiHandlers.clear();
    vi.clearAllMocks();
    mockVapi.start.mockResolvedValue(undefined);
    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it("appends final transcript messages for both roles", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    act(() => {
      emit("call-start");
      emit("message", { type: "transcript", transcriptType: "final", role: "assistant", transcript: "Here is the first question." });
      emit("message", { type: "transcript", transcriptType: "final", role: "user", transcript: "I would use a REST API." });
    });
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({ role: "assistant", text: "Here is the first question." });
    expect(result.current.messages[1]).toMatchObject({ role: "user", text: "I would use a REST API." });
  });

  it("ignores partial (non-final) transcript messages", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    act(() => {
      emit("call-start");
      emit("message", { type: "transcript", transcriptType: "partial", role: "user", transcript: "I would..." });
      emit("message", { type: "transcript", transcriptType: "partial", role: "user", transcript: "I would use..." });
    });
    expect(result.current.messages).toHaveLength(0);
  });

  it("ignores non-transcript message types", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    act(() => {
      emit("call-start");
      emit("message", { type: "function-call", role: "assistant", transcript: "irrelevant" });
      emit("message", { type: "hang", role: "assistant" });
    });
    expect(result.current.messages).toHaveLength(0);
  });

  it("accumulates messages across multiple speech turns correctly", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    act(() => {
      emit("call-start");
      for (let i = 0; i < 6; i++) {
        emit("message", {
          type: "transcript",
          transcriptType: "final",
          role: i % 2 === 0 ? "assistant" : "user",
          transcript: `Turn ${i}`,
        });
      }
    });
    expect(result.current.messages).toHaveLength(6);
    expect(result.current.messages[5]).toMatchObject({ role: "user", text: "Turn 5" });
  });

  it("each transcript message has a numeric timestamp", async () => {
    const before = Date.now();
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    act(() => {
      emit("call-start");
      emit("message", { type: "transcript", transcriptType: "final", role: "assistant", transcript: "Hello." });
    });
    const after = Date.now();
    const ts = result.current.messages[0]!.timestamp;
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

// ---------------------------------------------------------------------------
describe("useVapiTechnicalInterview — mute control", () => {
  beforeEach(() => {
    vapiHandlers.clear();
    vi.clearAllMocks();
    mockVapi.start.mockResolvedValue(undefined);
    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it("toggleMute inverts isMuted and calls vapi.setMuted", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    act(() => emit("call-start"));

    act(() => { result.current.toggleMute(); });
    expect(result.current.isMuted).toBe(true);
    expect(mockVapi.setMuted).toHaveBeenLastCalledWith(true);

    act(() => { result.current.toggleMute(); });
    expect(result.current.isMuted).toBe(false);
    expect(mockVapi.setMuted).toHaveBeenLastCalledWith(false);
  });
});

// ---------------------------------------------------------------------------
describe("useVapiTechnicalInterview — volume level", () => {
  beforeEach(() => {
    vapiHandlers.clear();
    vi.clearAllMocks();
    mockVapi.start.mockResolvedValue(undefined);
    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it("updates volumeLevel from Vapi events", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    act(() => emit("volume-level", 0.75));
    expect(result.current.volumeLevel).toBe(0.75);
  });

  it("handles rapid volume updates without stale state", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    act(() => {
      emit("volume-level", 0.1);
      emit("volume-level", 0.5);
      emit("volume-level", 0.9);
    });
    expect(result.current.volumeLevel).toBe(0.9);
  });
});

// ---------------------------------------------------------------------------
describe("useVapiTechnicalInterview — evaluateTranscript()", () => {
  const mockEvaluate = vi.mocked(evaluateVapiInterview);

  const mockResult = {
    score: 80,
    communication: 75,
    technicalAccuracy: 85,
    problemSolving: 80,
    strengths: ["Clear explanations"],
    improvements: ["More depth on tradeoffs"],
    nextSteps: ["Practice system design"],
    questionBreakdown: [],
  };

  beforeEach(() => {
    vapiHandlers.clear();
    vi.clearAllMocks();
    mockVapi.start.mockResolvedValue(undefined);
    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it("returns null without calling API when fewer than 2 messages", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    const transcript = [{ role: "assistant" as const, text: "Q1", timestamp: 1 }];
    let res: Awaited<ReturnType<typeof result.current.evaluateTranscript>>;
    await act(async () => { res = await result.current.evaluateTranscript(transcript, baseConfig); });
    expect(res!).toBeNull();
    expect(mockEvaluate).not.toHaveBeenCalled();
  });

  it("returns null without calling API for empty transcript", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    let res: Awaited<ReturnType<typeof result.current.evaluateTranscript>>;
    await act(async () => { res = await result.current.evaluateTranscript([], baseConfig); });
    expect(res!).toBeNull();
    expect(mockEvaluate).not.toHaveBeenCalled();
  });

  it("sets isAnalyzing=true during evaluation and resets to false after", async () => {
    let resolveFn!: (v: unknown) => void;
    mockEvaluate.mockReturnValueOnce(new Promise((r) => { resolveFn = r; }) as ReturnType<typeof mockEvaluate>);

    const { result } = renderHook(() => useVapiTechnicalInterview());
    const transcript = [
      { role: "assistant" as const, text: "Q1", timestamp: 1 },
      { role: "user" as const, text: "A1", timestamp: 2 },
    ];

    let evalPromise!: Promise<unknown>;
    act(() => { evalPromise = result.current.evaluateTranscript(transcript, baseConfig); });
    expect(result.current.isAnalyzing).toBe(true);

    await act(async () => {
      resolveFn({ result: mockResult, id: "interview-1" });
      await evalPromise;
    });
    expect(result.current.isAnalyzing).toBe(false);
  });

  it("passes config fields correctly to evaluateVapiInterview", async () => {
    mockEvaluate.mockResolvedValueOnce({ result: mockResult, id: "interview-1" });
    const { result } = renderHook(() => useVapiTechnicalInterview());
    const transcript = [
      { role: "assistant" as const, text: "Q1", timestamp: 1 },
      { role: "user" as const, text: "A1", timestamp: 2 },
    ];
    await act(async () => { await result.current.evaluateTranscript(transcript, baseConfig); });
    expect(mockEvaluate).toHaveBeenCalledWith(
      transcript,
      expect.objectContaining({
        role: "backend",
        difficulty: 50,
        experienceLevel: 50,
        strictness: 50,
        questionType: "technical",
      })
    );
  });

  it("returns { result, id } on success", async () => {
    mockEvaluate.mockResolvedValueOnce({ result: mockResult, id: "interview-42" });
    const { result } = renderHook(() => useVapiTechnicalInterview());
    const transcript = [
      { role: "assistant" as const, text: "Q1", timestamp: 1 },
      { role: "user" as const, text: "A1", timestamp: 2 },
    ];
    let res: Awaited<ReturnType<typeof result.current.evaluateTranscript>>;
    await act(async () => { res = await result.current.evaluateTranscript(transcript, baseConfig); });
    expect(res!).toEqual({ result: mockResult, id: "interview-42" });
  });

  it("returns null and resets isAnalyzing when API throws", async () => {
    mockEvaluate.mockRejectedValueOnce(new Error("OpenAI timeout"));
    const { result } = renderHook(() => useVapiTechnicalInterview());
    const transcript = [
      { role: "assistant" as const, text: "Q1", timestamp: 1 },
      { role: "user" as const, text: "A1", timestamp: 2 },
    ];
    let res: Awaited<ReturnType<typeof result.current.evaluateTranscript>>;
    await act(async () => { res = await result.current.evaluateTranscript(transcript, baseConfig); });
    expect(res!).toBeNull();
    expect(result.current.isAnalyzing).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe("useVapiTechnicalInterview — start() config passed to vapi", () => {
  beforeEach(() => {
    vapiHandlers.clear();
    vi.clearAllMocks();
    mockVapi.start.mockResolvedValue(undefined);
    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it("calls vapi.start with an assistant config containing the question list", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    const config: VapiTechnicalConfig = {
      ...baseConfig,
      questions: ["Question Alpha", "Question Beta", "Question Gamma"],
    };
    await act(async () => { await result.current.start(config); });
    expect(mockVapi.start).toHaveBeenCalledOnce();
    const passedConfig = mockVapi.start.mock.calls[0]![0] as { model: { messages: { content: string }[] } };
    const systemPrompt = passedConfig.model.messages[0]!.content;
    expect(systemPrompt).toContain("Question Alpha");
    expect(systemPrompt).toContain("Question Beta");
    expect(systemPrompt).toContain("Question Gamma");
  });

  it("hard difficulty embeds 'hard' instructions in system prompt", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start({ ...baseConfig, difficulty: 80 }); });
    const systemPrompt = (mockVapi.start.mock.calls[0]![0] as { model: { messages: { content: string }[] } })
      .model.messages[0]!.content;
    expect(systemPrompt).toMatch(/hard/i);
    expect(systemPrompt).toMatch(/edge cases|failure modes|production/i);
  });

  it("selectedTopics adds TOPIC FOCUS section to system prompt", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => {
      await result.current.start({ ...baseConfig, selectedTopics: ["dynamic-programming", "recursion"] });
    });
    const systemPrompt = (mockVapi.start.mock.calls[0]![0] as { model: { messages: { content: string }[] } })
      .model.messages[0]!.content;
    expect(systemPrompt).toContain("TOPIC FOCUS");
    expect(systemPrompt).toContain("Dynamic Programming");
    expect(systemPrompt).toContain("Recursion & Backtracking");
  });

  it("system-design topic adds architecture follow-up instructions", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => {
      await result.current.start({ ...baseConfig, selectedTopics: ["system-design"] });
    });
    const systemPrompt = (mockVapi.start.mock.calls[0]![0] as { model: { messages: { content: string }[] } })
      .model.messages[0]!.content;
    expect(systemPrompt).toContain("System Design");
    expect(systemPrompt).toMatch(/architecture|design follow-up|scale/i);
  });

  it("firstMessage includes the first question verbatim", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    const config = { ...baseConfig, questions: ["Describe the event loop in Node.js", "Q2", "Q3"] };
    await act(async () => { await result.current.start(config); });
    const passed = mockVapi.start.mock.calls[0]![0] as { firstMessage: string };
    expect(passed.firstMessage).toContain("Describe the event loop in Node.js");
  });

  it("cleans up all Vapi event listeners on unmount", async () => {
    const { result, unmount } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(baseConfig); });
    unmount();
    expect(mockVapi.removeListener).toHaveBeenCalledWith("call-start", expect.any(Function));
    expect(mockVapi.removeListener).toHaveBeenCalledWith("call-end", expect.any(Function));
    expect(mockVapi.removeListener).toHaveBeenCalledWith("speech-start", expect.any(Function));
    expect(mockVapi.removeListener).toHaveBeenCalledWith("speech-end", expect.any(Function));
    expect(mockVapi.removeListener).toHaveBeenCalledWith("message", expect.any(Function));
    expect(mockVapi.removeListener).toHaveBeenCalledWith("volume-level", expect.any(Function));
  });
});
