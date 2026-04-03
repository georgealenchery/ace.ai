import { useEffect, useRef, useState } from "react";
import { vapi } from "../lib/vapi";
import { evaluateVapiInterview } from "../services/api";
import type { VapiAnalysisResult } from "../services/api";
import type { CreateAssistantDTO, ElevenLabsVoice, VapiVoice } from "@vapi-ai/web/dist/api";

// Discriminated union using the SDK's exact voiceId constraints
type ElevenLabsVoiceConfig = { provider: "11labs"; voiceId: string };
type VapiVoiceConfig = { provider: "vapi"; voiceId: VapiVoice["voiceId"] };
type VoiceConfig = ElevenLabsVoiceConfig | VapiVoiceConfig;

export function resolveVoice(voice: VoiceConfig): ElevenLabsVoice | VapiVoice {
  if (voice.provider === "11labs") {
    return { provider: "11labs", voiceId: voice.voiceId };
  }
  return { provider: "vapi", voiceId: voice.voiceId };
}

interface InterviewerConfig {
  name: string;
  voice: VoiceConfig;
  personality: string;
}

export const INTERVIEWERS: Record<string, InterviewerConfig> = {
  cassidy: {
    name: "Cassidy",
    voice: { provider: "11labs", voiceId: "21m00Tcm4TlvDq8ikWAM" },
    personality: `Your name is Cassidy. You are warm and encouraging, but sharp — you do not let weak or vague answers slide. You build rapport quickly and make candidates feel comfortable, then challenge them to go deeper once they are at ease. Your tone is conversational and supportive, but your follow-up questions are pointed.`,
  },
  alex: {
    name: "Alex",
    voice: { provider: "vapi", voiceId: "Rohan" },
    personality: `Your name is Alex. You are direct, precise, and highly technical. You value structured thinking and concise answers. You have no patience for hand-waving. If an answer is incomplete, you say so plainly and ask again. Your tone is professional and neutral — not cold, but strictly focused.`,
  },
  jordan: {
    name: "Jordan",
    voice: { provider: "11labs", voiceId: "EXAVITQu4vr4xnSDxMaL" },
    personality: `Your name is Jordan. You are calm, methodical, and curious. You probe the candidate's reasoning rather than testing memorized facts. You ask things like "walk me through how you got there" and "what would you change if the requirements shifted?" You care about thought process above all.`,
  },
};

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

export interface VapiInterviewConfig {
  role: string;
  difficulty: number;
  experienceLevel: number;
  strictness: number;
  questionType: "behavioral" | "technical";
  interviewer?: string;
}

const ROLE_TOPICS: Record<string, string> = {
  frontend:
    "React, TypeScript, CSS, the DOM, browser APIs, state management, accessibility, performance, and responsive design",
  backend:
    "API design, databases both SQL and NoSQL, system design, authentication, caching, message queues, microservices, and server architecture",
  fullstack:
    "a mix of frontend topics like React, TypeScript, and state management, along with backend topics like API design, databases, and system design",
  devops:
    "CI CD pipelines, Docker, Kubernetes, cloud services, monitoring, and infrastructure as code",
  mobile:
    "React Native, native mobile development, mobile UX patterns, offline storage, push notifications, and app performance",
  data:
    "data pipelines, SQL, data modeling, ETL processes, analytics, and data warehousing",
};

function getDifficultyLabel(d: number): string {
  if (d <= 30) return "Easy";
  if (d <= 60) return "Medium";
  return "Hard";
}

function getExperienceLabel(e: number): string {
  if (e <= 30) return "Junior";
  if (e <= 60) return "Mid-Level";
  return "Senior";
}

function getStrictnessLabel(s: number): string {
  if (s <= 30) return "Lenient";
  if (s <= 60) return "Fair";
  return "Strict";
}

function buildSystemPrompt(config: VapiInterviewConfig, interviewerPersonality: string): string {
  const topics = ROLE_TOPICS[config.role] ?? "general software engineering, algorithms, system design, and coding best practices";
  const roleLabel = config.role.charAt(0).toUpperCase() + config.role.slice(1);

  let difficultyInstructions: string;
  if (config.difficulty <= 30) {
    difficultyInstructions = `Difficulty is set to easy.
Ask foundational questions. For example, "What's a REST API?" or "Can you explain the difference between let and const?" or "What's a foreign key?"
Accept surface-level answers. Don't push for depth. If the candidate gives a reasonable answer, acknowledge it and move on.`;
  } else if (config.difficulty <= 60) {
    difficultyInstructions = `Difficulty is set to medium.
Ask practical, scenario-based questions. For example, "How would you design the API for a todo app?" or "Walk me through how you'd debug a slow database query."
Expect reasonable depth. Ask one follow-up per topic to test understanding.`;
  } else {
    difficultyInstructions = `Difficulty is set to hard.
Ask senior and staff level questions. For example, "Let's talk about system design. How would you build a real-time notification system at scale?" or "How would you handle distributed transactions across microservices?"
Expect deep technical knowledge. Challenge weak or vague answers. Ask multiple follow-ups per topic.`;
  }

  let experienceInstructions: string;
  if (config.experienceLevel <= 30) {
    experienceInstructions = `The candidate's experience level is junior.
Be patient and encouraging. Use simpler language. Give them time to think. If they struggle, offer a small hint before moving on. Don't overwhelm them.`;
  } else if (config.experienceLevel <= 60) {
    experienceInstructions = `The candidate's experience level is mid-level.
Be balanced. Expect solid fundamentals. After each answer, ask "why" or "how" to test deeper understanding. Acknowledge good answers.`;
  } else {
    experienceInstructions = `The candidate's experience level is senior.
Expect depth and nuance in every answer. Push back on vague responses. Ask "what are the tradeoffs?" and "how would this fail at scale?" Don't accept surface-level answers from a senior candidate.`;
  }

  let strictnessInstructions: string;
  if (config.strictness <= 30) {
    strictnessInstructions = `Your strictness level is lenient.
Accept partial answers graciously. Give positive reinforcement. Focus on the candidate's potential and thought process.`;
  } else if (config.strictness <= 60) {
    strictnessInstructions = `Your strictness level is fair.
Acknowledge good points but note gaps. Ask follow-ups on weak areas. Be honest but constructive. Say things like "Good start. Can you elaborate on that?"`;
  } else {
    strictnessInstructions = `Your strictness level is strict.
Hold the candidate to a high bar. Point out when answers are incomplete. Say things like "That's partially correct, but you're missing something. Can you go deeper?" Don't let vague answers slide.`;
  }

  let questionTypeInstructions: string;
  if (config.questionType === "behavioral") {
    questionTypeInstructions = `You're doing a behavioral interview only.
Ask STAR method questions about software engineering situations. For example, "Tell me about a time you had a technical disagreement with a teammate. How did you resolve it?" or "Describe a project where you had to learn a new technology quickly."
Every question must tie back to technical work. Don't ask generic behavioral questions unrelated to engineering.`;
  } else {
    questionTypeInstructions = `You're doing a technical interview only.
Ask coding concepts, system design, debugging scenarios, and architecture questions. No behavioral questions at all. Dive straight into technical topics.`;
  }

  return `${interviewerPersonality}

You're a senior ${roleLabel} engineering interviewer.

You only ask questions about software engineering, computer science, and technology. Your focus area is ${topics}.
If the candidate tries to go off-topic or ask you questions, redirect them. Say something like "That's an interesting thought, but let's stay focused on the interview." Then ask your next question.
Don't answer questions about non-interview topics. You're the interviewer, not the interviewee.
If the candidate asks personal questions about you, say "I appreciate the curiosity, but let's keep our focus on your experience." Then move on.
Don't engage in small talk beyond the initial greeting.

${difficultyInstructions}

${experienceInstructions}

${strictnessInstructions}

${questionTypeInstructions}

Ask one question at a time. Wait for a complete response before continuing.
Keep your responses under three sentences. This is a voice interview, so be concise.
Ask follow-up questions based on the candidate's actual answer. Don't follow a rigid script.
After eight to ten questions total, wrap up naturally. Say something like "We're coming to the end of our time. Thanks for your answers today." Then end gracefully.
Never ask multiple questions in a single turn.

SPEECH STYLE:
Never use exclamation marks. They cause unnatural vocal emphasis. Use periods instead.
Keep sentences short, fifteen words or fewer. Long sentences sound robotic when spoken.
Use contractions naturally. Say "you're" not "you are," "let's" not "let us," "don't" not "do not," "won't" not "will not," "I'd" not "I would."
Avoid abbreviations entirely. Say "for example" not "e.g." Say "that is" not "i.e." Say "and so on" not "etc."
Spell out all numbers under one hundred. Say "twenty three" not "23." Say "fifty percent" not "50%."
When you first mention an acronym, say the full name. For example, say "Representational State Transfer, or REST" the first time. After that, just say "REST."
Never use special characters, markdown, bullet points, numbered lists, asterisks, or dashes. This is spoken conversation, not text.
Instead of parenthetical asides, use a short clause. Say "React, which is a JavaScript library" not "React (a JavaScript library)."
Never emphasize words with all caps.
Start some responses with natural conversational openers. Things like "So," "Now," "Alright," or "Okay so."
Break up complex ideas across multiple short sentences. Instead of one long question, split it into a setup and then the question.
Use casual transitions between topics. "Alright, let's switch gears." "Good answer. Let me ask you something different." "Okay, moving on."
Keep greetings warm but not overly enthusiastic. Say "Hi, thanks for joining." not "Hello and welcome."
Avoid words that cause pronunciation issues in speech. Don't say "albeit," "miscellaneous," "unequivocally." Say "in particular" instead of "specifically." Say "approach" instead of "methodology." Say "use" instead of "utilize." Say "help" instead of "facilitate."
Prefer simple everyday words. Sound like a friendly senior engineer at a whiteboard, not a professor giving a lecture.`;
}

const FIRST_MESSAGE_TOPICS: Record<string, string> = {
  frontend: "some React, TypeScript, and UI topics",
  backend: "some system design and API topics",
  fullstack: "a mix of frontend and backend topics",
  devops: "some infrastructure and deployment topics",
  mobile: "some mobile development topics",
  data: "some data engineering and SQL topics",
};

function buildFirstMessage(config: VapiInterviewConfig, interviewerName: string): string {
  const roleLabel = config.role.charAt(0).toUpperCase() + config.role.slice(1);
  const topicPreview = FIRST_MESSAGE_TOPICS[config.role] ?? "some software engineering topics";

  return `Hi, thanks for joining today. I'm ${interviewerName}. I'll be running your ${roleLabel} engineering interview. We'll go over ${topicPreview}. Ready to dive in?`;
}

export { getDifficultyLabel, getExperienceLabel, getStrictnessLabel };

export function useVapiInterview() {
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
      console.log("Call started");
      setStatus("active");
      setIsListening(true);
      setIsMuted(false);
      vapi.setMuted(false);
      console.log("Mic muted:", false);
    };

    const onCallEnd = () => {
      console.log("Call ended naturally");
      setStatus("ended");
      setIsSpeaking(false);
      setIsListening(false);
      setCallEndedNaturally(true);
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
    config: VapiInterviewConfig,
  ): Promise<{ result: VapiAnalysisResult; id: string } | null> => {
    if (transcript.length < 2) {
      console.warn("Not enough messages to evaluate");
      return null;
    }
    setIsAnalyzing(true);
    try {
      const { result, id } = await evaluateVapiInterview(transcript, config);
      return { result, id };
    } catch (err) {
      console.error("Failed to evaluate transcript:", err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const start = async (config: VapiInterviewConfig) => {
    try {
      console.log("START CLICKED — inline config:", config);
      setStatus("connecting");
      setMessages([]);
      setCallEndedNaturally(false);
      setIsMuted(false);

      // Unlock audio output (must happen in user-gesture handler)
      const audioContext = new AudioContext();
      await audioContext.resume();
      console.log("AudioContext state:", audioContext.state);

      const interviewerKey = (config.interviewer ?? "cassidy").toLowerCase();
      const interviewer = INTERVIEWERS[interviewerKey] ?? INTERVIEWERS["cassidy"]!;
      const resolvedVoice = resolveVoice(interviewer.voice);
      console.log("Selected interviewer:", interviewerKey);
      console.log("Resolved voice:", resolvedVoice);

      const systemPrompt = buildSystemPrompt(config, interviewer.personality);
      const firstMessage = buildFirstMessage(config, interviewer.name);
      console.log("System prompt length:", systemPrompt.length);
      console.log("First message:", firstMessage);

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
      const call = await vapi.start(assistantConfig);
      console.log("Vapi call object:", call);
    } catch (err) {
      console.error("Failed to start Vapi call:", err);
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
