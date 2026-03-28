import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Check, Clock } from "lucide-react";
import { useState, useEffect } from "react";
const logo = "assets/finallogoace.png";

export function HeroPage() {
  const navigate = useNavigate();
  const [typingText, setTypingText] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(121);

  const fullText = "I was working on a distributed system where…";

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTranscript(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showTranscript) return;

    if (typingText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setTypingText(fullText.slice(0, typingText.length + 1));
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [typingText, showTranscript]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Clean, Soft Gradient Background: Light Purple to Light Blue */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-blue-100" />

      {/* Navbar */}
      <nav className="relative z-20 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo - Top Left */}
          <img src="/finallogoace.png" alt="ACE.AI" className="h-10" />

          {/* Primary CTA - Top Right */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/roles")}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-semibold shadow-sm hover:shadow-md transition-all"
          >
            Start Interview
          </motion.button>
        </div>
      </nav>

      {/* Hero Content - Two Column Layout */}
      <div className="relative px-8 py-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Large Headline with Strong Hierarchy */}
            <div className="space-y-2">
              <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
                Practice{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Real
                </span>{" "}
                Interviews.
              </h1>
              <h2 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
                Not Just Questions.
              </h2>
            </div>

            {/* Subheadline */}
            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              AI voice interviewers that challenge you with real follow-ups, realistic pressure, and personalized feedback — so you're actually ready.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/roles")}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Start Interview
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 backdrop-blur-md bg-white/50 border border-white/60 text-gray-900 rounded-2xl font-semibold shadow-sm hover:shadow-md transition-all"
              >
                Watch Demo
              </motion.button>
            </div>

            {/* 3 Bullet Points */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">Used by students preparing for FAANG interviews</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">5-minute mock interviews with instant feedback</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">No signup required</span>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Mock Interview UI Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="w-full max-w-md">
              {/* Glassmorphic Card with Subtle Depth */}
              <div className="backdrop-blur-xl bg-white/60 border border-white/70 rounded-3xl p-6 shadow-lg">
                {/* Title and Timer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between mb-6"
                >
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">Technical Interview</span>
                  </div>
                  <motion.div
                    className="px-3 py-1.5 bg-red-500 text-white rounded-xl font-mono text-sm font-semibold"
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {formatTime(timerSeconds)}
                  </motion.div>
                </motion.div>

                {/* Interviewer Avatar */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mb-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <motion.div
                        animate={{
                          boxShadow: [
                            "0 0 0 0 rgba(59, 130, 246, 0.5)",
                            "0 0 0 8px rgba(59, 130, 246, 0)",
                          ],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold"
                      >
                        C
                      </motion.div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Cassidy</div>
                      <div className="text-sm text-gray-500">Senior Interviewer</div>
                    </div>
                  </div>
                </motion.div>

                {/* Chat-Style Interaction */}
                <div className="space-y-3 mb-6">
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="backdrop-blur-sm bg-blue-50/70 rounded-2xl p-4 border border-blue-100"
                    >
                      <div className="text-xs font-semibold text-blue-600 mb-1.5">AI</div>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        Tell me about a time you had to debug a complex issue
                      </p>
                    </motion.div>

                    {showTranscript && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="backdrop-blur-sm bg-purple-50/70 rounded-2xl p-4 border border-purple-100"
                      >
                        <div className="text-xs font-semibold text-purple-600 mb-1.5">YOU</div>
                        <p className="text-sm text-gray-800 leading-relaxed">
                          {typingText}
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="inline-block w-0.5 h-4 bg-purple-600 ml-0.5"
                          />
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Waveform Visualization */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="flex items-center gap-1 h-14 justify-center bg-gray-50/50 rounded-2xl"
                >
                  {[...Array(24)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: ["8px", `${Math.random() * 36 + 12}px`, "8px"],
                      }}
                      transition={{
                        duration: 0.6 + Math.random() * 0.4,
                        repeat: Infinity,
                        delay: i * 0.04,
                      }}
                      className="w-1 bg-gradient-to-t from-blue-400 to-purple-500 rounded-full"
                    />
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
