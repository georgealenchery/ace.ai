import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Check, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { DashboardNavbar } from "./DashboardNavbar";

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
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-blue-100" />

      {/* Navbar */}
      <DashboardNavbar
        userName="Lorenna"
        userInitials="LK"
        activeTab="Dashboard"
      />

      {/* Hero Content */}
      <section className="relative px-6 pt-8 pb-14 md:px-8 md:pt-10">
        <div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Side */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h1 className="text-5xl font-extrabold leading-[0.95] tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
                Practice{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Real
                </span>
                <br />
                Interviews.
              </h1>

              <h2 className="text-5xl font-extrabold leading-[0.95] tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
                Not Just Questions.
              </h2>
            </div>

            <p className="max-w-xl text-lg leading-relaxed text-gray-600 md:text-xl">
              AI voice interviewers that challenge you with real follow-ups,
              realistic pressure, and personalized feedback — so you're actually
              ready.
            </p>

            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/roles")}
                className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-4 font-semibold text-white shadow-md transition-all hover:shadow-lg"
              >
                Start Interview
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-2xl border border-white/60 bg-white/50 px-8 py-4 font-semibold text-gray-900 shadow-sm backdrop-blur-md transition-all hover:shadow-md"
              >
                Watch Demo
              </motion.button>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                <span className="text-gray-700">
                  Used by students preparing for FAANG interviews
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                <span className="text-gray-700">
                  5-minute mock interviews with instant feedback
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                <span className="text-gray-700">No signup required</span>
              </div>
            </div>
          </motion.div>

          {/* Right Side */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex justify-center lg:justify-end lg:pt-2"
          >
            <div className="w-full max-w-xl">
              <div className="rounded-3xl border border-white/70 bg-white/60 p-6 shadow-lg backdrop-blur-xl md:p-7">
                {/* Title and Timer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">Technical Interview</span>
                  </div>

                  <motion.div
                    className="rounded-xl bg-red-500 px-3 py-1.5 font-mono text-sm font-semibold text-white"
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {formatTime(timerSeconds)}
                  </motion.div>
                </motion.div>

                {/* Interviewer */}
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
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xl font-bold text-white"
                      >
                        C
                      </motion.div>
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
                    </div>

                    <div>
                      <div className="font-semibold text-gray-900">Cassidy</div>
                      <div className="text-sm text-gray-500">
                        Senior Interviewer
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Chat */}
                <div className="mb-6 space-y-3">
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 backdrop-blur-sm"
                    >
                      <div className="mb-1.5 text-xs font-semibold text-blue-600">
                        AI
                      </div>
                      <p className="text-sm leading-relaxed text-gray-800">
                        Tell me about a time you had to debug a complex issue
                      </p>
                    </motion.div>

                    {showTranscript && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-2xl border border-purple-100 bg-purple-50/70 p-4 backdrop-blur-sm"
                      >
                        <div className="mb-1.5 text-xs font-semibold text-purple-600">
                          YOU
                        </div>
                        <p className="text-sm leading-relaxed text-gray-800">
                          {typingText}
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="ml-0.5 inline-block h-4 w-0.5 bg-purple-600"
                          />
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Waveform */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="flex h-14 items-center justify-center gap-1 rounded-2xl bg-gray-50/50"
                >
                  {[...Array(24)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: ["8px", `${Math.random() * 30 + 12}px`, "8px"],
                      }}
                      transition={{
                        duration: 0.6 + Math.random() * 0.4,
                        repeat: Infinity,
                        delay: i * 0.04,
                      }}
                      className="w-1 rounded-full bg-gradient-to-t from-blue-400 to-purple-500"
                    />
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}


