import { useEffect, useState } from "react";
import { vapi } from "../lib/vapi";

interface VapiTranscriptMessage {
  type: string;
  transcriptType?: string;
  role: "assistant" | "user";
  transcript: string;
}

interface VapiError {
  message?: string;
  code?: string;
}

export interface TranscriptMessage {
  role: "assistant" | "user";
  text: string;
  timestamp: number;
}

export type CallStatus = "idle" | "connecting" | "active" | "ended";

export function useVapiInterview() {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);

  useEffect(() => {
    const onCallStart = () => {
      console.log("Call started");
      setStatus("active");
      setIsListening(true);
    };

    const onCallEnd = () => {
      console.log("Call ended");
      setStatus("ended");
      setIsSpeaking(false);
      setIsListening(false);
    };

    const onSpeechStart = () => {
      console.log("Assistant started speaking");
      setIsSpeaking(true);
      setIsListening(false);
    };

    const onSpeechEnd = () => {
      console.log("Assistant stopped speaking");
      setIsSpeaking(false);
      setIsListening(true);
    };

    const onError = (e: VapiError) => {
      console.error("Vapi error:", e);
    };

    const onMessage = (msg: VapiTranscriptMessage) => {
      if (msg.type === "transcript" && msg.transcriptType === "final") {
        setMessages((prev) => [
          ...prev,
          {
            role: msg.role,
            text: msg.transcript,
            timestamp: Date.now(),
          },
        ]);
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("message", onMessage);
    vapi.on("error", onError);

    return () => {
      vapi.removeListener("call-start", onCallStart);
      vapi.removeListener("call-end", onCallEnd);
      vapi.removeListener("speech-start", onSpeechStart);
      vapi.removeListener("speech-end", onSpeechEnd);
      vapi.removeListener("message", onMessage);
      vapi.removeListener("error", onError);
    };
  }, []);

  const start = async () => {
    try {
      console.log("START CLICKED");
      console.log("Assistant ID:", import.meta.env.VITE_VAPI_ASSISTANT_ID);
      setStatus("connecting");
      setMessages([]);

      // Unlock audio output (must happen in user-gesture handler)
      const audioContext = new AudioContext();
      await audioContext.resume();
      console.log("AudioContext state:", audioContext.state);

      // Start Vapi after audio is unlocked
      const call = await vapi.start(import.meta.env.VITE_VAPI_ASSISTANT_ID);
      console.log("Vapi call object:", call);
    } catch (err) {
      console.error("Failed to start Vapi call:", err);
      setStatus("idle");
    }
  };

  const stop = () => {
    vapi.stop();
    setStatus("ended");
    setIsSpeaking(false);
    setIsListening(false);
  };

  return { status, isSpeaking, isListening, messages, start, stop };
}
