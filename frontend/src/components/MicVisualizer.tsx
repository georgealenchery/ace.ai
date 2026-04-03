import { motion } from "motion/react";

interface MicVisualizerProps {
  volumeLevel: number;
  isListening: boolean;
  isSpeaking: boolean;
}

export function MicVisualizer({ volumeLevel, isListening, isSpeaking }: MicVisualizerProps) {
  const isActive = isListening || isSpeaking;

  // Ring colors
  const ringColor = isSpeaking
    ? "rgba(168, 85, 247," // purple
    : isListening
      ? "rgba(34, 197, 94," // green
      : "rgba(75, 85, 99,"; // gray

  // Scale each ring by volume when listening, use slow pulse when speaking, static when idle
  const rings = [0.55, 0.72, 0.9];

  const label = isSpeaking
    ? "AI Speaking..."
    : isListening
      ? "Listening..."
      : "Idle";

  const labelColor = isSpeaking
    ? "text-purple-400"
    : isListening
      ? "text-green-400"
      : "text-gray-500";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-12 h-12 flex items-center justify-center">
        {rings.map((baseScale, i) => {
          const volumeBoost = isListening ? volumeLevel * 0.4 : 0;
          const scale = baseScale + volumeBoost;
          const opacity = isActive
            ? 0.15 + (1 - baseScale) * 0.6 + (isListening ? volumeLevel * 0.4 : 0)
            : 0.12;

          return (
            <motion.div
              key={i}
              className="absolute rounded-full border"
              style={{
                width: 48,
                height: 48,
                borderColor: `${ringColor}${Math.min(opacity, 0.9)})`,
                backgroundColor: `${ringColor}${Math.min(opacity * 0.3, 0.25)})`,
              }}
              animate={
                isSpeaking
                  ? { scale: [baseScale, baseScale + 0.08, baseScale], opacity: [opacity, opacity * 1.3, opacity] }
                  : isListening && volumeLevel > 0.02
                    ? { scale: [scale, scale + 0.04, scale] }
                    : { scale: baseScale }
              }
              transition={
                isSpeaking
                  ? { duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }
                  : isListening && volumeLevel > 0.02
                    ? { duration: 0.3, repeat: Infinity, ease: "easeOut" }
                    : { duration: 0.2 }
              }
            />
          );
        })}

        {/* Center dot */}
        <div
          className="w-3 h-3 rounded-full z-10 transition-colors duration-300"
          style={{ backgroundColor: `${ringColor}0.9)` }}
        />
      </div>

      <span className={`text-[9px] font-medium tracking-wide ${labelColor} transition-colors duration-300`}>
        {label}
      </span>
    </div>
  );
}
