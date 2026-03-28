import { DashboardNavbar } from "./DashboardNavbar";
import { motion } from "motion/react";
import { TrendingUp, Clock, Target, Award } from "lucide-react";

export function DashboardDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-blue-100">
      {/* Dashboard Navbar */}
      <DashboardNavbar userName="Lorenna" userInitials="LK" activeTab="Dashboard" />

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, Lorenna!</h1>
          <p className="text-lg text-gray-600">Track your progress and continue your interview preparation</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl bg-white/60 border border-white/60 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Interviews</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900">24</div>
            <p className="text-sm text-gray-600 mt-1">Total completed</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl bg-white/60 border border-white/60 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Avg Score</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900">82%</div>
            <p className="text-sm text-green-600 mt-1">+5% this week</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-xl bg-white/60 border border-white/60 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Time Spent</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900">12h</div>
            <p className="text-sm text-gray-600 mt-1">This month</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-xl bg-white/60 border border-white/60 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl">
                <Award className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Streak</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900">7</div>
            <p className="text-sm text-gray-600 mt-1">Days in a row</p>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="backdrop-blur-xl bg-white/60 border border-white/60 rounded-2xl p-8 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Interviews</h2>
          <div className="space-y-4">
            {[
              { date: "Today", role: "Backend Engineer", score: 85, type: "Technical" },
              { date: "Yesterday", role: "Full-Stack", score: 78, type: "Behavioral" },
              { date: "2 days ago", role: "Frontend", score: 82, type: "Hybrid" },
            ].map((interview, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white/50 rounded-xl hover:bg-white/70 transition-all cursor-pointer"
              >
                <div>
                  <p className="font-semibold text-gray-900">{interview.role}</p>
                  <p className="text-sm text-gray-600">
                    {interview.date} • {interview.type}
                  </p>
                </div>
                <div className="text-2xl font-bold text-blue-600">{interview.score}%</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
