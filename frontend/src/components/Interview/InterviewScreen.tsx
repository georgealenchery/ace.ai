import { ChatPanel } from "./ChatPanel";
import { CodeEditor } from "./CodeEditor";

export function InterviewScreen() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left: Chat */}
      <div className="w-1/2 border-r flex flex-col">
        <header className="px-4 py-3 border-b bg-white">
          <h2 className="font-semibold text-gray-700">Interview Chat</h2>
        </header>
        <div className="flex-1 overflow-hidden">
          <ChatPanel />
        </div>
      </div>

      {/* Right: Code Editor */}
      <div className="w-1/2 flex flex-col">
        <header className="px-4 py-3 border-b bg-white">
          <h2 className="font-semibold text-gray-700">Code Editor</h2>
        </header>
        <div className="flex-1 p-4">
          <CodeEditor />
        </div>
      </div>
    </div>
  );
}
