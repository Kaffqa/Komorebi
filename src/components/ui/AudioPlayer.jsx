import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

export function AudioPlayer({ src }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const progressRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setLoaded(true);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const togglePlay = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;

    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    audio.currentTime = pct * duration;
  };

  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Generate decorative waveform bars (seeded pseudo-random for consistency)
  const bars = Array.from({ length: 32 }, (_, i) => {
    const h = 20 + Math.sin(i * 0.7) * 30 + Math.cos(i * 1.3) * 20 + ((i * 7 + 13) % 17);
    return Math.max(15, Math.min(80, h));
  });

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="max-w-md w-full rounded-2xl border border-[#B5CCBD]/40 dark:border-[#43674F]/60 bg-gradient-to-r from-[#F0F7F2] to-[#E8F1EA] dark:from-[#1A2B20] dark:to-[#1E3228] p-4 flex items-center gap-4 transition-colors duration-300"
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 shadow-sm bg-[#5D8B66] text-white hover:bg-[#4A7A55]"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 pointer-events-none" />
        ) : (
          <Play className="w-5 h-5 ml-0.5 pointer-events-none" />
        )}
      </button>

      {/* Waveform & Progress */}
      <div className="flex-1 flex flex-col gap-1.5">
        {/* Waveform Bars */}
        <div
          ref={progressRef}
          onClick={handleSeek}
          className="relative flex items-end gap-[2px] h-10 cursor-pointer"
        >
          {bars.map((h, i) => {
            const barPosition = (i / bars.length) * 100;
            const isActive = barPosition <= progress;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors duration-150 min-w-[2px] ${
                  isActive
                    ? "bg-[#5D8B66] dark:bg-[#7DA085]"
                    : "bg-[#C5D8CA] dark:bg-[#3A5244]"
                }`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>

        {/* Time */}
        <div className="flex justify-between text-[11px] font-sans font-medium text-gray-500 dark:text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
