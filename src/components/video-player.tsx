import { useEffect, useRef, useState } from "react";
import { formatClock } from "@/services/courseNormalizer";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export type PlayerHandle = { currentTime: () => number };

/**
 * Our own player for direct video files: play/pause, seek, volume, speed,
 * picture-in-picture, fullscreen and resume from the saved position.
 */
export function VideoPlayer({
  src,
  poster,
  startAt,
  onProgress,
  onEnded,
  onHandle,
}: {
  src: string;
  poster?: string | null | undefined;
  startAt?: number;
  onProgress?: (seconds: number, duration: number) => void;
  onEnded?: (duration: number) => void;
  onHandle?: (handle: PlayerHandle) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const seeded = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onHandle?.({ currentTime: () => videoRef.current?.currentTime ?? 0 });
  }, [onHandle]);

  useEffect(() => {
    seeded.current = false;
    setFailed(false);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const interval = window.setInterval(() => {
      if (!video.paused && video.duration > 0) onProgress?.(video.currentTime, video.duration);
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [onProgress]);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }

  if (failed) {
    return (
      <div className="grid aspect-video w-full place-items-center bg-black px-6 text-center">
        <div>
          <p className="font-display text-lg text-paper">Video could not be played</p>
          <p className="mt-1.5 text-[12px] text-paper/60">
            The published video file did not load. Try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative aspect-video w-full bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        playsInline
        preload="metadata"
        className="size-full"
        onClick={toggle}
        onError={() => setFailed(true)}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          setDuration(video.duration || 0);
          if (!seeded.current && startAt && startAt > 2 && startAt < video.duration - 5) {
            video.currentTime = startAt;
          }
          seeded.current = true;
        }}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={(event) => {
          setPlaying(false);
          onProgress?.(event.currentTarget.currentTime, event.currentTarget.duration || 0);
        }}
        onEnded={(event) => onEnded?.(event.currentTarget.duration || 0)}
      />

      <div className="absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2.5 pt-6">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={1}
          value={time}
          aria-label="Seek"
          onChange={(event) => {
            const next = Number(event.target.value);
            setTime(next);
            if (videoRef.current) videoRef.current.currentTime = next;
          }}
          className="h-1.5 w-full accent-lamp"
        />
        <div className="flex items-center gap-2 text-paper">
          <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="press text-[13px] font-semibold">
            {playing ? "❚❚" : "▶"}
          </button>
          <span className="text-[11px] tabular-nums text-paper/80">
            {formatClock(time)} / {formatClock(duration)}
          </span>
          <span className="flex-1" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            aria-label="Volume"
            onChange={(event) => {
              const next = Number(event.target.value);
              setVolume(next);
              if (videoRef.current) videoRef.current.volume = next;
            }}
            className="h-1.5 w-16 accent-lamp"
          />
          <button
            type="button"
            onClick={() => {
              const index = SPEEDS.indexOf(speed);
              const next = SPEEDS[(index + 1) % SPEEDS.length]!;
              setSpeed(next);
              if (videoRef.current) videoRef.current.playbackRate = next;
            }}
            className="press rounded-lg bg-paper/15 px-2 py-1 text-[11px] font-semibold"
          >
            {speed}x
          </button>
          <button
            type="button"
            aria-label="Picture in picture"
            onClick={async () => {
              try {
                const video = videoRef.current;
                if (!video) return;
                if (document.pictureInPictureElement) await document.exitPictureInPicture();
                else await video.requestPictureInPicture();
              } catch {
                /* not supported on this device */
              }
            }}
            className="press rounded-lg bg-paper/15 px-2 py-1 text-[11px] font-semibold"
          >
            PiP
          </button>
          <button
            type="button"
            aria-label="Fullscreen"
            onClick={async () => {
              try {
                if (document.fullscreenElement) await document.exitFullscreen();
                else await wrapRef.current?.requestFullscreen();
              } catch {
                /* ignore */
              }
            }}
            className="press rounded-lg bg-paper/15 px-2 py-1 text-[11px] font-semibold"
          >
            ⛶
          </button>
        </div>
      </div>
    </div>
  );
}
