import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ChevronDown, ChevronUp, Mic, Code2, Play } from "lucide-react";
import type { ReplayInterview, TranscriptEntry } from "../services/api";
import { DashboardNavbar } from "./DashboardNavbar";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(ts: number, baseTs: number): string {
  const secs = Math.max(0, Math.floor((ts - baseTs) / 1000));
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function scoreColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-amber-400";
  return "bg-red-500";
}

function scoreTextColor(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

// Build a display transcript from questionBreakdown when no real transcript is stored
function buildFallbackTranscript(interview: ReplayInterview): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];
  for (const q of interview.result.questionBreakdown) {
    if (q.question) entries.push({ role: "assistant", text: q.question });
    if (q.candidateAnswer) entries.push({ role: "user", text: q.candidateAnswer });
  }
  return entries;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MessageBubble({
  entry,
  relTime,
  questionLabel,
  onJumpToAnalysis,
}: {
  entry: TranscriptEntry;
  relTime?: string;
  questionLabel?: string;
  onJumpToAnalysis?: () => void;
}) {
  const isAssistant = entry.role === "assistant";

  return (
    <div className={`flex gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold self-start mt-0.5 ${
          isAssistant
            ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
            : "bg-gradient-to-br from-blue-500 to-cyan-500 text-white"
        }`}
      >
        {isAssistant ? "I" : "U"}
      </div>

      <div className={`flex flex-col gap-1 max-w-[80%] ${isAssistant ? "" : "items-end"}`}>
        {/* Timestamp + label */}
        <div className={`flex items-center gap-2 ${isAssistant ? "" : "flex-row-reverse"}`}>
          {relTime && (
            <span className="text-[9px] font-mono text-gray-600">{relTime}</span>
          )}
          {questionLabel && (
            <span className="text-[9px] font-semibold text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded-full">
              {questionLabel}
            </span>
          )}
        </div>

        {/* Bubble */}
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isAssistant
              ? "bg-purple-500/10 border border-purple-500/20 text-gray-200 rounded-tl-sm"
              : "bg-blue-500/15 border border-blue-500/20 text-gray-200 rounded-tr-sm"
          }`}
        >
          {entry.text}
        </div>

        {/* Jump to analysis link */}
        {questionLabel && onJumpToAnalysis && (
          <button
            onClick={onJumpToAnalysis}
            className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
          >
            <Play className="w-2.5 h-2.5" />
            View analysis
          </button>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${scoreColor(score)}`}
        />
      </div>
      <span className={`text-sm font-bold tabular-nums shrink-0 ${scoreTextColor(score)}`}>
        {score}
      </span>
    </div>
  );
}

function QuestionCard({
  question,
  answer,
  score,
  feedback,
  index,
  cardRef,
  defaultExpanded,
}: {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  index: number;
  cardRef: React.RefObject<HTMLDivElement | null>;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      ref={cardRef}
      className="backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 overflow-hidden scroll-mt-4"
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left gap-3"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="shrink-0 w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <span className="text-sm text-gray-200 truncate font-medium">{question}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-sm font-bold ${scoreTextColor(score)}`}>{score}</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Score bar */}
              <ScoreBar score={score} />

              {/* Answer */}
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Candidate Answer
                </p>
                <p className="text-xs text-gray-300 leading-relaxed">{answer}</p>
              </div>

              {/* Feedback */}
              <div className="bg-white/5 rounded-lg px-3 py-2.5 border border-white/10">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  AI Feedback
                </p>
                <p className="text-xs text-gray-400 leading-relaxed italic">{feedback}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface InterviewReplayProps {
  interview: ReplayInterview;
  backHref?: string;
  backLabel?: string;
}

export function InterviewReplay({ interview, backHref, backLabel }: InterviewReplayProps) {
  const navigate = useNavigate();
  const breakdown = interview.result.questionBreakdown;

  // Build transcript: prefer stored transcript, fall back to questionBreakdown
  const rawTranscript: TranscriptEntry[] =
    interview.transcript && interview.transcript.length > 0
      ? interview.transcript
      : buildFallbackTranscript(interview);

  const baseTs = rawTranscript[0]?.timestamp ?? 0;
  const hasTimes = rawTranscript.some((e) => e.timestamp != null && e.timestamp > 0);

  // Detect which assistant messages are "the questions" by matching breakdown question text
  // We mark each assistant message with the question index it corresponds to (-1 if not a question)
  const questionIndices: number[] = rawTranscript.map((entry) => {
    if (entry.role !== "assistant") return -1;
    const idx = breakdown.findIndex(
      (q) => q.question && entry.text.trim().includes(q.question.trim().slice(0, 40))
    );
    return idx;
  });

  // Refs for right-panel question cards so left panel can scroll to them
  const cardRefs = useRef<Array<React.RefObject<HTMLDivElement | null>>>(
    breakdown.map(() => ({ current: null }))
  );

  const scrollToCard = (idx: number) => {
    cardRefs.current[idx]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const roleLabel = interview.role.charAt(0).toUpperCase() + interview.role.slice(1);
  const overallScore = interview.result.score;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">

      <DashboardNavbar activeTab="Interviews" variant="dark" compact />

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 backdrop-blur-lg bg-gray-900/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate(backHref ?? "/interviews")}
            className="shrink-0 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel ?? "Back"}
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-white/10" />

          {/* Metadata */}
          <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-white">{roleLabel} Engineer</span>
            <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
              {interview.question_type === "technical" ? (
                <Code2 className="w-3 h-3" />
              ) : (
                <Mic className="w-3 h-3" />
              )}
              <span className="capitalize">{interview.question_type}</span>
            </span>
            <span className="text-xs text-gray-500 shrink-0">{formatDate(interview.date)}</span>
            {interview.config?.difficulty != null && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-300 shrink-0">
                {interview.config.difficulty <= 30 ? "Easy" : interview.config.difficulty <= 60 ? "Medium" : "Hard"}
              </span>
            )}
          </div>

          {/* Score badge */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs text-gray-500">Score</span>
            <span
              className={`text-xl font-bold tabular-nums ${scoreTextColor(overallScore)}`}
            >
              {overallScore}
            </span>
          </div>

          <button
            onClick={() => navigate("/roles")}
            className="shrink-0 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            New Interview
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col lg:flex-row gap-6 min-h-0">

        {/* ── LEFT — Transcript timeline ─────────────────────────────────── */}
        <div className="lg:w-[42%] flex flex-col min-h-0">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 px-1">
            Transcript
          </h2>
          <div className="flex-1 dark-scrollbar overflow-y-auto lg:max-h-[calc(100vh-140px)]">
            <div className="relative pl-4">
              {/* Vertical timeline line */}
              <div className="absolute left-0 top-2 bottom-2 w-px bg-white/10" />

              <div className="space-y-5">
                {rawTranscript.map((entry, i) => {
                  const qIdx = questionIndices[i];
                  const hasQuestion = qIdx !== -1 && qIdx < breakdown.length;
                  const relTime = hasTimes && entry.timestamp
                    ? relativeTime(entry.timestamp, baseTs)
                    : undefined;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.025, 0.5) }}
                    >
                      {/* Timeline node */}
                      <div className="absolute left-[-3px] mt-[14px] w-1.5 h-1.5 rounded-full bg-white/20" />
                      <MessageBubble
                        entry={entry}
                        relTime={relTime}
                        questionLabel={hasQuestion ? `Q${qIdx! + 1}` : undefined}
                        onJumpToAnalysis={hasQuestion ? () => scrollToCard(qIdx!) : undefined}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT — Question analysis ──────────────────────────────────── */}
        <div className="lg:w-[58%] flex flex-col min-h-0">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 px-1">
            Question Analysis
          </h2>
          <div className="flex-1 dark-scrollbar overflow-y-auto lg:max-h-[calc(100vh-140px)] space-y-3">

            {breakdown.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-10">
                No question breakdown available.
              </p>
            ) : (
              breakdown.map((q, i) => (
                <QuestionCard
                  key={i}
                  index={i}
                  question={q.question}
                  answer={q.candidateAnswer}
                  score={q.score}
                  feedback={q.feedback}
                  cardRef={cardRefs.current[i]!}
                  defaultExpanded={breakdown.length <= 4}
                />
              ))
            )}

            {/* ── Overall Summary ──────────────────────────────────────── */}
            <div className="backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 p-5 mt-2 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-200">Overall Summary</h3>
                <div className="flex items-center gap-4 text-xs">
                  {[
                    { label: "Communication", value: interview.result.communication },
                    { label: "Technical", value: interview.result.technicalAccuracy },
                    { label: "Problem Solving", value: interview.result.problemSolving },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="text-gray-500">{label}</p>
                      <p className={`font-bold ${scoreTextColor(value)}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {interview.result.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    Strengths
                  </p>
                  <ul className="space-y-1">
                    {interview.result.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-gray-300 flex gap-2">
                        <span className="text-green-500 shrink-0">·</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {interview.result.improvements.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                    Areas for Improvement
                  </p>
                  <ul className="space-y-1">
                    {interview.result.improvements.map((s, i) => (
                      <li key={i} className="text-xs text-gray-300 flex gap-2">
                        <span className="text-amber-500 shrink-0">·</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {interview.result.nextSteps.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                    Next Steps
                  </p>
                  <ul className="space-y-1">
                    {interview.result.nextSteps.map((s, i) => (
                      <li key={i} className="text-xs text-gray-300 flex gap-2">
                        <span className="text-blue-500 shrink-0">·</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
