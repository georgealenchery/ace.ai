import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, MessageSquare, Code, Lightbulb, ArrowLeft } from "lucide-react";
import { getInterviewHistory } from "../services/api";
import type { VapiAnalysisResult, SavedInterview } from "../services/api";

export function AnalyticsDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    result?: VapiAnalysisResult | null;
    config?: { role?: string; questionType?: string };
  } | null;

  const [history, setHistory] = useState<SavedInterview[]>([]);
  const [loading, setLoading] = useState(true);

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
    .map((entry) => ({
      date: new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: entry.result.score,
    }));

  // If we have a fresh result not yet in history, append it
  if (state?.result && (history.length === 0 || history[0]!.result.score !== state.result.score)) {
    chartData.push({ date: "Now", score: state.result.score });
  }

  // Past interviews list (most recent first, skip the current one if from state)
  const pastInterviews = history.map((entry) => ({
    id: entry.id,
    date: new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    role: entry.role.charAt(0).toUpperCase() + entry.role.slice(1),
    score: entry.result.score,
    type: entry.questionType.charAt(0).toUpperCase() + entry.questionType.slice(1),
  }));

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
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
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
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="url(#colorGradient)"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", r: 4 }}
                  activeDot={{ r: 6 }}
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
            <div className="space-y-4">
              {pastInterviews.length === 0 ? (
                <p className="text-gray-500">No past interviews yet.</p>
              ) : (
                pastInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">{interview.role}</p>
                      <p className="text-sm text-gray-600">{interview.date} &bull; {interview.type}</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{interview.score}%</div>
                  </div>
                ))
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
