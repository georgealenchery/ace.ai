import { useEffect, useRef, useState } from "react";
import { vapi } from "../lib/vapi";
import { evaluateVapiInterview } from "../services/api";
import type { VapiAnalysisResult } from "../services/api";
import type { TranscriptMessage, CallStatus } from "./useVapiInterview";
import type { CreateAssistantDTO } from "@vapi-ai/web/dist/api";

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

export interface VapiTechnicalConfig {
  role: string;
  difficulty: number;
  experienceLevel: number;
  strictness: number;
  questionType: "behavioral" | "technical";
  problemTitle: string;
  problemDescription: string;
}

function buildTechnicalSystemPrompt(config: VapiTechnicalConfig): string {
  const roleLabel = config.role.charAt(0).toUpperCase() + config.role.slice(1);

  let difficultyInstructions: string;
  if (config.difficulty <= 30) {
    difficultyInstructions = `Difficulty is set to easy.
Be very patient. Offer hints early if they struggle. Accept brute force solutions. Focus on getting them to a working solution. Don't push for optimal approaches unless they bring it up.`;
  } else if (config.difficulty <= 60) {
    difficultyInstructions = `Difficulty is set to medium.
Expect them to discuss tradeoffs between approaches. After they get a brute force solution working, ask about optimization. Push for better solutions but acknowledge good thinking along the way.`;
  } else {
    difficultyInstructions = `Difficulty is set to hard.
Expect optimal solutions. Challenge their complexity analysis. Ask about edge cases they might miss. Push back on suboptimal approaches. Ask "Can you do better?" if they settle on a brute force solution.`;
  }

  let experienceInstructions: string;
  if (config.experienceLevel <= 30) {
    experienceInstructions = `The candidate's experience level is junior.
Be encouraging. Say things like "That's a good start." Help them break down the problem into smaller steps. If they're stuck on syntax, give them a nudge.`;
  } else if (config.experienceLevel <= 60) {
    experienceInstructions = `The candidate's experience level is mid-level.
Expect solid fundamentals. After they explain their approach, ask "why" to test deeper understanding. Expect them to handle basic edge cases without prompting.`;
  } else {
    experienceInstructions = `The candidate's experience level is senior.
Expect clean code, proper naming, edge case handling without prompting. Challenge them on production readiness. Ask about testing strategies and how they'd handle scale.`;
  }

  let strictnessInstructions: string;
  if (config.strictness <= 30) {
    strictnessInstructions = `Your strictness level is lenient.
Accept working solutions even if not optimal. Focus on thought process over perfection. Give positive reinforcement for good reasoning.`;
  } else if (config.strictness <= 60) {
    strictnessInstructions = `Your strictness level is fair.
Note inefficiencies but acknowledge good thinking. Ask follow-ups on weak areas. Be honest but constructive.`;
  } else {
    strictnessInstructions = `Your strictness level is strict.
Push hard for optimal solutions. Point out code smells. Ask about testing. Don't let suboptimal solutions slide without discussion.`;
  }

  return `You are a senior ${roleLabel} engineering interviewer conducting a live coding interview.

CORE BEHAVIOR:
You are watching the candidate solve a coding problem in real time.
Ask them to explain their thought process as they code. Say things like "Walk me through what you're thinking." and "Why did you choose that approach?"
If they go silent for a while, gently prompt them. Say "What are you considering right now?" or "Talk me through your current approach."
If they get stuck, give progressive hints. Start vague like "Think about what data structure might help here." Then get more specific if they're still stuck, like "A hash map could help you look up values quickly."
Never give them the full solution. Guide them toward it.
Ask about time and space complexity after they finish or when they mention their approach.
If their code has a bug, don't tell them directly. Ask "What happens if the input is [edge case]?" or "Have you considered what happens when [scenario]?"
When they say they're done, ask them to walk through their solution with a test case.

STRICT SOFTWARE ENGINEERING FOCUS:
Stay strictly on the coding problem and software engineering topics.
If they go off topic, redirect them. Say "Let's stay focused on the problem. Where were you in your solution?"
You are the interviewer. Do not let the candidate interview you.

${difficultyInstructions}

${experienceInstructions}

${strictnessInstructions}

PROBLEM CONTEXT:
The candidate is solving the "${config.problemTitle}" problem.
Problem description: ${config.problemDescription}
Reference the specific problem naturally. For example, "So for the ${config.problemTitle} problem, what's your initial approach?"

SPEECH STYLE:
Never use exclamation marks. They cause unnatural vocal emphasis. Use periods instead.
Keep sentences short, fifteen words or fewer. Long sentences sound robotic when spoken.
Use contractions naturally. Say "you're" not "you are," "let's" not "let us," "don't" not "do not."
Avoid abbreviations entirely. Say "for example" not "e.g." Say "that is" not "i.e."
Spell out all numbers under one hundred. Say "twenty three" not "23."
Never use special characters, markdown, bullet points, numbered lists, asterisks, or dashes. This is spoken conversation, not text.
Start some responses with natural conversational openers. Things like "So," "Alright," "Okay," or "Good."
Use casual transitions. "Alright." "Okay, interesting." "Good, keep going."
Keep greetings warm but not overly enthusiastic.
Sound like a friendly senior engineer at a whiteboard, not a professor giving a lecture.
Prefer simple everyday words.`;
}

function buildFirstMessage(config: VapiTechnicalConfig): string {
  return `Hi, let's get started with the coding portion. You've got the ${config.problemTitle} problem in front of you. Take a moment to read through it, and when you're ready, walk me through your initial thoughts.`;
}

export function useVapiTechnicalInterview() {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [callEndedNaturally, setCallEndedNaturally] = useState(false);
  const messagesRef = useRef<TranscriptMessage[]>([]);

  useEffect(() => {
    const onCallStart = () => {
      console.log("Technical call started");
      setStatus("active");
      setIsListening(true);
    };

    const onCallEnd = () => {
      console.log("Technical call ended naturally");
      setStatus("ended");
      setIsSpeaking(false);
      setIsListening(false);
      setCallEndedNaturally(true);
    };

    const onSpeechStart = () => {
      setIsSpeaking(true);
      setIsListening(false);
    };

    const onSpeechEnd = () => {
      setIsSpeaking(false);
      setIsListening(true);
    };

    const onError = (e: VapiError) => {
      console.error("Vapi error:", e);
    };

    const onMessage = (msg: VapiTranscriptMessage) => {
      if (msg.type === "transcript" && msg.transcriptType === "final") {
        const newMsg: TranscriptMessage = {
          role: msg.role,
          text: msg.transcript,
          timestamp: Date.now(),
        };
        setMessages((prev) => {
          const updated = [...prev, newMsg];
          messagesRef.current = updated;
          return updated;
        });
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

  const evaluateTranscript = async (
    transcript: TranscriptMessage[],
    config: VapiTechnicalConfig,
  ): Promise<VapiAnalysisResult | null> => {
    if (transcript.length < 2) {
      console.warn("Not enough messages to evaluate");
      return null;
    }
    setIsAnalyzing(true);
    try {
      const formatted = transcript.map(({ role, text }) => ({ role, text }));
      const { result } = await evaluateVapiInterview(formatted, {
        role: config.role,
        difficulty: config.difficulty,
        experienceLevel: config.experienceLevel,
        strictness: config.strictness,
        questionType: config.questionType,
      });
      return result;
    } catch (err) {
      console.error("Failed to evaluate transcript:", err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const start = async (config: VapiTechnicalConfig) => {
    try {
      console.log("START technical interview — config:", config);
      setStatus("connecting");
      setMessages([]);
      setCallEndedNaturally(false);

      const audioContext = new AudioContext();
      await audioContext.resume();

      const systemPrompt = buildTechnicalSystemPrompt(config);
      const firstMessage = buildFirstMessage(config);
      console.log("Technical system prompt length:", systemPrompt.length);

      const assistantConfig: CreateAssistantDTO = {
        model: {
          provider: "openai",
          model: "gpt-4.1",
          messages: [{ role: "system", content: systemPrompt }],
        },
        voice: { provider: "vapi", voiceId: "Cole", speed: 0.9 },
        transcriber: { provider: "deepgram", model: "nova-3", language: "en" },
        firstMessage,
        backgroundSpeechDenoisingPlan: {
          smartDenoisingPlan: { enabled: true },
        },
      };
      await vapi.start(assistantConfig);
    } catch (err) {
      console.error("Failed to start Vapi technical call:", err);
      setStatus("idle");
    }
  };

  const stop = () => {
    vapi.stop();
    setStatus("ended");
    setIsSpeaking(false);
    setIsListening(false);
  };

  return {
    status,
    isSpeaking,
    isListening,
    messages,
    isAnalyzing,
    callEndedNaturally,
    start,
    stop,
    evaluateTranscript,
  };
}
