import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, MessageSquare, Code, Lightbulb, ChevronDown, ChevronUp, Play } from "lucide-react";
import { DashboardNavbar } from "./DashboardNavbar";
import { getInterviewHistory } from "../services/api";
import type { VapiAnalysisResult, SavedInterview } from "../services/api";

export function AnalyticsDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    result?: VapiAnalysisResult | null;
    config?: { role?: string; questionType?: string };
    interviewId?: string | null;
  } | null;

  const [history, setHistory] = useState<SavedInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    getInterviewHistory()
      .then(setHistory)
      .catch((err) => console.error("Failed to fetch history:", err))
      .finally(() => setLoading(false));
  }, []);

  // Use result from router state, or fall back to most recent from history
  const result: VapiAnalysisResult | null =
    state?.result ?? (history.length > 0 ? history[0]!.result : null);

  // Calculate score change vs previous interview
  const previousScore = history.length > 1 ? history[1]!.result.score : null;
  const scoreChange = result && previousScore != null ? result.score - previousScore : null;

  // Chart data from history (oldest first)
  const chartData = [...history]
    .reverse()
    .map((entry, idx) => {
      const d = new Date(entry.date);
      return {
        idx,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
          " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        score: entry.result.score,
      };
    });

  // If we have a fresh result not yet in history, append it
  if (state?.result && (history.length === 0 || history[0]!.result.score !== state.result.score)) {
    chartData.push({ idx: chartData.length, label: "Now", score: state.result.score });
  }

  // Group past interviews by time period
  const groupedHistory = (() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const groups: { label: string; entries: SavedInterview[] }[] = [
      { label: "Today", entries: [] },
      { label: "This Week", entries: [] },
      { label: "This Month", entries: [] },
      { label: "Older", entries: [] },
    ];

    for (const entry of history) {
      const d = new Date(entry.date);
      if (d >= startOfToday) groups[0]!.entries.push(entry);
      else if (d >= startOfWeek) groups[1]!.entries.push(entry);
      else if (d >= startOfMonth) groups[2]!.entries.push(entry);
      else groups[3]!.entries.push(entry);
    }

    return groups.filter((g) => g.entries.length > 0);
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-6">
        <div className="max-w-7xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No Interviews Yet</h1>
          <p className="text-gray-600 mb-8">Complete a voice interview to see your performance analytics here.</p>
          <button
            onClick={() => navigate("/roles")}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            Start Your First Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <DashboardNavbar activeTab="Analytics" />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
            <p className="text-gray-600">Track your interview progress and improvement</p>
          </motion.div>
        </div>

        {/* Score Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-lg bg-white/40 rounded-2xl p-8 border border-white/50 shadow-xl mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-gray-600 mb-2">Latest Interview Score</h2>
              <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {result.score}%
              </div>
              <p className="text-gray-600 mt-2">Interview Complete</p>
              {state?.interviewId && (
                <button
                  onClick={() => navigate(`/interviews/${state.interviewId}`)}
                  className="mt-3 flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
                >
                  <Play className="w-4 h-4" />
                  View Full Replay
                </button>
              )}
            </div>
            {scoreChange != null && (
              <div className={`flex items-center gap-2 ${scoreChange >= 0 ? "text-green-600" : "text-red-500"}`}>
                {scoreChange >= 0 ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
                <span className="text-2xl font-bold">{scoreChange >= 0 ? "+" : ""}{scoreChange}%</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Analytics Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-lg bg-white/40 rounded-2xl p-6 border border-white/50 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Communication</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Clarity</span>
                  <span className="text-sm font-semibold">{result.communication}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: `${result.communication}%` }} />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-lg bg-white/40 rounded-2xl p-6 border border-white/50 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
                <Code className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Technical Accuracy</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Correctness</span>
                  <span className="text-sm font-semibold">{result.technicalAccuracy}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full" style={{ width: `${result.technicalAccuracy}%` }} />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-lg bg-white/40 rounded-2xl p-6 border border-white/50 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Problem Solving</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Approach</span>
                  <span className="text-sm font-semibold">{result.problemSolving}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pink-400 to-pink-600 rounded-full" style={{ width: `${result.problemSolving}%` }} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Improvement Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-lg bg-white/40 rounded-2xl p-8 border border-white/50 shadow-xl mb-6"
        >
          <h3 className="font-semibold text-gray-900 mb-6">Improvement Over Time</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="idx"
                  stroke="#6b7280"
                  tickFormatter={(idx: number) => `#${idx + 1}`}
                  fontSize={11}
                />
                <YAxis stroke="#6b7280" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  labelFormatter={(idx: number) => chartData[idx]?.label ?? ""}
                  formatter={(value: number) => [`${value}%`, "Score"]}
                />
                <Line
                  type="linear"
                  dataKey="score"
                  stroke="url(#colorGradient)"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 3 }}
                  activeDot={{ r: 5, fill: "#a855f7" }}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">Complete more interviews to see your progress over time.</p>
          )}
        </motion.div>

        {/* Side by Side: Past Interviews & AI Feedback */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Timeline of Past Interviews */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-lg bg-white/40 rounded-2xl p-8 border border-white/50 shadow-xl"
          >
            <h3 className="font-semibold text-gray-900 mb-6">Past Interviews</h3>
            <div className="space-y-5 max-h-[600px] overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="text-gray-500">No past interviews yet.</p>
              ) : (
                groupedHistory.map((group) => {
                  const isCollapsed = collapsedGroups.has(group.label);
                  return (
                  <div key={group.label}>
                    <button
                      onClick={() => setCollapsedGroups((prev) => {
                        const next = new Set(prev);
                        if (next.has(group.label)) next.delete(group.label);
                        else next.add(group.label);
                        return next;
                      })}
                      className="flex items-center gap-2 mb-2 group w-full"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                      ) : (
                        <ChevronUp className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                      )}
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition-colors">
                        {group.label}
                      </span>
                      <span className="text-xs text-gray-400">({group.entries.length})</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                    <div className="space-y-3">
                      {group.entries.map((entry) => {
                        const isExpanded = expandedId === entry.id;
                        const r = entry.result;
                        return (
                          <div key={entry.id} className="rounded-xl overflow-hidden">
                            <div className="flex items-center bg-white/50 hover:bg-white/70 transition-colors rounded-xl overflow-hidden">
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                                className="flex-1 flex items-center justify-between p-4"
                              >
                                <div className="text-left">
                                  <p className="font-medium text-gray-900">
                                    {entry.role.charAt(0).toUpperCase() + entry.role.slice(1)}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} &bull; {entry.questionType.charAt(0).toUpperCase() + entry.questionType.slice(1)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl font-bold text-blue-600">{r.score}%</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                              </button>
                              <button
                                onClick={() => navigate(`/interviews/${entry.id}`)}
                                title="View replay"
                                className="px-3 py-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 transition-colors border-l border-white/50"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            </div>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 pt-2 space-y-4">
                                    {/* Metric bars */}
                                    <div className="grid grid-cols-3 gap-3">
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Communication</p>
                                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${r.communication}%` }} />
                                        </div>
                                        <p className="text-xs font-semibold text-gray-700 mt-0.5">{r.communication}%</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Technical</p>
                                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${r.technicalAccuracy}%` }} />
                                        </div>
                                        <p className="text-xs font-semibold text-gray-700 mt-0.5">{r.technicalAccuracy}%</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Problem Solving</p>
                                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                          <div className="h-full bg-pink-500 rounded-full" style={{ width: `${r.problemSolving}%` }} />
                                        </div>
                                        <p className="text-xs font-semibold text-gray-700 mt-0.5">{r.problemSolving}%</p>
                                      </div>
                                    </div>

                                    {/* Strengths */}
                                    {r.strengths.length > 0 && (
                                      <div>
                                        <h4 className="text-xs font-semibold text-green-700 mb-1">Strengths</h4>
                                        <ul className="space-y-0.5 text-xs text-gray-600 ml-3">
                                          {r.strengths.map((s, i) => <li key={i}>&bull; {s}</li>)}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Improvements */}
                                    {r.improvements.length > 0 && (
                                      <div>
                                        <h4 className="text-xs font-semibold text-orange-700 mb-1">Areas to Improve</h4>
                                        <ul className="space-y-0.5 text-xs text-gray-600 ml-3">
                                          {r.improvements.map((s, i) => <li key={i}>&bull; {s}</li>)}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Question Breakdown */}
                                    {r.questionBreakdown.length > 0 && (
                                      <div>
                                        <h4 className="text-xs font-semibold text-gray-700 mb-2">Question Breakdown</h4>
                                        <div className="space-y-2">
                                          {r.questionBreakdown.map((q, i) => (
                                            <div key={i} className="bg-white/60 rounded-lg p-3">
                                              <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="text-xs font-medium text-gray-800">{q.question}</p>
                                                <span className="text-xs font-bold text-blue-600 shrink-0">{q.score}%</span>
                                              </div>
                                              <p className="text-xs text-gray-500 mb-1">{q.candidateAnswer}</p>
                                              <p className="text-xs text-gray-600 italic">{q.feedback}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* AI Feedback Summary — dynamic from result */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="backdrop-blur-lg bg-white/40 rounded-2xl p-8 border border-white/50 shadow-xl"
          >
            <h3 className="font-semibold text-gray-900 mb-6">AI Feedback Summary</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Strengths
                </h4>
                <ul className="space-y-1 text-sm text-gray-700 ml-4">
                  {result.strengths.map((s, i) => (
                    <li key={i}>&bull; {s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-1 text-sm text-gray-700 ml-4">
                  {result.improvements.map((s, i) => (
                    <li key={i}>&bull; {s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  Suggested Next Steps
                </h4>
                <ul className="space-y-1 text-sm text-gray-700 ml-4">
                  {result.nextSteps.map((s, i) => (
                    <li key={i}>&bull; {s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6 flex justify-center"
        >
          <button
            onClick={() => navigate("/roles")}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            Start Another Interview
          </button>
        </motion.div>
      </div>
    </div>
  );
}
