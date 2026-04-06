import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  useVapiInterview,
  getDifficultyLabel,
  getExperienceLabel,
  getStrictnessLabel,
} from "../../hooks/useVapiInterview";
import type { VapiInterviewConfig } from "../../hooks/useVapiInterview";
import { evaluateVapiInterview } from "../../services/api";

// ---------------------------------------------------------------------------
// Vapi mock — must use vi.hoisted so mockVapi is available in vi.mock factory
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
      start: vi.fn().mockResolvedValue({ id: "call-123" }),
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

// Mock the API evaluate call
vi.mock("../../services/api", () => ({
  evaluateVapiInterview: vi.fn(),
}));

// AudioContext required by start()
class MockAudioContext {
  state = "running";
  resume = vi.fn().mockResolvedValue(undefined);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const minimalConfig: VapiInterviewConfig = {
  role: "frontend",
  difficulty: 50,
  experienceLevel: 50,
  strictness: 50,
  questionType: "behavioral",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useVapiInterview — state machine", () => {
  beforeEach(() => {
    vapiHandlers.clear();
    vi.clearAllMocks();
    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts in idle state with no messages", () => {
    const { result } = renderHook(() => useVapiInterview());
    expect(result.current.status).toBe("idle");
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isListening).toBe(false);
    expect(result.current.isMuted).toBe(false);
  });

  it("call-start → status=active, isListening=true, isMuted=false", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => emit("call-start"));
    expect(result.current.status).toBe("active");
    expect(result.current.isListening).toBe(true);
    expect(result.current.isMuted).toBe(false);
    expect(mockVapi.setMuted).toHaveBeenCalledWith(false);
  });

  it("call-end → status=ended, isSpeaking=false, isListening=false, callEndedNaturally=true", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => emit("call-start"));
    act(() => emit("call-end"));
    expect(result.current.status).toBe("ended");
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isListening).toBe(false);
    expect(result.current.callEndedNaturally).toBe(true);
  });

  it("speech-start → isSpeaking=true, isListening=false", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => emit("call-start"));
    act(() => emit("speech-start"));
    expect(result.current.isSpeaking).toBe(true);
    expect(result.current.isListening).toBe(false);
  });

  it("speech-end → isSpeaking=false, isListening=true", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => emit("call-start"));
    act(() => emit("speech-start"));
    act(() => emit("speech-end"));
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isListening).toBe(true);
  });

  it("rapid speech-start → speech-end cycle ends with isListening=true", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => emit("call-start"));
    act(() => {
      emit("speech-start");
      emit("speech-end");
      emit("speech-start");
      emit("speech-end");
    });
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isListening).toBe(true);
  });

  it("volume-level event updates volumeLevel", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => emit("volume-level", 0.75));
    expect(result.current.volumeLevel).toBe(0.75);
  });

  it("message with type=transcript and transcriptType=final appends to messages", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() =>
      emit("message", {
        type: "transcript",
        transcriptType: "final",
        role: "user",
        transcript: "Hello world",
      })
    );
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]!.text).toBe("Hello world");
    expect(result.current.messages[0]!.role).toBe("user");
  });

  it("message with transcriptType=partial is silently ignored", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() =>
      emit("message", {
        type: "transcript",
        transcriptType: "partial",
        role: "user",
        transcript: "in progress",
      })
    );
    expect(result.current.messages).toHaveLength(0);
  });

  it("message with type other than 'transcript' is silently ignored", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => emit("message", { type: "function-call", role: "assistant", transcript: "" }));
    expect(result.current.messages).toHaveLength(0);
  });

  it("multiple final transcript messages accumulate in order", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => {
      emit("message", { type: "transcript", transcriptType: "final", role: "assistant", transcript: "Q1" });
      emit("message", { type: "transcript", transcriptType: "final", role: "user", transcript: "A1" });
    });
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]!.text).toBe("Q1");
    expect(result.current.messages[1]!.text).toBe("A1");
  });

  it("duplicate final message is still appended (no deduplication)", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => {
      emit("message", { type: "transcript", transcriptType: "final", role: "user", transcript: "same" });
      emit("message", { type: "transcript", transcriptType: "final", role: "user", transcript: "same" });
    });
    expect(result.current.messages).toHaveLength(2);
  });

  it("all Vapi listeners are removed on unmount", () => {
    const { unmount } = renderHook(() => useVapiInterview());
    const registeredEvents = mockVapi.on.mock.calls.map((c) => c[0]);
    unmount();
    const removedEvents = mockVapi.removeListener.mock.calls.map((c) => c[0]);
    expect(removedEvents.sort()).toEqual(registeredEvents.sort());
  });
});

// ---------------------------------------------------------------------------
describe("useVapiInterview — toggleMute", () => {
  beforeEach(() => {
    vapiHandlers.clear();
    vi.clearAllMocks();
  });

  it("toggleMute sets isMuted=true and calls vapi.setMuted(true)", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => result.current.toggleMute());
    expect(result.current.isMuted).toBe(true);
    expect(mockVapi.setMuted).toHaveBeenCalledWith(true);
  });

  it("double-toggle returns to isMuted=false", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => result.current.toggleMute());
    act(() => result.current.toggleMute());
    expect(result.current.isMuted).toBe(false);
    expect(mockVapi.setMuted).toHaveBeenLastCalledWith(false);
  });

  it("triple-toggle ends at isMuted=true", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => { result.current.toggleMute(); result.current.toggleMute(); result.current.toggleMute(); });
    expect(result.current.isMuted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe("useVapiInterview — stop()", () => {
  beforeEach(() => {
    vapiHandlers.clear();
    vi.clearAllMocks();
    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("stop() resets all active state and calls vapi.stop()", async () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => emit("call-start"));
    act(() => emit("speech-start"));
    act(() => result.current.toggleMute());
    act(() => result.current.stop());
    expect(result.current.status).toBe("ended");
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isListening).toBe(false);
    expect(result.current.isMuted).toBe(false);
    expect(mockVapi.stop).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
describe("useVapiInterview — start()", () => {
  beforeEach(() => {
    vapiHandlers.clear();
    vi.clearAllMocks();
    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("start() immediately sets status=connecting and clears state", async () => {
    const { result } = renderHook(() => useVapiInterview());
    // Pre-load some messages
    act(() => emit("message", { type: "transcript", transcriptType: "final", role: "user", transcript: "old" }));
    await act(async () => result.current.start(minimalConfig));
    expect(result.current.status).toBe("connecting");
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.callEndedNaturally).toBe(false);
  });

  it("start() reverts status to idle when vapi.start() throws", async () => {
    mockVapi.start.mockRejectedValueOnce(new Error("WebRTC failed"));
    const { result } = renderHook(() => useVapiInterview());
    await act(async () => result.current.start(minimalConfig));
    expect(result.current.status).toBe("idle");
  });
});

// ---------------------------------------------------------------------------
describe("useVapiInterview — evaluateTranscript()", () => {
  const mockEvaluate = vi.mocked(evaluateVapiInterview);

  beforeEach(() => {
    vapiHandlers.clear();
    vi.clearAllMocks();
  });

  it("returns null without calling API when transcript has fewer than 2 messages", async () => {
    const { result } = renderHook(() => useVapiInterview());
    const singleMsg = [{ role: "assistant" as const, text: "hi", timestamp: 1 }];
    let res: Awaited<ReturnType<typeof result.current.evaluateTranscript>>;
    await act(async () => { res = await result.current.evaluateTranscript(singleMsg, minimalConfig); });
    expect(res!).toBeNull();
    expect(mockEvaluate).not.toHaveBeenCalled();
  });

  it("returns null without calling API for empty transcript", async () => {
    const { result } = renderHook(() => useVapiInterview());
    let res: Awaited<ReturnType<typeof result.current.evaluateTranscript>>;
    await act(async () => { res = await result.current.evaluateTranscript([], minimalConfig); });
    expect(res!).toBeNull();
    expect(mockEvaluate).not.toHaveBeenCalled();
  });

  it("sets isAnalyzing=true during evaluation and false after", async () => {
    const fakeResult = { score: 80, communication: 70, technicalAccuracy: 85, problemSolving: 75, strengths: [], improvements: [], nextSteps: [], questionBreakdown: [] };
    let resolveEval!: (v: unknown) => void;
    mockEvaluate.mockReturnValueOnce(new Promise((r) => (resolveEval = r)));

    const msgs = [
      { role: "assistant" as const, text: "Q", timestamp: 1 },
      { role: "user" as const, text: "A", timestamp: 2 },
    ];
    const { result } = renderHook(() => useVapiInterview());

    let evalPromise: Promise<unknown>;
    act(() => { evalPromise = result.current.evaluateTranscript(msgs, minimalConfig); });
    expect(result.current.isAnalyzing).toBe(true);

    await act(async () => { resolveEval({ result: fakeResult, id: "abc" }); await evalPromise; });
    expect(result.current.isAnalyzing).toBe(false);
  });

  it("returns { result, id } on successful evaluation", async () => {
    const fakeResult = { score: 80, communication: 70, technicalAccuracy: 85, problemSolving: 75, strengths: [], improvements: [], nextSteps: [], questionBreakdown: [] };
    mockEvaluate.mockResolvedValueOnce({ result: fakeResult, id: "interview-99" });

    const msgs = [
      { role: "assistant" as const, text: "Q", timestamp: 1 },
      { role: "user" as const, text: "A", timestamp: 2 },
    ];
    const { result } = renderHook(() => useVapiInterview());
    let res: Awaited<ReturnType<typeof result.current.evaluateTranscript>>;
    await act(async () => { res = await result.current.evaluateTranscript(msgs, minimalConfig); });
    expect(res).toEqual({ result: fakeResult, id: "interview-99" });
  });

  it("returns null and resets isAnalyzing when API throws", async () => {
    mockEvaluate.mockRejectedValueOnce(new Error("Network error"));
    const msgs = [
      { role: "assistant" as const, text: "Q", timestamp: 1 },
      { role: "user" as const, text: "A", timestamp: 2 },
    ];
    const { result } = renderHook(() => useVapiInterview());
    let res: Awaited<ReturnType<typeof result.current.evaluateTranscript>>;
    await act(async () => { res = await result.current.evaluateTranscript(msgs, minimalConfig); });
    expect(res!).toBeNull();
    expect(result.current.isAnalyzing).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe("useVapiInterview — edge cases: real-time state", () => {
  beforeEach(() => {
    vapiHandlers.clear();
    vi.clearAllMocks();
    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("rapid event burst: call-start → speech-start → speech-end → speech-start → call-end ends in ended state", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => {
      emit("call-start");
      emit("speech-start");
      emit("speech-end");
      emit("speech-start");
      emit("call-end");
    });
    expect(result.current.status).toBe("ended");
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isListening).toBe(false);
  });

  it("speaking → listening mid-update: speech-end after speech-start restores isListening", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => emit("call-start"));
    act(() => emit("speech-start"));
    expect(result.current.isSpeaking).toBe(true);
    expect(result.current.isListening).toBe(false);
    act(() => emit("speech-end"));
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isListening).toBe(true);
  });

  it("multiple volume-level events in burst: last value wins", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => {
      emit("volume-level", 0.1);
      emit("volume-level", 0.5);
      emit("volume-level", 0.9);
      emit("volume-level", 0.3);
    });
    expect(result.current.volumeLevel).toBe(0.3);
  });

  it("null message payload is silently ignored (no crash)", () => {
    const { result } = renderHook(() => useVapiInterview());
    expect(() => act(() => emit("message", null))).not.toThrow();
    expect(result.current.messages).toHaveLength(0);
  });

  it("message with empty transcript string is still appended if final", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() =>
      emit("message", {
        type: "transcript",
        transcriptType: "final",
        role: "user",
        transcript: "",
      })
    );
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]!.text).toBe("");
  });

  it("10 rapid final transcript messages all accumulate in order", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => {
      for (let i = 0; i < 10; i++) {
        emit("message", {
          type: "transcript",
          transcriptType: "final",
          role: i % 2 === 0 ? "assistant" : "user",
          transcript: `msg-${i}`,
        });
      }
    });
    expect(result.current.messages).toHaveLength(10);
    expect(result.current.messages[0]!.text).toBe("msg-0");
    expect(result.current.messages[9]!.text).toBe("msg-9");
  });

  it("toggleMute during speech-start: isMuted persists after speech state changes", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => emit("call-start"));
    act(() => emit("speech-start"));
    act(() => result.current.toggleMute());
    expect(result.current.isMuted).toBe(true);
    act(() => emit("speech-end"));
    // isMuted should not be reset by speech-end
    expect(result.current.isMuted).toBe(true);
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isListening).toBe(true);
  });

  it("stop() called while speech is active resets all state cleanly", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => emit("call-start"));
    act(() => emit("speech-start"));
    act(() => result.current.toggleMute());
    act(() => result.current.stop());
    expect(result.current.status).toBe("ended");
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isListening).toBe(false);
    expect(result.current.isMuted).toBe(false);
    expect(mockVapi.stop).toHaveBeenCalledOnce();
  });

  it("start() during active call: clears messages from previous session", async () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() =>
      emit("message", {
        type: "transcript",
        transcriptType: "final",
        role: "user",
        transcript: "from last session",
      })
    );
    expect(result.current.messages).toHaveLength(1);
    await act(async () => result.current.start(minimalConfig));
    expect(result.current.messages).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
describe("useVapiInterview — stress cases: transcript accumulation", () => {
  beforeEach(() => {
    vapiHandlers.clear();
    vi.clearAllMocks();
  });

  it("100 final messages accumulate without loss", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => {
      for (let i = 0; i < 100; i++) {
        emit("message", {
          type: "transcript",
          transcriptType: "final",
          role: "user",
          transcript: `line ${i}`,
        });
      }
    });
    expect(result.current.messages).toHaveLength(100);
    expect(result.current.messages[99]!.text).toBe("line 99");
  });

  it("interleaved partial and final messages: only finals are kept", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => {
      for (let i = 0; i < 5; i++) {
        emit("message", {
          type: "transcript",
          transcriptType: "partial",
          role: "user",
          transcript: `partial ${i}`,
        });
        emit("message", {
          type: "transcript",
          transcriptType: "final",
          role: "user",
          transcript: `final ${i}`,
        });
      }
    });
    expect(result.current.messages).toHaveLength(5);
    result.current.messages.forEach((m, i) => {
      expect(m.text).toBe(`final ${i}`);
    });
  });
});

// ---------------------------------------------------------------------------
describe("useVapiInterview — race conditions", () => {
  const mockEvaluate = vi.mocked(evaluateVapiInterview);

  beforeEach(() => {
    vapiHandlers.clear();
    vi.clearAllMocks();
    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("speech-start fires twice without speech-end: isSpeaking stays true", () => {
    const { result } = renderHook(() => useVapiInterview());
    act(() => emit("call-start"));
    act(() => {
      emit("speech-start");
      emit("speech-start"); // duplicate — no crash, state unchanged
    });
    expect(result.current.isSpeaking).toBe(true);
    expect(result.current.isListening).toBe(false);
  });

  it("transcript arrives while isSpeaking=true: message is still appended", () => {
    // Real Vapi sends transcripts during speaking (AI reads back user's words)
    const { result } = renderHook(() => useVapiInterview());
    act(() => emit("call-start"));
    act(() => emit("speech-start"));
    expect(result.current.isSpeaking).toBe(true);
    act(() =>
      emit("message", {
        type: "transcript",
        transcriptType: "final",
        role: "user",
        transcript: "arrived during speaking",
      })
    );
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]!.text).toBe("arrived during speaking");
  });

  it("call-end fires after stop(): callEndedNaturally is set true by the late event", () => {
    // stop() sets ended without callEndedNaturally=true; call-end arriving later sets it
    const { result } = renderHook(() => useVapiInterview());
    act(() => emit("call-start"));
    act(() => result.current.stop());
    expect(result.current.status).toBe("ended");
    expect(result.current.callEndedNaturally).toBe(false);
    // Vapi fires call-end asynchronously even after stop() — must not crash
    act(() => emit("call-end"));
    expect(result.current.status).toBe("ended");
    expect(result.current.callEndedNaturally).toBe(true);
  });

  it("late transcript arrives after call-end: still appended (no status guard in onMessage)", () => {
    // Vapi can deliver a final transcript after the call-end event in practice
    const { result } = renderHook(() => useVapiInterview());
    act(() => emit("call-start"));
    act(() => emit("call-end"));
    expect(result.current.status).toBe("ended");
    act(() =>
      emit("message", {
        type: "transcript",
        transcriptType: "final",
        role: "user",
        transcript: "late message",
      })
    );
    expect(result.current.messages).toHaveLength(1);
  });

  it("stop() during in-flight evaluateTranscript: isAnalyzing resets once evaluate settles", async () => {
    let resolveEval!: (v: unknown) => void;
    mockEvaluate.mockReturnValueOnce(new Promise((r) => (resolveEval = r)));

    const msgs = [
      { role: "assistant" as const, text: "Q", timestamp: 1 },
      { role: "user" as const, text: "A", timestamp: 2 },
    ];
    const { result } = renderHook(() => useVapiInterview());

    let evalPromise!: Promise<unknown>;
    act(() => { evalPromise = result.current.evaluateTranscript(msgs, minimalConfig); });
    expect(result.current.isAnalyzing).toBe(true);

    // User clicks stop while analysis is in flight
    act(() => result.current.stop());
    expect(result.current.status).toBe("ended");
    // isAnalyzing is still true — evaluate is still running
    expect(result.current.isAnalyzing).toBe(true);

    // Evaluation resolves after stop
    await act(async () => {
      resolveEval({ result: { score: 70, communication: 65, technicalAccuracy: 75, problemSolving: 70, strengths: [], improvements: [], nextSteps: [], questionBreakdown: [] }, id: "x" });
      await evalPromise;
    });
    expect(result.current.isAnalyzing).toBe(false);
  });

  it("concurrent evaluateTranscript calls: both settle independently, isAnalyzing ends at false", async () => {
    let resolve1!: (v: unknown) => void;
    let resolve2!: (v: unknown) => void;
    const fakeResult = { score: 70, communication: 65, technicalAccuracy: 75, problemSolving: 70, strengths: [], improvements: [], nextSteps: [], questionBreakdown: [] };
    mockEvaluate
      .mockReturnValueOnce(new Promise((r) => (resolve1 = r)))
      .mockReturnValueOnce(new Promise((r) => (resolve2 = r)));

    const msgs = [
      { role: "assistant" as const, text: "Q", timestamp: 1 },
      { role: "user" as const, text: "A", timestamp: 2 },
    ];
    const { result } = renderHook(() => useVapiInterview());

    let p1!: Promise<unknown>, p2!: Promise<unknown>;
    act(() => { p1 = result.current.evaluateTranscript(msgs, minimalConfig); });
    act(() => { p2 = result.current.evaluateTranscript(msgs, minimalConfig); });

    await act(async () => {
      resolve1({ result: fakeResult, id: "first" });
      resolve2({ result: fakeResult, id: "second" });
      await Promise.all([p1, p2]);
    });
    expect(result.current.isAnalyzing).toBe(false);
  });

  it("start() called twice rapidly: vapi.start is called twice, status remains connecting", async () => {
    mockVapi.start.mockResolvedValue({ id: "call-123" });
    const { result } = renderHook(() => useVapiInterview());
    await act(async () => {
      result.current.start(minimalConfig);
      result.current.start(minimalConfig);
    });
    expect(mockVapi.start).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("connecting");
    expect(result.current.messages).toHaveLength(0);
  });

  it("volume-level fires during idle (before call-start): volumeLevel state updates", () => {
    const { result } = renderHook(() => useVapiInterview());
    expect(result.current.status).toBe("idle");
    act(() => emit("volume-level", 0.42));
    expect(result.current.volumeLevel).toBe(0.42);
  });
});

// ---------------------------------------------------------------------------
describe("getDifficultyLabel / getExperienceLabel / getStrictnessLabel", () => {
  it.each([
    [0, "Easy"], [30, "Easy"], [31, "Medium"], [60, "Medium"], [61, "Hard"], [100, "Hard"],
  ])("getDifficultyLabel(%i) → %s", (val, expected) => {
    expect(getDifficultyLabel(val)).toBe(expected);
  });

  it.each([
    [0, "Junior"], [30, "Junior"], [31, "Mid-Level"], [60, "Mid-Level"], [61, "Senior"],
  ])("getExperienceLabel(%i) → %s", (val, expected) => {
    expect(getExperienceLabel(val)).toBe(expected);
  });

  it.each([
    [0, "Lenient"], [30, "Lenient"], [31, "Fair"], [60, "Fair"], [61, "Strict"],
  ])("getStrictnessLabel(%i) → %s", (val, expected) => {
    expect(getStrictnessLabel(val)).toBe(expected);
  });
});
