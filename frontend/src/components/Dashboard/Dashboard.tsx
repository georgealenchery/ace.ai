import { InterviewCard } from "./InterviewCard";

const MOCK_INTERVIEWS = [
  { id: "1", role: "Frontend Engineer", type: "Technical", score: 82 },
  { id: "2", role: "Backend Engineer", type: "Behavioral", score: 74 },
  { id: "3", role: "Full Stack", type: "System Design" },
];

export function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Past Interviews</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_INTERVIEWS.map((interview) => (
          <InterviewCard
            key={interview.id}
            role={interview.role}
            type={interview.type}
            score={interview.score}
          />
        ))}
      </div>
    </div>
  );
}
