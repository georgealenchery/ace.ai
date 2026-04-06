import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { VapiInterviewPanel } from "../../components/VapiInterviewPanel";
import type { CallStatus } from "../../hooks/useVapiInterview";

// ---------------------------------------------------------------------------
// Mock the hook — integration tests verify the component responds to state
// ---------------------------------------------------------------------------
const mockStart = vi.fn();
const mockStop = vi.fn();
const mockToggleMute = vi.fn();
const mockEvaluateTranscript = vi.fn().mockResolvedValue(null);

type HookReturn = ReturnType<typeof import("../../hooks/useVapiInterview").useVapiInterview>;

let mockHookState: Partial<HookReturn> = {};

vi.mock("../../hooks/useVapiInterview", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../hooks/useVapiInterview")>();
  return {
    ...actual,
    useVapiInterview: () => ({
      status: "idle" as CallStatus,
      isSpeaking: false,
      isListening: false,
      isMuted: false,
      volumeLevel: 0,
      messages: [],
      isAnalyzing: false,
      callEndedNaturally: false,
      start: mockStart,
      stop: mockStop,
      toggleMute: mockToggleMute,
      evaluateTranscript: mockEvaluateTranscript,
      ...mockHookState,
    }),
  };
});

vi.mock("../../lib/vapi", () => ({
  vapi: { on: vi.fn(), removeListener: vi.fn(), stop: vi.fn(), say: vi.fn() },
}));

vi.mock("react-router", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({
    state: {
      role: "frontend",
      questionType: "behavioral",
      difficulty: 50,
      strictness: 50,
      experienceLevel: 50,
      interviewer: "Cassidy",
    },
  }),
}));

vi.mock("../../services/auth", () => ({
  getUser: vi.fn().mockReturnValue({ id: "1", email: "test@example.com", name: "Test User" }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderPanel() {
  return render(<VapiInterviewPanel />);
}

// ---------------------------------------------------------------------------
describe("VapiInterviewPanel — controls render per status", () => {
  beforeEach(() => {
    mockHookState = {};
    vi.clearAllMocks();
  });

  it("idle: renders Start Interview button", () => {
    renderPanel();
    expect(screen.getByRole("button", { name: /start interview/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /end interview/i })).not.toBeInTheDocument();
  });

  it("connecting: renders spinner, hides start and action buttons", () => {
    mockHookState = { status: "connecting" };
    renderPanel();
    expect(screen.getAllByText(/connecting/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /start interview/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /end interview/i })).not.toBeInTheDocument();
  });

  it("active: renders Mute and End Interview buttons", () => {
    mockHookState = { status: "active", isListening: true };
    renderPanel();
    expect(screen.getByRole("button", { name: /end interview/i })).toBeInTheDocument();
    // Mute button is present (it has title attribute)
    expect(screen.getByTitle(/mute microphone/i)).toBeInTheDocument();
  });

  it("active + isMuted: mute button title says Unmute", () => {
    mockHookState = { status: "active", isMuted: true };
    renderPanel();
    expect(screen.getByTitle(/unmute microphone/i)).toBeInTheDocument();
  });

  it("isAnalyzing: renders analyzing message, hides all other controls", () => {
    mockHookState = { status: "active", isAnalyzing: true };
    renderPanel();
    expect(screen.getAllByText(/analyzing your interview/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /start interview/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /end interview/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
describe("VapiInterviewPanel — button interactions", () => {
  beforeEach(() => {
    mockHookState = {};
    vi.clearAllMocks();
  });

  it("clicking Start Interview calls start() with interview config", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /start interview/i }));
    expect(mockStart).toHaveBeenCalledOnce();
    expect(mockStart).toHaveBeenCalledWith(
      expect.objectContaining({ role: "frontend", questionType: "behavioral" })
    );
  });

  it("clicking End Interview calls stop()", async () => {
    mockHookState = { status: "active", isListening: true };
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /end interview/i }));
    await waitFor(() => expect(mockStop).toHaveBeenCalledOnce());
  });

  it("clicking Mute calls toggleMute()", () => {
    mockHookState = { status: "active", isListening: true };
    renderPanel();
    fireEvent.click(screen.getByTitle(/mute microphone/i));
    expect(mockToggleMute).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
describe("VapiInterviewPanel — status label text", () => {
  beforeEach(() => {
    mockHookState = {};
  });

  it("idle → 'Ready to start'", () => {
    renderPanel();
    expect(screen.getByText("Ready to start")).toBeInTheDocument();
  });

  it("connecting → 'Connecting…'", () => {
    mockHookState = { status: "connecting" };
    renderPanel();
    expect(screen.getAllByText("Connecting…").length).toBeGreaterThan(0);
  });

  it("active + isSpeaking → 'AI is speaking…'", () => {
    mockHookState = { status: "active", isSpeaking: true };
    renderPanel();
    expect(screen.getByText("AI is speaking…")).toBeInTheDocument();
  });

  it("active + isListening → 'Listening to you…'", () => {
    mockHookState = { status: "active", isListening: true };
    renderPanel();
    expect(screen.getByText("Listening to you…")).toBeInTheDocument();
  });

  it("ended → 'Interview ended'", () => {
    mockHookState = { status: "ended" };
    renderPanel();
    expect(screen.getByText("Interview ended")).toBeInTheDocument();
  });

  it("isAnalyzing takes precedence over other states", () => {
    mockHookState = { status: "active", isListening: true, isAnalyzing: true };
    renderPanel();
    expect(screen.getAllByText("Analyzing your interview…").length).toBeGreaterThan(0);
    expect(screen.queryByText("Listening to you…")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
describe("VapiInterviewPanel — transcript area", () => {
  beforeEach(() => {
    mockHookState = {};
  });

  it("shows 'Click Start' prompt when idle with no messages", () => {
    renderPanel();
    expect(screen.getByText(/click start to begin/i)).toBeInTheDocument();
  });

  it("shows 'Waiting for assistant' when active with no messages", () => {
    mockHookState = { status: "active" };
    renderPanel();
    expect(screen.getByText(/waiting for assistant/i)).toBeInTheDocument();
  });

  it("renders transcript messages when present", () => {
    mockHookState = {
      status: "active",
      messages: [
        { role: "assistant", text: "Tell me about yourself", timestamp: 1000 },
        { role: "user", text: "I am a developer", timestamp: 2000 },
      ],
    };
    renderPanel();
    expect(screen.getByText("Tell me about yourself")).toBeInTheDocument();
    expect(screen.getByText("I am a developer")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
describe("VapiInterviewPanel — edge cases: transcript", () => {
  beforeEach(() => {
    mockHookState = {};
    vi.clearAllMocks();
  });

  it("renders all messages when many arrive in succession", () => {
    mockHookState = {
      status: "active",
      messages: Array.from({ length: 10 }, (_, i) => ({
        role: (i % 2 === 0 ? "assistant" : "user") as "assistant" | "user",
        text: `message-${i}`,
        timestamp: 1000 + i * 500,
      })),
    };
    renderPanel();
    for (let i = 0; i < 10; i++) {
      expect(screen.getByText(`message-${i}`)).toBeInTheDocument();
    }
  });

  it("renders duplicate consecutive messages both times (no deduplication in UI)", () => {
    mockHookState = {
      status: "active",
      messages: [
        { role: "user", text: "same message", timestamp: 1000 },
        { role: "user", text: "same message", timestamp: 1001 },
      ],
    };
    renderPanel();
    expect(screen.getAllByText("same message")).toHaveLength(2);
  });

  it("renders a transcript entry with empty text without crashing", () => {
    mockHookState = {
      status: "active",
      messages: [{ role: "assistant", text: "", timestamp: 1000 }],
    };
    expect(() => renderPanel()).not.toThrow();
  });

  it("transcript visible while isListening is true", () => {
    mockHookState = {
      status: "active",
      isListening: true,
      messages: [{ role: "assistant", text: "How are you?", timestamp: 1000 }],
    };
    renderPanel();
    expect(screen.getByText("How are you?")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
describe("VapiInterviewPanel — edge cases: mute + state transitions", () => {
  beforeEach(() => {
    mockHookState = {};
    vi.clearAllMocks();
  });

  it("mute button is accessible while isSpeaking=true", () => {
    mockHookState = { status: "active", isSpeaking: true };
    renderPanel();
    const muteBtn = screen.getByTitle(/mute microphone/i);
    expect(muteBtn).toBeInTheDocument();
    fireEvent.click(muteBtn);
    expect(mockToggleMute).toHaveBeenCalledOnce();
  });

  it("clicking End Interview while isSpeaking calls stop()", async () => {
    mockHookState = { status: "active", isSpeaking: true };
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /end interview/i }));
    await waitFor(() => expect(mockStop).toHaveBeenCalledOnce());
  });

  it("clicking End Interview while isListening calls stop()", async () => {
    mockHookState = { status: "active", isListening: true };
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /end interview/i }));
    await waitFor(() => expect(mockStop).toHaveBeenCalledOnce());
  });

  it("unmute button calls toggleMute when currently muted and speaking", () => {
    mockHookState = { status: "active", isMuted: true, isSpeaking: true };
    renderPanel();
    fireEvent.click(screen.getByTitle(/unmute microphone/i));
    expect(mockToggleMute).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
describe("VapiInterviewPanel — race conditions", () => {
  beforeEach(() => {
    mockHookState = {};
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("isSpeaking=true and isListening=true simultaneously: only AI Speaking label shown", () => {
    mockHookState = { status: "active", isSpeaking: true, isListening: true };
    renderPanel();
    expect(screen.getByText("AI is speaking…")).toBeInTheDocument();
    expect(screen.queryByText("Listening to you…")).not.toBeInTheDocument();
  });

  it("50-message burst renders all entries without crashing", () => {
    mockHookState = {
      status: "active",
      messages: Array.from({ length: 50 }, (_, i) => ({
        role: (i % 2 === 0 ? "assistant" : "user") as "assistant" | "user",
        text: `burst-${i}`,
        timestamp: 1000 + i,
      })),
    };
    expect(() => renderPanel()).not.toThrow();
    expect(screen.getByText("burst-0")).toBeInTheDocument();
    expect(screen.getByText("burst-49")).toBeInTheDocument();
  });

  it("all messages remain in DOM after rapid prop updates (no entries dropped)", () => {
    const { rerender } = render(<VapiInterviewPanel />);
    const makeMessages = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        role: "assistant" as const,
        text: `msg-${i}`,
        timestamp: i,
      }));

    for (let n = 1; n <= 10; n++) {
      mockHookState = { status: "active", messages: makeMessages(n) };
      rerender(<VapiInterviewPanel />);
    }
    // All 10 messages must be present — none dropped during rapid updates
    expect(screen.getAllByText(/^msg-\d+$/)).toHaveLength(10);
    expect(screen.getByText("msg-0")).toBeInTheDocument();
    expect(screen.getByText("msg-9")).toBeInTheDocument();
  });

  it("status flips speaking→listening→speaking in same render cycle: no invalid label", () => {
    const { rerender } = render(<VapiInterviewPanel />);

    mockHookState = { status: "active", isSpeaking: true };
    rerender(<VapiInterviewPanel />);
    expect(screen.getByText("AI is speaking…")).toBeInTheDocument();

    mockHookState = { status: "active", isListening: true };
    rerender(<VapiInterviewPanel />);
    expect(screen.getByText("Listening to you…")).toBeInTheDocument();
    expect(screen.queryByText("AI is speaking…")).not.toBeInTheDocument();

    mockHookState = { status: "active", isSpeaking: true };
    rerender(<VapiInterviewPanel />);
    expect(screen.getByText("AI is speaking…")).toBeInTheDocument();
    expect(screen.queryByText("Listening to you…")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
describe("VapiInterviewPanel — interviewer speaking indicator", () => {
  it("shows speaking animation bars when isSpeaking=true", () => {
    mockHookState = { status: "active", isSpeaking: true };
    const { container } = renderPanel();
    // The speaking bars are rendered in the Interviewer card as motion divs with bg-purple-400
    const bars = container.querySelectorAll(".bg-purple-400");
    expect(bars.length).toBeGreaterThan(0);
  });

  it("shows listening animation bars when isListening=true", () => {
    mockHookState = { status: "active", isListening: true };
    const { container } = renderPanel();
    const bars = container.querySelectorAll(".bg-blue-400");
    expect(bars.length).toBeGreaterThan(0);
  });

  it("user card shows 'Your turn to speak' when isListening", () => {
    mockHookState = { status: "active", isListening: true };
    renderPanel();
    expect(screen.getByText("Your turn to speak")).toBeInTheDocument();
  });

  it("user card shows 'Waiting…' when not listening", () => {
    mockHookState = { status: "active", isSpeaking: true };
    renderPanel();
    expect(screen.getByText("Waiting…")).toBeInTheDocument();
  });
});
