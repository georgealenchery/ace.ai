import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, MessageSquare, Code, Lightbulb, ArrowLeft } from "lucide-react";

const performanceData = [
  { date: "Jan 15", score: 65 },
  { date: "Jan 22", score: 70 },
  { date: "Feb 5", score: 68 },
  { date: "Feb 19", score: 75 },
  { date: "Mar 4", score: 78 },
  { date: "Mar 18", score: 82 },
  { date: "Mar 28", score: 82 },
];

const pastInterviews = [
  { date: "Mar 28, 2026", role: "Backend Engineer", score: 82, type: "Technical" },
  { date: "Mar 18, 2026", role: "Full-Stack", score: 78, type: "Hybrid" },
  { date: "Mar 4, 2026", role: "Backend Engineer", score: 75, type: "Behavioral" },
  { date: "Feb 19, 2026", role: "Backend Engineer", score: 68, type: "Technical" },
];

export function AnalyticsDashboard() {
  const navigate = useNavigate();

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
                82%
              </div>
              <p className="text-gray-600 mt-2">Backend Engineer • Technical Interview</p>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp className="w-8 h-8" />
              <span className="text-2xl font-bold">+4%</span>
            </div>
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
                  <span className="text-sm font-semibold">85%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: "85%" }} />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Strong articulation with minimal filler words. Consider pausing before answering.
              </p>
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
                  <span className="text-sm font-semibold">78%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full" style={{ width: "78%" }} />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Good understanding of concepts. Review edge cases and time complexity analysis.
              </p>
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
                  <span className="text-sm font-semibold">83%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pink-400 to-pink-600 rounded-full" style={{ width: "83%" }} />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Excellent systematic thinking. Break down problems before coding to save time.
              </p>
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
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
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
              {pastInterviews.map((interview, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{interview.role}</p>
                    <p className="text-sm text-gray-600">{interview.date} • {interview.type}</p>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{interview.score}%</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI Feedback Summary */}
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
                  <li>• Clear and structured communication style</li>
                  <li>• Strong understanding of database optimization</li>
                  <li>• Good time management during responses</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-1 text-sm text-gray-700 ml-4">
                  <li>• Consider more edge cases in solutions</li>
                  <li>• Practice explaining time complexity analysis</li>
                  <li>• Reduce usage of filler words ("um", "like")</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  Suggested Next Steps
                </h4>
                <ul className="space-y-1 text-sm text-gray-700 ml-4">
                  <li>• Practice system design interviews</li>
                  <li>• Review distributed systems concepts</li>
                  <li>• Try harder difficulty questions</li>
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
