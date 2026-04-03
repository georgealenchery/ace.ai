import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ChevronRight, Calendar, Mic, Code2, Inbox } from "lucide-react";
import { getInterviews } from "../services/api";
import type { ReplayInterview } from "../services/api";
import { DashboardNavbar } from "../components/DashboardNavbar";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function InterviewsPage() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<ReplayInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInterviews()
      .then(setInterviews)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <DashboardNavbar activeTab="Interviews" />
      <div className="max-w-3xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Past Interviews</h1>
          <p className="mt-1 text-gray-500">Select any session to replay the full conversation.</p>
        </motion.div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50/80 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && interviews.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <Inbox className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No interviews yet</p>
            <p className="text-sm text-gray-400 mt-1">Complete an interview to see it here.</p>
            <button
              onClick={() => navigate("/setup")}
              className="mt-6 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold shadow hover:shadow-md transition-all"
            >
              Start an interview
            </button>
          </motion.div>
        )}

        {!loading && !error && interviews.length > 0 && (
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.04 }}
            className="space-y-3"
          >
            {interviews.map((iv, i) => (
              <motion.li
                key={iv.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <button
                  onClick={() => navigate(`/interviews/${iv.id}`)}
                  className="w-full text-left backdrop-blur-lg bg-white/40 hover:bg-white/60 rounded-2xl px-5 py-4 border border-white/50 shadow transition-all flex items-center gap-4 group"
                >
                  {/* Icon */}
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-sm">
                    {iv.question_type === "technical" ? (
                      <Code2 className="w-5 h-5 text-white" />
                    ) : (
                      <Mic className="w-5 h-5 text-white" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {roleLabel(iv.role)} Engineer
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium capitalize">
                        {iv.question_type}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(iv.date)}
                      </span>
                      {iv.result?.score != null && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          Score {iv.result.score}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 shrink-0 transition-colors" />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
}
