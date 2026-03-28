import { Button } from "../components/UI/Button";

export function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">AI Interview Simulator</h1>
      <p className="text-gray-500 mb-8">Practice interviews with an AI interviewer.</p>
      <Button label="Start Interview" />
    </div>
  );
}
