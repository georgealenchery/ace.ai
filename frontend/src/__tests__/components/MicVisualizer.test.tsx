import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MicVisualizer } from "../../components/MicVisualizer";

describe("MicVisualizer — label rendering", () => {
  it("shows 'Idle' when not listening and not speaking", () => {
    render(<MicVisualizer volumeLevel={0} isListening={false} isSpeaking={false} />);
    expect(screen.getByText("Idle")).toBeInTheDocument();
  });

  it("shows 'Listening...' when isListening=true and not speaking", () => {
    render(<MicVisualizer volumeLevel={0.5} isListening={true} isSpeaking={false} />);
    expect(screen.getByText("Listening...")).toBeInTheDocument();
  });

  it("shows 'AI Speaking...' when isSpeaking=true", () => {
    render(<MicVisualizer volumeLevel={0} isListening={false} isSpeaking={true} />);
    expect(screen.getByText("AI Speaking...")).toBeInTheDocument();
  });

  it("shows 'AI Speaking...' even when both isSpeaking and isListening are true", () => {
    // isSpeaking takes precedence — the ring color logic checks isSpeaking first
    render(<MicVisualizer volumeLevel={0.8} isListening={true} isSpeaking={true} />);
    expect(screen.getByText("AI Speaking...")).toBeInTheDocument();
    expect(screen.queryByText("Listening...")).not.toBeInTheDocument();
  });
});

describe("MicVisualizer — label color classes", () => {
  it("idle label has gray color class", () => {
    render(<MicVisualizer volumeLevel={0} isListening={false} isSpeaking={false} />);
    const label = screen.getByText("Idle");
    expect(label.className).toContain("text-gray-500");
  });

  it("listening label has green color class", () => {
    render(<MicVisualizer volumeLevel={0.5} isListening={true} isSpeaking={false} />);
    const label = screen.getByText("Listening...");
    expect(label.className).toContain("text-green-400");
  });

  it("speaking label has purple color class", () => {
    render(<MicVisualizer volumeLevel={0} isListening={false} isSpeaking={true} />);
    const label = screen.getByText("AI Speaking...");
    expect(label.className).toContain("text-purple-400");
  });
});

describe("MicVisualizer — renders three rings", () => {
  it("renders exactly 3 ring elements", () => {
    const { container } = render(
      <MicVisualizer volumeLevel={0} isListening={false} isSpeaking={false} />
    );
    // Rings are motion.div elements with rounded-full and border classes
    const rings = container.querySelectorAll(".rounded-full.border");
    expect(rings).toHaveLength(3);
  });
});

describe("MicVisualizer — edge values", () => {
  it("renders without error when volumeLevel=0 and idle", () => {
    const { container } = render(
      <MicVisualizer volumeLevel={0} isListening={false} isSpeaking={false} />
    );
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByText("Idle")).toBeInTheDocument();
  });

  it("renders without error when volumeLevel=1 and listening", () => {
    render(<MicVisualizer volumeLevel={1} isListening={true} isSpeaking={false} />);
    expect(screen.getByText("Listening...")).toBeInTheDocument();
  });

  it("renders without error when volumeLevel is negative (treated as no boost)", () => {
    render(<MicVisualizer volumeLevel={-0.5} isListening={true} isSpeaking={false} />);
    // Should still show Listening... without crashing
    expect(screen.getByText("Listening...")).toBeInTheDocument();
  });

  it("renders without error when volumeLevel exceeds 1", () => {
    render(<MicVisualizer volumeLevel={2} isListening={true} isSpeaking={false} />);
    expect(screen.getByText("Listening...")).toBeInTheDocument();
  });

  it("volumeLevel=0 idle still renders 3 rings", () => {
    const { container } = render(
      <MicVisualizer volumeLevel={0} isListening={false} isSpeaking={false} />
    );
    expect(container.querySelectorAll(".rounded-full.border")).toHaveLength(3);
  });

  it("volumeLevel=1 speaking still renders 3 rings", () => {
    const { container } = render(
      <MicVisualizer volumeLevel={1} isListening={false} isSpeaking={true} />
    );
    expect(container.querySelectorAll(".rounded-full.border")).toHaveLength(3);
  });
});

describe("MicVisualizer — no conflicting UI states", () => {
  it("idle: only 'Idle' label is present, no listening or speaking labels", () => {
    render(<MicVisualizer volumeLevel={0} isListening={false} isSpeaking={false} />);
    expect(screen.getByText("Idle")).toBeInTheDocument();
    expect(screen.queryByText("Listening...")).not.toBeInTheDocument();
    expect(screen.queryByText("AI Speaking...")).not.toBeInTheDocument();
  });

  it("listening: only 'Listening...' label is present", () => {
    render(<MicVisualizer volumeLevel={0.5} isListening={true} isSpeaking={false} />);
    expect(screen.getByText("Listening...")).toBeInTheDocument();
    expect(screen.queryByText("Idle")).not.toBeInTheDocument();
    expect(screen.queryByText("AI Speaking...")).not.toBeInTheDocument();
  });

  it("speaking: only 'AI Speaking...' label is present", () => {
    render(<MicVisualizer volumeLevel={0} isListening={false} isSpeaking={true} />);
    expect(screen.getByText("AI Speaking...")).toBeInTheDocument();
    expect(screen.queryByText("Idle")).not.toBeInTheDocument();
    expect(screen.queryByText("Listening...")).not.toBeInTheDocument();
  });

  it("both speaking and listening: only 'AI Speaking...' label is present (speaking wins)", () => {
    render(<MicVisualizer volumeLevel={0.8} isListening={true} isSpeaking={true} />);
    expect(screen.getByText("AI Speaking...")).toBeInTheDocument();
    expect(screen.queryByText("Listening...")).not.toBeInTheDocument();
    expect(screen.queryByText("Idle")).not.toBeInTheDocument();
  });

  it("exactly one label is rendered in every state", () => {
    const states = [
      { isListening: false, isSpeaking: false },
      { isListening: true, isSpeaking: false },
      { isListening: false, isSpeaking: true },
      { isListening: true, isSpeaking: true },
    ];
    for (const state of states) {
      const { unmount } = render(<MicVisualizer volumeLevel={0.5} {...state} />);
      const labels = ["Idle", "Listening...", "AI Speaking..."].filter(
        (t) => document.body.textContent?.includes(t)
      );
      expect(labels).toHaveLength(1);
      unmount();
    }
  });
});

describe("MicVisualizer — stress cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("100 rapid re-renders alternating all states: final state matches last props", () => {
    const states = [
      { isListening: false, isSpeaking: false, volumeLevel: 0 },
      { isListening: true, isSpeaking: false, volumeLevel: 0.5 },
      { isListening: false, isSpeaking: true, volumeLevel: 0 },
    ];
    const { rerender } = render(<MicVisualizer {...states[0]!} />);
    for (let i = 1; i < 100; i++) {
      rerender(<MicVisualizer {...states[i % 3]!} />);
    }
    // 99 % 3 === 0 → states[0] (idle)
    expect(screen.getByText("Idle")).toBeInTheDocument();
    expect(screen.queryByText("Listening...")).not.toBeInTheDocument();
    expect(screen.queryByText("AI Speaking...")).not.toBeInTheDocument();
  });
});

describe("MicVisualizer — rapid state switching", () => {
  it("renders correct label after idle → listening → speaking → listening cycle", () => {
    const { rerender } = render(
      <MicVisualizer volumeLevel={0} isListening={false} isSpeaking={false} />
    );
    expect(screen.getByText("Idle")).toBeInTheDocument();

    rerender(<MicVisualizer volumeLevel={0.3} isListening={true} isSpeaking={false} />);
    expect(screen.getByText("Listening...")).toBeInTheDocument();

    rerender(<MicVisualizer volumeLevel={0} isListening={false} isSpeaking={true} />);
    expect(screen.getByText("AI Speaking...")).toBeInTheDocument();

    rerender(<MicVisualizer volumeLevel={0.6} isListening={true} isSpeaking={false} />);
    expect(screen.getByText("Listening...")).toBeInTheDocument();
    expect(screen.queryByText("AI Speaking...")).not.toBeInTheDocument();
  });

  it("center dot is always rendered regardless of state", () => {
    const states = [
      { isListening: false, isSpeaking: false, volumeLevel: 0 },
      { isListening: true, isSpeaking: false, volumeLevel: 0.5 },
      { isListening: false, isSpeaking: true, volumeLevel: 0 },
    ];
    for (const state of states) {
      const { container, unmount } = render(<MicVisualizer {...state} />);
      const dot = container.querySelector(".w-3.h-3.rounded-full");
      expect(dot).not.toBeNull();
      unmount();
    }
  });
});
