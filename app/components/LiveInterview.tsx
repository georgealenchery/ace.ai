import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Mic, MicOff, RotateCcw, X } from "lucide-react";

export function LiveInterview() {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [time, setTime] = useState(0);
  const [transcript, setTranscript] = useState([
    { speaker: "AI", text: "Hello! I'm excited to interview you today for the Backend Engineer position. Let's start with a simple question: Can you tell me about your experience with database design and optimization?" },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Simulate AI speaking animation
    const interval = setInterval(() => {
      setIsAISpeaking((prev) => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndInterview = () => {
    navigate("/analytics");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Backend Engineer Interview</h1>
            <p className="text-gray-400">Technical Assessment</p>
          </div>
          <div className="text-3xl font-mono">{formatTime(time)}</div>
        </div>

        {/* Main Interview Area */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Left - Interviewer */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-lg bg-white/5 rounded-2xl p-8 border border-white/10 shadow-xl"
          >
            <h3 className="text-sm font-medium text-gray-400 mb-4">Interviewer</h3>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <motion.div
                  animate={{
                    scale: isAISpeaking ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ duration: 0.5 }}
                  className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center relative"
                >
                  <span className="text-6xl font-bold text-white">C</span>
                  {isAISpeaking && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-purple-400"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              </div>
              <h4 className="text-xl font-bold">Cassidy</h4>
              <p className="text-sm text-gray-400">Senior Technical Interviewer</p>
            </div>
          </motion.div>

          {/* Right - User */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-lg bg-white/5 rounded-2xl p-8 border border-white/10 shadow-xl"
          >
            <h3 className="text-sm font-medium text-gray-400 mb-4">You</h3>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                  <Mic className="w-16 h-16 text-white" />
                </div>
              </div>
              <div className="w-full h-20 bg-gray-800/50 rounded-xl flex items-center justify-center">
                {isUserSpeaking ? (
                  <motion.div className="flex gap-1">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-cyan-400 rounded-full"
                        animate={{
                          height: [10, Math.random() * 40 + 20, 10],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.05,
                        }}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <p className="text-gray-500">Speak to respond...</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Transcript Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-lg bg-white/5 rounded-2xl p-6 border border-white/10 shadow-xl mb-6"
        >
          <h3 className="text-sm font-medium text-gray-400 mb-4">Live Transcript</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {transcript.map((entry, index) => (
              <div key={index} className="flex gap-3">
                <span className={`font-semibold ${entry.speaker === "AI" ? "text-purple-400" : "text-cyan-400"}`}>
                  {entry.speaker}:
                </span>
                <p className="text-gray-300">{entry.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full ${
              isMuted ? "bg-red-500" : "bg-white/10"
            } backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all"
          >
            <RotateCcw className="w-6 h-6" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEndInterview}
            className="px-6 py-4 rounded-full bg-red-500/20 backdrop-blur-lg border border-red-500/50 hover:bg-red-500/30 transition-all flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            <span>End Interview</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
