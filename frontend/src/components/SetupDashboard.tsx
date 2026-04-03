import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Volume2, Loader2 } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
import { vapi } from "../lib/vapi";
import { INTERVIEWERS, resolveVoice } from "../hooks/useVapiInterview";
import { TOPIC_CATEGORIES } from "../data/technicalProblems";
import { DashboardNavbar } from "./DashboardNavbar";

const ROLE_LANGUAGES: Record<string, string[]> = {
  frontend:  ["JavaScript", "TypeScript"],
  backend:   ["Node.js", "Python", "Java"],
  fullstack: ["JavaScript", "TypeScript"],
  ml:        ["Python"],
  mobile:    ["JavaScript", "TypeScript"],
  devops:    ["Python", "Bash"],
  security:  ["Python", "JavaScript"],
  systems:   ["C++", "Python"],
};

const interviewerAvatars = [
  { name: "Cassidy", color: "from-purple-400 to-pink-400" },
  { name: "Alex", color: "from-blue-400 to-cyan-400" },
  { name: "Jordan", color: "from-green-400 to-emerald-400" },
];

type InterviewerDisplay = {
  style: string;
  description: string;
  traits: string[];
  badgeClass: string;
  accentClass: string;
};

const INTERVIEWER_DISPLAY: Record<string, InterviewerDisplay> = {
  cassidy: {
    style: "Conversational",
    description:
      "Builds rapport quickly and makes you feel at ease — then turns up the heat with pointed follow-ups. Warm and supportive on the surface, but won't let vague or weak answers slide.",
    traits: ["Warm", "Encouraging", "Probing", "Personable"],
    badgeClass: "bg-purple-100 text-purple-700",
    accentClass: "text-purple-500",
  },
  alex: {
    style: "Formal",
    description:
      "Direct, precise, and strictly technical. Expects structured thinking and concise answers. Has no patience for hand-waving — if your answer is incomplete, you'll hear about it.",
    traits: ["Direct", "Precise", "Technical", "Demanding"],
    badgeClass: "bg-blue-100 text-blue-700",
    accentClass: "text-blue-500",
  },
  jordan: {
    style: "Analytical",
    description:
      "Calm and methodical, with a deep curiosity about how you think. Asks things like \"walk me through your reasoning\" and \"what would change if the requirements shifted?\"",
    traits: ["Curious", "Methodical", "Patient", "Thoughtful"],
    badgeClass: "bg-green-100 text-green-700",
    accentClass: "text-green-500",
  },
};

export function SetupDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") || "backend";

  const [role, setRole] = useState(roleParam);
  const [questionType, setQuestionType] = useState("behavioral");
  const [language, setLanguage] = useState(() => ROLE_LANGUAGES[roleParam]?.[0] ?? "JavaScript");
  const [questionDifficulty, setQuestionDifficulty] = useState([50]);
  const [interviewerStrictness, setInterviewerStrictness] = useState([50]);
  const [experienceLevel, setExperienceLevel] = useState([2]);
  const [selectedInterviewer, setSelectedInterviewer] = useState(0);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [previewingKey, setPreviewingKey] = useState<string | null>(null);
  const previewCleanupRef = useRef<(() => void) | null>(null);

  const experienceLevels = ["Intern", "Entry", "Junior", "Senior"];

  // Stop any active preview when this component unmounts
  useEffect(() => () => { previewCleanupRef.current?.(); }, []);

  // Reset language to the first option whenever role changes
  useEffect(() => {
    setLanguage(ROLE_LANGUAGES[role]?.[0] ?? "JavaScript");
  }, [role]);

  async function previewVoice(interviewerName: string) {
    // Stop any currently playing preview before starting a new one
    if (previewCleanupRef.current) {
      previewCleanupRef.current();
      await new Promise<void>((r) => setTimeout(r, 200));
    }

    const key = interviewerName.toLowerCase();
    const interviewer = INTERVIEWERS[key] ?? INTERVIEWERS["cassidy"]!;
    const resolvedVoice = resolveVoice(interviewer.voice);
    const previewText = `Hi, I'm ${interviewer.name}. I'll be your interviewer today.`;

    console.log("Previewing voice:", key);
    setPreviewingKey(key);

    let cleaned = false;
    let safetyTimeout: ReturnType<typeof setTimeout>;

    // Unified cleanup — idempotent, safe to call multiple times
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      clearTimeout(safetyTimeout);
      vapi.removeListener("speech-end", onSpeechEnd);
      vapi.removeListener("call-end", onCallEnd);
      vapi.removeListener("error", onError);
      setPreviewingKey(null);
      previewCleanupRef.current = null;
      vapi.stop();
    };

    // call-end fires after vapi.stop() — avoid calling stop() again from here
    const onCallEnd = () => {
      if (cleaned) return;
      cleaned = true;
      clearTimeout(safetyTimeout);
      vapi.removeListener("speech-end", onSpeechEnd);
      vapi.removeListener("error", onError);
      setPreviewingKey(null);
      previewCleanupRef.current = null;
    };

    const onSpeechEnd = () => cleanup();
    const onError = (e: unknown) => {
      console.error("Voice preview error:", e);
      cleanup();
    };

    safetyTimeout = setTimeout(cleanup, 12000);
    previewCleanupRef.current = cleanup;

    vapi.on("speech-end", onSpeechEnd);
    vapi.on("call-end", onCallEnd);
    vapi.on("error", onError);

    try {
      const audioCtx = new AudioContext();
      await audioCtx.resume();
      await vapi.start({
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: "You have just introduced yourself. Stay silent and wait — the user is only previewing your voice." }],
        },
        voice: resolvedVoice,
        transcriber: { provider: "deepgram", model: "nova-3", language: "en" },
        firstMessage: previewText,
      } as Parameters<typeof vapi.start>[0]);
    } catch (err) {
      console.error("Voice preview failed:", err);
      console.warn("Could not preview voice for:", key);
      cleanup();
    }
  }

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <DashboardNavbar activeTab="Practice Interviews" />
      <div className="max-w-7xl mx-auto p-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 mb-8 pt-2"
        >
          Configure Your Interview
        </motion.h1>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Configuration */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-lg bg-white/40 rounded-2xl p-8 border border-white/50 shadow-xl space-y-8"
          >
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Role Selection
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="frontend">Frontend Engineer</option>
                <option value="backend">Backend Engineer</option>
                <option value="fullstack">Full-Stack Engineer</option>
                <option value="ml">Machine Learning Engineer</option>
                <option value="mobile">Mobile Developer</option>
                <option value="devops">DevOps Engineer</option>
                <option value="security">Cybersecurity Engineer</option>
                <option value="systems">Systems Engineer</option>
              </select>
            </div>

            {/* Question Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Question Type
              </label>
              <div className="flex gap-2">
                {["behavioral", "technical"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setQuestionType(type)}
                    className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      questionType === type
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                        : "bg-white/60 text-gray-700 hover:bg-white/80"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selection — only shown for technical interviews */}
            {questionType === "technical" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Language
                </label>
                <div className="flex flex-wrap gap-2">
                  {(ROLE_LANGUAGES[role] ?? ["JavaScript"]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        language === lang
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                          : "bg-white/60 text-gray-700 hover:bg-white/80"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Topic Filter — only for technical interviews */}
            {questionType === "technical" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Focus Topics
                  </label>
                  <span className="text-xs text-gray-400">
                    {selectedTopics.length === 0
                      ? "All topics"
                      : `${selectedTopics.length} selected`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TOPIC_CATEGORIES.map((topic) => {
                    const active = selectedTopics.includes(topic.id);
                    return (
                      <button
                        key={topic.id}
                        onClick={() => toggleTopic(topic.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          active
                            ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-sm"
                            : "bg-white/60 text-gray-600 border border-gray-200 hover:bg-white/80 hover:border-gray-300"
                        }`}
                      >
                        {topic.label}
                      </button>
                    );
                  })}
                </div>
                {selectedTopics.length > 0 && (
                  <button
                    onClick={() => setSelectedTopics([])}
                    className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            )}

            {/* Question Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Question Difficulty
              </label>
              <Slider.Root
                value={questionDifficulty}
                onValueChange={setQuestionDifficulty}
                max={100}
                step={1}
                className="relative flex items-center w-full h-5"
              >
                <Slider.Track className="relative h-2 flex-grow bg-white/60 rounded-full">
                  <Slider.Range className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-5 h-5 bg-white shadow-lg rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </Slider.Root>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Easy</span>
                <span>Medium</span>
                <span>Hard</span>
              </div>
            </div>

            {/* Interviewer Strictness */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interviewer Strictness
              </label>
              <Slider.Root
                value={interviewerStrictness}
                onValueChange={setInterviewerStrictness}
                max={100}
                step={1}
                className="relative flex items-center w-full h-5"
              >
                <Slider.Track className="relative h-2 flex-grow bg-white/60 rounded-full">
                  <Slider.Range className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-5 h-5 bg-white shadow-lg rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </Slider.Root>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Relaxed</span>
                <span>Standard</span>
                <span>Strict</span>
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Experience Level
              </label>
              <Slider.Root
                value={experienceLevel}
                onValueChange={setExperienceLevel}
                max={3}
                step={1}
                className="relative flex items-center w-full h-5"
              >
                <Slider.Track className="relative h-2 flex-grow bg-white/60 rounded-full">
                  <Slider.Range className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-5 h-5 bg-white shadow-lg rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </Slider.Root>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                {experienceLevels.map((level) => (
                  <span key={level}>{level}</span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Panel - Interviewer Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="backdrop-blur-lg bg-white/40 rounded-2xl p-8 border border-white/50 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Your Interviewer
              </h3>

              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${interviewerAvatars[selectedInterviewer]!.color} flex items-center justify-center shadow-lg`}>
                  <span className="text-4xl font-bold text-white">
                    {interviewerAvatars[selectedInterviewer]!.name[0]}
                  </span>
                </div>
              </div>

              <h4 className="text-2xl font-bold text-center text-gray-900 mb-6">
                {interviewerAvatars[selectedInterviewer]!.name}
              </h4>

              {/* Interviewer Selection */}
              <div className="flex justify-center gap-3 mb-5">
                {interviewerAvatars.map((avatar, index) => (
                  <button
                    key={avatar.name}
                    onClick={() => setSelectedInterviewer(index)}
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatar.color} transition-all ${
                      selectedInterviewer === index
                        ? "ring-4 ring-blue-500 scale-110"
                        : "opacity-50 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>

              {/* Personality card — modelled after ElevenLabs / Vapi voice cards */}
              {(() => {
                const key = interviewerAvatars[selectedInterviewer]!.name.toLowerCase();
                const display = INTERVIEWER_DISPLAY[key]!;
                const isPreviewing = previewingKey === key;
                return (
                  <div className="rounded-xl bg-white/30 border border-white/50 overflow-hidden">
                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/40">
                      <span className={`text-xs font-semibold uppercase tracking-widest ${display.accentClass}`}>
                        {display.style}
                      </span>
                      <div className="flex gap-1">
                        {display.traits.map((trait) => (
                          <span
                            key={trait}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${display.badgeClass}`}
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="px-4 py-3 text-sm text-gray-600 leading-relaxed">
                      {display.description}
                    </p>

                    {/* Preview button — integrated at the card bottom like ElevenLabs */}
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => previewVoice(interviewerAvatars[selectedInterviewer]!.name)}
                        disabled={isPreviewing}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all
                          ${isPreviewing
                            ? "bg-white/40 border-white/40 text-gray-400 cursor-not-allowed"
                            : "bg-white/60 hover:bg-white/80 border-white/50 text-gray-700 shadow-sm"
                          }`}
                      >
                        {isPreviewing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Playing sample…
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4" />
                            Preview voice
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Start Interview Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Stop any active voice preview before entering the interview
                previewCleanupRef.current?.();
                const isTechnical = questionType === "technical";
                const route = isTechnical ? "/technical-interview" : "/interview/voice";
                navigate(route, {
                  state: {
                    role,
                    questionType,
                    language: questionType === "technical" ? language : undefined,
                    difficulty: questionDifficulty[0],
                    strictness: interviewerStrictness[0],
                    // Normalize 0–3 index to 0–100 scale expected by both hooks
                    // Intern→0, Entry→25, Junior→50, Senior→100
                    experienceLevel: [0, 25, 50, 100][experienceLevel[0]] ?? 50,
                    interviewer: interviewerAvatars[selectedInterviewer]!.name,
                    selectedTopics: questionType === "technical" ? selectedTopics : [],
                  },
                });
              }}
              className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Start Interview
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
