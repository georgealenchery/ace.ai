type VoicePlayerProps = {
  text: string;
};

export function VoicePlayer({ text }: VoicePlayerProps) {
  function play() {
    console.log("playing voice:", text);
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <button onClick={play} className="text-sm text-blue-600 hover:underline">
        ▶ Play
      </button>
      <span className="text-xs text-gray-400 truncate">{text}</span>
    </div>
  );
}
