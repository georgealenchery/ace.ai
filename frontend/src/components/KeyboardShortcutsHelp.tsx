import { useState, useEffect, useRef } from "react";
import { Keyboard, X } from "lucide-react";
import type { ShortcutsMap } from "../hooks/useKeyboardShortcuts";

interface KeyboardShortcutsHelpProps {
  shortcuts: ShortcutsMap;
}

export function KeyboardShortcutsHelp({ shortcuts }: KeyboardShortcutsHelpProps) {
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  };

  const entries = Object.entries(shortcuts).filter(([, s]) => s.description);

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Keyboard shortcuts"
        className="fixed bottom-5 right-5 z-40 w-9 h-9 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 text-gray-400 hover:text-white hover:bg-white/20 transition-all flex items-center justify-center shadow-lg"
      >
        <Keyboard className="w-4 h-4" />
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end p-5 bg-black/40 backdrop-blur-sm"
          onClick={handleBackdrop}
        >
          <div
            ref={modalRef}
            className="w-80 rounded-2xl bg-gray-900 border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
              <span className="text-sm font-semibold text-white">Keyboard Shortcuts</span>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shortcut list */}
            <div className="px-5 py-4 space-y-2.5">
              {entries.map(([combo, shortcut]) => (
                <div key={combo} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-gray-400">{shortcut.description}</span>
                  <kbd className="shrink-0 px-2 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] font-mono text-gray-300 whitespace-nowrap">
                    {shortcut.label}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
