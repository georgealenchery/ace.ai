import { useState, useRef } from "react";
import VapiModule from "@vapi-ai/web";

const PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;
const ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID;

export function VapiTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const vapiRef = useRef<any>(null);

  function log(msg: string) {
    const ts = new Date().toISOString().split("T")[1]?.replace("Z", "") ?? "";
    const line = `[${ts}] ${msg}`;
    console.log(line);
    setLogs((prev) => [...prev, line]);
  }

  function createVapi(): any {
    log(`VapiModule type: ${typeof VapiModule}`);
    log(`VapiModule keys: ${Object.keys(VapiModule as any).join(", ") || "(none)"}`);

    // Attempt 1: direct constructor
    try {
      const v = new (VapiModule as any)(PUBLIC_KEY);
      log("SUCCESS: new VapiModule(key)");
      return v;
    } catch (e: any) {
      log(`FAIL new VapiModule(key): ${e.message}`);
    }

    // Attempt 2: .default property
    try {
      const Ctor = (VapiModule as any).default;
      log(`VapiModule.default type: ${typeof Ctor}`);
      const v = new Ctor(PUBLIC_KEY);
      log("SUCCESS: new VapiModule.default(key)");
      return v;
    } catch (e: any) {
      log(`FAIL new VapiModule.default(key): ${e.message}`);
    }

    // Attempt 3: .default.default
    try {
      const Ctor = (VapiModule as any).default?.default;
      log(`VapiModule.default.default type: ${typeof Ctor}`);
      const v = new Ctor(PUBLIC_KEY);
      log("SUCCESS: new VapiModule.default.default(key)");
      return v;
    } catch (e: any) {
      log(`FAIL new VapiModule.default.default(key): ${e.message}`);
    }

    log("ALL CONSTRUCTOR ATTEMPTS FAILED");
    return null;
  }

  async function startCall() {
    log("=== START ===");
    log(`Public key: ${PUBLIC_KEY?.slice(0, 8) ?? "MISSING"}...`);
    log(`Assistant ID: ${ASSISTANT_ID ?? "MISSING"}`);

    if (!PUBLIC_KEY || !ASSISTANT_ID) {
      log("ERROR: env vars not set");
      return;
    }

    const vapi = createVapi();
    if (!vapi) return;

    vapiRef.current = vapi;
    log(`Instance proto methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(vapi)).join(", ")}`);

    vapi.on("call-start", () => log("EVENT: call-start"));
    vapi.on("call-end", () => {
      log("EVENT: call-end");
      setRunning(false);
    });
    vapi.on("speech-start", () => log("EVENT: speech-start (assistant speaking)"));
    vapi.on("speech-end", () => log("EVENT: speech-end (assistant stopped)"));
    vapi.on("message", (msg: any) => log(`EVENT: message → ${JSON.stringify(msg)}`));
    vapi.on("error", (err: any) => log(`EVENT: error → ${JSON.stringify(err)}`));

    try {
      log("Unlocking AudioContext...");
      const ctx = new AudioContext();
      await ctx.resume();
      log(`AudioContext state: ${ctx.state}`);

      log("Calling vapi.start()...");
      setRunning(true);
      const call = await vapi.start(ASSISTANT_ID);
      log(`vapi.start() resolved: ${JSON.stringify(call)}`);
    } catch (err: any) {
      log(`vapi.start() threw: ${err.message ?? JSON.stringify(err)}`);
      setRunning(false);
    }
  }

  function stopCall() {
    log("=== STOP ===");
    vapiRef.current?.stop();
    setRunning(false);
  }

  return (
    <div style={{ fontFamily: "monospace", padding: 24, background: "#111", color: "#eee", minHeight: "100vh" }}>
      <h1>Vapi Debug Test</h1>
      <div style={{ margin: "12px 0", display: "flex", gap: 8 }}>
        <button onClick={startCall} disabled={running} style={{ padding: "8px 16px", fontSize: 14 }}>
          Start Call
        </button>
        <button onClick={stopCall} disabled={!running} style={{ padding: "8px 16px", fontSize: 14 }}>
          Stop Call
        </button>
        <button onClick={() => setLogs([])} style={{ padding: "8px 16px", fontSize: 14 }}>
          Clear Log
        </button>
      </div>
      <div
        style={{
          background: "#000",
          border: "1px solid #333",
          borderRadius: 4,
          padding: 12,
          height: 500,
          overflowY: "auto",
          fontSize: 13,
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {logs.map((line, i) => (
          <div
            key={i}
            style={{
              color: line.includes("ERROR") || line.includes("FAIL")
                ? "#f87171"
                : line.includes("SUCCESS") || line.includes("EVENT")
                  ? "#4ade80"
                  : "#94a3b8",
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
