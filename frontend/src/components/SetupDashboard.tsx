import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import * as Slider from "@radix-ui/react-slider";
import * as Tabs from "@radix-ui/react-tabs";

const interviewerAvatars = [
  { name: "Cassidy", color: "from-purple-400 to-pink-400" },
  { name: "Alex", color: "from-blue-400 to-cyan-400" },
  { name: "Jordan", color: "from-green-400 to-emerald-400" },
];

export function SetupDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") || "backend";

  const [role, setRole] = useState(roleParam);
  const [questionType, setQuestionType] = useState("hybrid");
  const [questionDifficulty, setQuestionDifficulty] = useState([50]);
  const [interviewerStrictness, setInterviewerStrictness] = useState([50]);
  const [experienceLevel, setExperienceLevel] = useState([2]);
  const [selectedInterviewer, setSelectedInterviewer] = useState(0);

  const experienceLevels = ["Intern", "Entry", "Junior", "Senior"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 mb-8"
        >
          Configure Your Interview
        </motion.h1>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Configuration */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-lg bg-white/40 rounded-2xl p-8 border border-white/50 shadow-xl space-y-8"
          >
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Role Selection
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="frontend">Frontend Engineer</option>
                <option value="backend">Backend Engineer</option>
                <option value="fullstack">Full-Stack Engineer</option>
                <option value="ml">Machine Learning Engineer</option>
                <option value="mobile">Mobile Developer</option>
                <option value="devops">DevOps Engineer</option>
                <option value="security">Cybersecurity Engineer</option>
                <option value="systems">Systems Engineer</option>
              </select>
            </div>

            {/* Question Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Question Type
              </label>
              <div className="flex gap-2">
                {["behavioral", "technical", "hybrid"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setQuestionType(type)}
                    className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      questionType === type
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                        : "bg-white/60 text-gray-700 hover:bg-white/80"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Question Difficulty
              </label>
              <Slider.Root
                value={questionDifficulty}
                onValueChange={setQuestionDifficulty}
                max={100}
                step={1}
                className="relative flex items-center w-full h-5"
              >
                <Slider.Track className="relative h-2 flex-grow bg-white/60 rounded-full">
                  <Slider.Range className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-5 h-5 bg-white shadow-lg rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </Slider.Root>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Easy</span>
                <span>Medium</span>
                <span>Hard</span>
              </div>
            </div>

            {/* Interviewer Strictness */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interviewer Strictness
              </label>
              <Slider.Root
                value={interviewerStrictness}
                onValueChange={setInterviewerStrictness}
                max={100}
                step={1}
                className="relative flex items-center w-full h-5"
              >
                <Slider.Track className="relative h-2 flex-grow bg-white/60 rounded-full">
                  <Slider.Range className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-5 h-5 bg-white shadow-lg rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </Slider.Root>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Relaxed</span>
                <span>Standard</span>
                <span>Strict</span>
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Experience Level
              </label>
              <Slider.Root
                value={experienceLevel}
                onValueChange={setExperienceLevel}
                max={3}
                step={1}
                className="relative flex items-center w-full h-5"
              >
                <Slider.Track className="relative h-2 flex-grow bg-white/60 rounded-full">
                  <Slider.Range className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-5 h-5 bg-white shadow-lg rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </Slider.Root>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                {experienceLevels.map((level) => (
                  <span key={level}>{level}</span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Panel - Interviewer Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="backdrop-blur-lg bg-white/40 rounded-2xl p-8 border border-white/50 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Your Interviewer
              </h3>

              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${interviewerAvatars[selectedInterviewer]!.color} flex items-center justify-center shadow-lg`}>
                  <span className="text-4xl font-bold text-white">
                    {interviewerAvatars[selectedInterviewer]!.name[0]}
                  </span>
                </div>
              </div>

              <h4 className="text-2xl font-bold text-center text-gray-900 mb-6">
                {interviewerAvatars[selectedInterviewer]!.name}
              </h4>

              {/* Interviewer Selection */}
              <div className="flex justify-center gap-3 mb-8">
                {interviewerAvatars.map((avatar, index) => (
                  <button
                    key={avatar.name}
                    onClick={() => setSelectedInterviewer(index)}
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatar.color} transition-all ${
                      selectedInterviewer === index
                        ? "ring-4 ring-blue-500 scale-110"
                        : "opacity-50 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>

              {/* Tabs */}
              <Tabs.Root defaultValue="role" className="w-full">
                <Tabs.List className="flex gap-2 mb-4">
                  {["role", "qd", "id"].map((tab) => (
                    <Tabs.Trigger
                      key={tab}
                      value={tab}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white/80 data-[state=active]:shadow-md data-[state=inactive]:text-gray-600 hover:bg-white/60"
                    >
                      {tab === "role" ? "Role" : tab === "qd" ? "QD" : "ID"}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>

                <Tabs.Content value="role" className="text-sm text-gray-700">
                  <p className="mb-2 font-medium">{role.charAt(0).toUpperCase() + role.slice(1)} Engineer</p>
                  <p className="text-gray-600">Specialized in this role's common interview questions and scenarios.</p>
                </Tabs.Content>

                <Tabs.Content value="qd" className="text-sm text-gray-700">
                  <p className="mb-2 font-medium">Question Difficulty: {questionDifficulty[0]}%</p>
                  <p className="text-gray-600">Questions will be tailored to this difficulty level.</p>
                </Tabs.Content>

                <Tabs.Content value="id" className="text-sm text-gray-700">
                  <p className="mb-2 font-medium">Interviewer Strictness: {interviewerStrictness[0]}%</p>
                  <p className="text-gray-600">The interviewer will adjust their feedback style accordingly.</p>
                </Tabs.Content>
              </Tabs.Root>
            </div>

            {/* Start Interview Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const isTechnical = questionType === "technical" || questionType === "hybrid";
                const route = isTechnical ? "/technical-interview" : "/interview/voice";
                navigate(route, {
                  state: {
                    role,
                    questionType,
                    difficulty: questionDifficulty[0],
                    strictness: interviewerStrictness[0],
                    experienceLevel: experienceLevel[0],
                    interviewer: interviewerAvatars[selectedInterviewer]!.name,
                  },
                });
              }}
              className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Start Interview
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
