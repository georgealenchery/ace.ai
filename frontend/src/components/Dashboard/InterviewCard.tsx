import { Card } from "../UI/Card";

type InterviewCardProps = {
  role: string;
  type: string;
  score?: number;
};

export function InterviewCard({ role, type, score }: InterviewCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <h3 className="font-semibold text-gray-800">{role}</h3>
      <p className="text-sm text-gray-500 mt-1">{type}</p>
      {score !== undefined && (
        <p className="mt-3 text-blue-600 font-medium text-sm">Score: {score}/100</p>
      )}
    </Card>
  );
}
