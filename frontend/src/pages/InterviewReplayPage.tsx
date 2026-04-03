import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { getInterview } from "../services/api";
import type { ReplayInterview } from "../services/api";
import { InterviewReplay } from "../components/InterviewReplay";

export function InterviewReplayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Support loading from router state (current interview just completed)
  const stateInterview = (location.state as { interview?: ReplayInterview } | null)?.interview;

  const [interview, setInterview] = useState<ReplayInterview | null>(stateInterview ?? null);
  const [loading, setLoading] = useState(!stateInterview && !!id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stateInterview || !id) return;
    getInterview(id)
      .then(setInterview)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id, stateInterview]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6 text-white">
        <div className="text-center">
          <p className="text-red-400 font-medium mb-4">{error ?? "Interview not found"}</p>
          <button
            onClick={() => navigate("/interviews")}
            className="text-sm text-blue-400 hover:underline"
          >
            ← Back to interviews
          </button>
        </div>
      </div>
    );
  }

  return (
    <InterviewReplay
      interview={interview}
      backHref="/interviews"
      backLabel="All Interviews"
    />
  );
}
