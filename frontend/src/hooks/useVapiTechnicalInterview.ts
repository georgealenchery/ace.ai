import { useEffect, useRef, useState } from "react";
import { vapi } from "../lib/vapi";
import { evaluateVapiInterview } from "../services/api";
import type { VapiAnalysisResult } from "../services/api";
import type { TranscriptMessage, CallStatus } from "./useVapiInterview";
import { INTERVIEWERS, resolveVoice } from "./useVapiInterview";
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
  questions: string[];
  level: string;
  interviewer?: string;
  selectedTopics?: string[];
}

function buildTechnicalSystemPrompt(config: VapiTechnicalConfig): string {
  const roleLabel = config.role.charAt(0).toUpperCase() + config.role.slice(1);

  let difficultyInstructions: string;
  if (config.difficulty <= 30) {
    difficultyInstructions = `Difficulty is set to easy.
Be patient and encouraging. If they give a vague answer, gently ask them to elaborate with a specific example. Accept partial answers and help them build on them.`;
  } else if (config.difficulty <= 60) {
    difficultyInstructions = `Difficulty is set to medium.
Expect them to explain tradeoffs and justify their decisions. After they answer, probe deeper with follow-ups like "why did you choose that approach?" or "what are the downsides of that?"`;
  } else {
    difficultyInstructions = `Difficulty is set to hard.
Expect detailed, well-reasoned answers. Push back on surface-level responses. Ask about edge cases, failure modes, and production concerns. Challenge assumptions.`;
  }

  let experienceInstructions: string;
  if (config.experienceLevel <= 30) {
    experienceInstructions = `The candidate's experience level is junior.
Be encouraging. Acknowledge good thinking even if incomplete. Help them structure their thoughts if they seem lost.`;
  } else if (config.experienceLevel <= 60) {
    experienceInstructions = `The candidate's experience level is mid-level.
Expect solid fundamentals. After they answer, ask "why" to test deeper understanding. Expect concrete examples from real experience.`;
  } else {
    experienceInstructions = `The candidate's experience level is senior.
Expect depth and precision. Challenge them on system-level thinking, scalability, and real-world tradeoffs. Ask about decisions they have made in past projects.`;
  }

  let strictnessInstructions: string;
  if (config.strictness <= 30) {
    strictnessInstructions = `Your strictness level is lenient.
Accept reasonable answers without pressing too hard. Focus on thought process over perfect recall.`;
  } else if (config.strictness <= 60) {
    strictnessInstructions = `Your strictness level is fair.
Note gaps in reasoning and ask about them. Be honest but constructive.`;
  } else {
    strictnessInstructions = `Your strictness level is strict.
Do not let vague or incomplete answers slide. Always follow up with "can you be more specific?" or "what exactly would happen in that case?"`;
  }

  const questionList = config.questions.map((q, i) => `${i + 1}. ${q}`).join("\n");

  // Build topic focus instructions
  const topics = config.selectedTopics ?? [];
  const hasSystemDesign = topics.includes("system-design");
  const codeTopics = topics.filter((t) => t !== "system-design");

  const topicLabels: Record<string, string> = {
    "arrays":              "Arrays & Strings",
    "hash-maps":           "Hash Maps",
    "linked-lists":        "Linked Lists",
    "trees":               "Trees & Graphs",
    "dynamic-programming": "Dynamic Programming",
    "sorting":             "Sorting & Searching",
    "stacks-queues":       "Stacks & Queues",
    "recursion":           "Recursion & Backtracking",
    "math":                "Math & Logic",
    "system-design":       "System Design",
  };

  let topicInstructions = "";
  if (topics.length > 0) {
    const topicNames = topics.map((t) => topicLabels[t] ?? t).join(", ");
    topicInstructions = `
TOPIC FOCUS:
The candidate has chosen to practice: ${topicNames}.
When asking about time and space complexity, frame your follow-ups around these specific topics.
When you ask "what are the tradeoffs?" or "is there a better approach?", guide the candidate toward solutions that use ${topicNames} concepts.
${codeTopics.length > 0 ? `For the coding problems, probe whether they considered ${codeTopics.map((t) => topicLabels[t] ?? t).join(", ")} based approaches.` : ""}
${hasSystemDesign ? `This session includes System Design. After each coding question, ask at least one architecture or design follow-up. For example: "How would you scale this to handle millions of requests?" or "What would change if you had to persist this data across restarts?"` : ""}`;
  }

  return `You are a senior ${roleLabel} engineering interviewer conducting a ${config.level}-level ${config.difficulty <= 30 ? "easy" : config.difficulty <= 60 ? "medium" : "hard"} technical discussion interview.

INTERVIEW QUESTIONS:
Ask the following questions in order, one at a time:
${questionList}

CORE BEHAVIOR:
This is a discussion-based interview, not a coding challenge. The candidate is explaining their knowledge and experience verbally.
Ask one question at a time. Wait for a complete answer before moving to the next.
After each answer, ask one or two natural follow-up questions to probe understanding before moving on.
If they give a shallow answer, ask "Can you give me a concrete example?" or "How have you handled that in practice?"
When you are satisfied with their answer to a question, move naturally to the next one. Say something like "Good, let's move on." or "Okay, next question."
Do not skip any questions.
You are the interviewer. Do not let the candidate turn the conversation around.

STRICT ENGINEERING FOCUS:
Keep the conversation on technical topics related to the questions.
If they go off topic, redirect them with "Let's bring that back to the question."
${topicInstructions}

${difficultyInstructions}

${experienceInstructions}

${strictnessInstructions}

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
Sound like a friendly senior engineer having a real conversation, not a professor giving a lecture.
Prefer simple everyday words.`;
}

function buildFirstMessage(config: VapiTechnicalConfig): string {
  return `Hi, let's get started. We'll go through three technical questions today. Take your time with each one and feel free to think out loud. Ready? Here's the first one. ${config.questions[0]}`;
}

export function useVapiTechnicalInterview() {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [callEndedNaturally, setCallEndedNaturally] = useState(false);
  const messagesRef = useRef<TranscriptMessage[]>([]);

  useEffect(() => {
    const onCallStart = () => {
      console.log("Technical call started");
      setStatus("active");
      setIsListening(true);
      setIsMuted(false);
      vapi.setMuted(false);
      console.log("Mic muted:", false);
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

    const onVolumeLevel = (level: number) => setVolumeLevel(level);

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("message", onMessage);
    vapi.on("error", onError);
    vapi.on("volume-level", onVolumeLevel);

    return () => {
      vapi.removeListener("call-start", onCallStart);
      vapi.removeListener("call-end", onCallEnd);
      vapi.removeListener("speech-start", onSpeechStart);
      vapi.removeListener("speech-end", onSpeechEnd);
      vapi.removeListener("message", onMessage);
      vapi.removeListener("error", onError);
      vapi.removeListener("volume-level", onVolumeLevel);
    };
  }, []);

  const evaluateTranscript = async (
    transcript: TranscriptMessage[],
    config: VapiTechnicalConfig,
  ): Promise<{ result: VapiAnalysisResult; id: string } | null> => {
    if (transcript.length < 2) {
      console.warn("Not enough messages to evaluate");
      return null;
    }
    setIsAnalyzing(true);
    try {
      const { result, id } = await evaluateVapiInterview(transcript, {
        role: config.role,
        difficulty: config.difficulty,
        experienceLevel: config.experienceLevel,
        strictness: config.strictness,
        questionType: config.questionType,
      });
      return { result, id };
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
      console.log("Interview type:", config.questionType);
      setStatus("connecting");
      setMessages([]);
      setCallEndedNaturally(false);
      setIsMuted(false);

      const audioContext = new AudioContext();
      await audioContext.resume();

      const interviewerKey = (config.interviewer ?? "cassidy").toLowerCase();
      const interviewer = INTERVIEWERS[interviewerKey] ?? INTERVIEWERS["cassidy"]!;
      const resolvedVoice = resolveVoice(interviewer.voice);
      console.log("Using interviewer:", interviewerKey);
      console.log("Resolved voice:", resolvedVoice);

      const systemPrompt = buildTechnicalSystemPrompt(config);
      const firstMessage = buildFirstMessage(config);
      console.log("Technical system prompt length:", systemPrompt.length);
      console.log("Generated questions:", config.questions);

      const assistantConfig: CreateAssistantDTO = {
        model: {
          provider: "openai",
          model: "gpt-4.1",
          messages: [{ role: "system", content: systemPrompt }],
        },
        voice: resolvedVoice,
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

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    vapi.setMuted(newMutedState);
    console.log("Mic muted:", newMutedState);
  };

  const stop = () => {
    vapi.stop();
    setStatus("ended");
    setIsSpeaking(false);
    setIsListening(false);
    setIsMuted(false);
  };

  return {
    status,
    isSpeaking,
    isListening,
    isMuted,
    volumeLevel,
    messages,
    isAnalyzing,
    callEndedNaturally,
    start,
    stop,
    toggleMute,
    evaluateTranscript,
  };
}
