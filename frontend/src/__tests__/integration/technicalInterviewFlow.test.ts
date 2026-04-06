import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useVapiTechnicalInterview } from "../../hooks/useVapiTechnicalInterview";
import type { VapiTechnicalConfig } from "../../hooks/useVapiTechnicalInterview";
import { evaluateVapiInterview } from "../../services/api";

// ---------------------------------------------------------------------------
// Full-session integration: exercises the hook through a realistic interview
// lifecycle — start → AI speaks → user answers (×3) → call ends → evaluate
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

function sendMessage(role: "assistant" | "user", text: string) {
  emit("message", { type: "transcript", transcriptType: "final", role, transcript: text });
}

vi.mock("../../lib/vapi", () => ({ vapi: mockVapi }));
vi.mock("../../services/api", () => ({ evaluateVapiInterview: vi.fn() }));

class MockAudioContext {
  state = "running";
  resume = vi.fn().mockResolvedValue(undefined);
}

const mockEvaluate = vi.mocked(evaluateVapiInterview);

const mockAnalysisResult = {
  score: 75,
  communication: 70,
  technicalAccuracy: 80,
  problemSolving: 75,
  strengths: ["Good problem decomposition"],
  improvements: ["More concrete examples"],
  nextSteps: ["Practice system design"],
  questionBreakdown: [
    { question: "What is a closure?", candidateAnswer: "A function with...", score: 75, feedback: "Solid" },
    { question: "Explain async/await", candidateAnswer: "It is syntax sugar...", score: 78, feedback: "Good" },
    { question: "What is a memory leak?", candidateAnswer: "When memory is...", score: 72, feedback: "Acceptable" },
  ],
};

const sessionConfig: VapiTechnicalConfig = {
  role: "frontend",
  difficulty: 50,
  experienceLevel: 50,
  strictness: 50,
  questionType: "technical",
  questions: ["What is a closure?", "Explain async/await", "What is a memory leak?"],
  level: "mid",
  interviewer: "cassidy",
};

// ---------------------------------------------------------------------------
describe("Technical interview — full session lifecycle", () => {
  beforeEach(() => {
    vapiHandlers.clear();
    vi.clearAllMocks();
    mockVapi.start.mockResolvedValue(undefined);
    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it("completes a full 3-question session and produces an evaluation", async () => {
    mockEvaluate.mockResolvedValueOnce({ result: mockAnalysisResult, id: "session-001" });

    const { result } = renderHook(() => useVapiTechnicalInterview());

    // Phase 1: Start the interview
    await act(async () => { await result.current.start(sessionConfig); });
    expect(result.current.status).toBe("connecting");

    // Phase 2: Connection established
    act(() => emit("call-start"));
    expect(result.current.status).toBe("active");
    expect(result.current.isListening).toBe(true);
    expect(result.current.isMuted).toBe(false);

    // Phase 3: Q1 — AI asks question, user answers
    act(() => {
      emit("speech-start");
      sendMessage("assistant", "What is a closure?");
      emit("speech-end");
    });
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isListening).toBe(true);

    act(() => sendMessage("user", "A closure is a function that retains access to its outer scope."));

    // Phase 4: Q2 — AI follow-up + next question
    act(() => {
      emit("speech-start");
      sendMessage("assistant", "Good. Can you give an example from your code?");
      emit("speech-end");
    });
    act(() => sendMessage("user", "Sure. In React I use closures in useCallback to capture state."));

    act(() => {
      emit("speech-start");
      sendMessage("assistant", "Explain async/await.");
      emit("speech-end");
    });
    act(() => sendMessage("user", "It is syntax sugar over Promises that makes async code look synchronous."));

    // Phase 5: Q3
    act(() => {
      emit("speech-start");
      sendMessage("assistant", "What is a memory leak?");
      emit("speech-end");
    });
    act(() => sendMessage("user", "When memory is allocated but never freed, causing the heap to grow."));

    // Verify transcript accumulated correctly
    expect(result.current.messages).toHaveLength(8);
    const assistantTurns = result.current.messages.filter((m) => m.role === "assistant");
    const userTurns = result.current.messages.filter((m) => m.role === "user");
    expect(assistantTurns).toHaveLength(4);
    expect(userTurns).toHaveLength(4);

    // Phase 6: Call ends naturally
    act(() => emit("call-end"));
    expect(result.current.status).toBe("ended");
    expect(result.current.callEndedNaturally).toBe(true);

    // Phase 7: Evaluate transcript
    let evalResult: Awaited<ReturnType<typeof result.current.evaluateTranscript>>;
    await act(async () => {
      evalResult = await result.current.evaluateTranscript(result.current.messages, sessionConfig);
    });

    expect(evalResult!).not.toBeNull();
    expect(evalResult!.id).toBe("session-001");
    expect(evalResult!.result.score).toBe(75);
    expect(result.current.isAnalyzing).toBe(false);
  });

  it("user mutes and unmutes mid-interview without disrupting transcript collection", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(sessionConfig); });
    act(() => emit("call-start"));

    // AI asks question
    act(() => {
      emit("speech-start");
      sendMessage("assistant", "What is a closure?");
      emit("speech-end");
    });

    // User mutes before answering
    act(() => { result.current.toggleMute(); });
    expect(result.current.isMuted).toBe(true);
    expect(mockVapi.setMuted).toHaveBeenCalledWith(true);

    // Final transcript still arrives (Vapi sends it regardless of mute state)
    act(() => sendMessage("user", "A closure captures surrounding scope."));

    // User unmutes
    act(() => { result.current.toggleMute(); });
    expect(result.current.isMuted).toBe(false);

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]!.text).toBe("A closure captures surrounding scope.");
  });

  it("user ends interview early — stop() immediately settles state before call-end event", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(sessionConfig); });
    act(() => emit("call-start"));

    act(() => {
      emit("speech-start");
      sendMessage("assistant", "What is a closure?");
      emit("speech-end");
    });
    act(() => sendMessage("user", "A function that captures outer scope."));

    // User ends early
    act(() => { result.current.stop(); });
    expect(result.current.status).toBe("ended");
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isListening).toBe(false);
    expect(mockVapi.stop).toHaveBeenCalledOnce();

    // call-end fires after stop — should be a no-op on status (already ended)
    act(() => emit("call-end"));
    expect(result.current.status).toBe("ended");
  });

  it("partial transcript messages during the session do not pollute the transcript", async () => {
    const { result } = renderHook(() => useVapiTechnicalInterview());
    await act(async () => { await result.current.start(sessionConfig); });
    act(() => emit("call-start"));

    act(() => {
      // Simulate real Vapi behavior: many partials followed by one final
      for (let i = 0; i < 5; i++) {
        emit("message", { type: "transcript", transcriptType: "partial", role: "user", transcript: "I think..." });
      }
      sendMessage("user", "I think closures are functions that retain their lexical scope.");
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]!.text).toBe("I think closures are functions that retain their lexical scope.");
  });

  it("back-to-back session restart clears prior transcript and state", async () => {
    mockEvaluate.mockResolvedValueOnce({ result: mockAnalysisResult, id: "session-001" });

    const { result } = renderHook(() => useVapiTechnicalInterview());

    // First session
    await act(async () => { await result.current.start(sessionConfig); });
    act(() => {
      emit("call-start");
      sendMessage("assistant", "Q1");
      sendMessage("user", "A1");
      emit("call-end");
    });
    await act(async () => {
      await result.current.evaluateTranscript(result.current.messages, sessionConfig);
    });
    expect(result.current.messages).toHaveLength(2);

    // Second session
    vapiHandlers.clear();
    vi.clearAllMocks();
    mockVapi.start.mockResolvedValue(undefined);

    await act(async () => { await result.current.start(sessionConfig); });
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.callEndedNaturally).toBe(false);
    expect(result.current.status).toBe("connecting");
  });
});
