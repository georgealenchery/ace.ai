import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import type { ShortcutsMap } from "../../hooks/useKeyboardShortcuts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fireKey(
  key: string,
  opts: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; target?: EventTarget } = {}
) {
  const event = new KeyboardEvent("keydown", {
    key,
    ctrlKey: opts.ctrlKey ?? false,
    metaKey: opts.metaKey ?? false,
    shiftKey: opts.shiftKey ?? false,
    bubbles: true,
  });
  // Dispatch from the target element so jsdom sets event.target correctly (bubbles up to window)
  const dispatchTarget = (opts.target instanceof Node ? opts.target : window) as EventTarget;
  dispatchTarget.dispatchEvent(event);
  return event;
}

function makeInput(tag: "input" | "textarea" = "input"): HTMLElement {
  const el = document.createElement(tag);
  document.body.appendChild(el);
  return el;
}

function makeContentEditable(): HTMLDivElement {
  const el = document.createElement("div");
  el.contentEditable = "true";
  document.body.appendChild(el);
  return el;
}

// ---------------------------------------------------------------------------
describe("useKeyboardShortcuts — basic dispatch", () => {
  let handler: ReturnType<typeof vi.fn>;
  let shortcuts: ShortcutsMap;

  beforeEach(() => {
    handler = vi.fn();
    shortcuts = {
      "m": { handler: handler as () => void, description: "Toggle mute", label: "M" },
    };
  });

  it("fires the handler when the matching key is pressed", () => {
    renderHook(() => useKeyboardShortcuts(shortcuts));
    fireKey("m");
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does NOT fire for an unregistered key", () => {
    renderHook(() => useKeyboardShortcuts(shortcuts));
    fireKey("k");
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls e.preventDefault() for a registered shortcut", () => {
    renderHook(() => useKeyboardShortcuts(shortcuts));
    const prevent = vi.spyOn(KeyboardEvent.prototype, "preventDefault");
    fireKey("m");
    expect(prevent).toHaveBeenCalled();
    prevent.mockRestore();
  });

  it("removes the event listener on unmount", () => {
    const spy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));
    unmount();
    expect(spy).toHaveBeenCalledWith("keydown", expect.any(Function));
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
describe("useKeyboardShortcuts — enabled flag", () => {
  it("does NOT fire when enabled=false", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "m": { handler, description: "", label: "M", enabled: false } })
    );
    fireKey("m");
    expect(handler).not.toHaveBeenCalled();
  });

  it("fires when enabled is undefined (defaults to enabled)", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "m": { handler, description: "", label: "M" } })
    );
    fireKey("m");
    expect(handler).toHaveBeenCalledOnce();
  });

  it("fires when enabled=true explicitly", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "m": { handler, description: "", label: "M", enabled: true } })
    );
    fireKey("m");
    expect(handler).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
describe("useKeyboardShortcuts — typing target guard", () => {
  it("blocks shortcut when target is an input element", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "m": { handler, description: "", label: "M" } })
    );
    const input = makeInput("input");
    fireKey("m", { target: input });
    expect(handler).not.toHaveBeenCalled();
  });

  it("blocks shortcut when target is a textarea", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "m": { handler, description: "", label: "M" } })
    );
    const ta = makeInput("textarea");
    fireKey("m", { target: ta });
    expect(handler).not.toHaveBeenCalled();
  });

  // jsdom does not reflect the contentEditable IDL setter into isContentEditable in threads mode
  it.skip("blocks shortcut when target is contentEditable", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "m": { handler, description: "", label: "M" } })
    );
    const div = makeContentEditable();
    fireKey("m", { target: div });
    expect(handler).not.toHaveBeenCalled();
  });

  it("fires shortcut in input when allowInInput=true", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        "ctrl+shift+m": { handler, description: "", label: "Ctrl+Shift+M", allowInInput: true },
      })
    );
    const input = makeInput("input");
    fireKey("m", { ctrlKey: true, shiftKey: true, target: input });
    expect(handler).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
describe("useKeyboardShortcuts — modifier key combinations", () => {
  it("resolves Ctrl+Enter to 'ctrl+enter'", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "ctrl+enter": { handler, description: "", label: "Ctrl+Enter" } })
    );
    fireKey("Enter", { ctrlKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("resolves Cmd+Enter (metaKey) to 'ctrl+enter'", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "ctrl+enter": { handler, description: "", label: "Ctrl+Enter" } })
    );
    fireKey("Enter", { metaKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("resolves Ctrl+Shift+M to 'ctrl+shift+m'", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "ctrl+shift+m": { handler, description: "", label: "Ctrl+Shift+M" } })
    );
    fireKey("m", { ctrlKey: true, shiftKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("Escape resolves to 'escape'", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "escape": { handler, description: "", label: "Esc" } })
    );
    fireKey("Escape");
    expect(handler).toHaveBeenCalledOnce();
  });

  it("key is lowercased: 'M' key press matches 'm' shortcut", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "m": { handler, description: "", label: "M" } })
    );
    fireKey("M"); // uppercase M from the browser
    expect(handler).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
describe("useKeyboardShortcuts — shortcuts map reactivity", () => {
  it("uses the latest shortcuts map after re-render", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const { rerender } = renderHook(
      ({ map }: { map: ShortcutsMap }) => useKeyboardShortcuts(map),
      { initialProps: { map: { "m": { handler: handler1, description: "", label: "M" } } } }
    );

    fireKey("m");
    expect(handler1).toHaveBeenCalledOnce();
    handler1.mockClear();

    rerender({ map: { "m": { handler: handler2, description: "", label: "M" } } });
    fireKey("m");
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledOnce();
  });
});
