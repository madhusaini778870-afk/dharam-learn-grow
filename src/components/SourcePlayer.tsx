import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Hls from "hls.js";
import dashjs from "dashjs";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Loader2,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Tv,
  Radio,
  ExternalLink,
  ShieldCheck,
  Zap,
  Clock,
  AlertCircle,
  VideoOff,
  ShieldAlert,
} from "lucide-react";
import { InPlayerChat } from "@/components/InPlayerChat";
import {
  buildAuthorizedPlayerUrl,
  isPlayableMediaUrl,
  isYouTubeUrl,
  extractYouTubeId,
} from "@/services/courseNormalizer";

export type PlaybackMode = "embed" | "direct";

export const VERIFIED_TIME_POINTS = [
  { label: "00:15", time: 15, title: "Intro & Overview" },
  { label: "02:30", time: 150, title: "Core Theory & Concept" },
  { label: "05:00", time: 300, title: "Examples & Practice" },
];

export type SourcePlayerProps = {
  videoUrl: string | null;
  videoType?: "hls" | "dash" | "direct" | "youtube" | "embed" | "unavailable";
  playerEmbedUrl?: string | null;
  studyRatnaUrl?: string | null;
  pwMarcoUrl?: string | null;
  pwMarcoPlayerUrl?: string | null;
  title: string;
  teacherName?: string | null;
  batchTitle?: string | null;
  posterUrl?: string | null;
  initialPosition?: number;
  seekTarget?: number | null;
  batchId?: string | null;
  subjectId?: string | null;
  scheduleId?: string | null;
  mp4Recordings?: Array<{ quality: string; url: string; size?: number }>;
  isLoadingSource?: boolean;
  onTimeUpdate?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
};

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

function formatTime(sec: number): string {
  if (isNaN(sec) || sec < 0) return "00:00";
  const total = Math.floor(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

function toProxiedHlsUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("/api/public/hls") ||
    trimmed.includes("vidya-verse.ai.studio/api/public/hls")
  ) {
    return trimmed;
  }
  if (trimmed.includes(".m3u8")) {
    return `/api/public/hls?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}

export function SourcePlayer({
  videoUrl,
  videoType = "embed",
  playerEmbedUrl,
  title,
  teacherName,
  batchTitle,
  posterUrl,
  initialPosition = 0,
  seekTarget = null,
  batchId,
  subjectId,
  scheduleId,
  mp4Recordings,
  isLoadingSource = false,
  onTimeUpdate,
  onEnded,
}: SourcePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dashPlayerRef = useRef<any>(null);

  const isDirectCapable = useMemo(() => {
    if (
      videoUrl &&
      (isPlayableMediaUrl(videoUrl) ||
        videoUrl.includes(".m3u8") ||
        videoUrl.includes(".mp4") ||
        videoUrl.includes(".webm"))
    ) {
      return true;
    }
    if (mp4Recordings && mp4Recordings.length > 0) {
      return true;
    }
    return false;
  }, [videoUrl, mp4Recordings]);

  // Derive this lecture's strictly authorized player embed URL
  const resolvedEmbedUrl = useMemo(() => {
    if (isDirectCapable) return null;
    if (
      playerEmbedUrl &&
      (playerEmbedUrl.includes(".m3u8") ||
        playerEmbedUrl.includes(".mp4") ||
        playerEmbedUrl.includes(".webm"))
    ) {
      return null;
    }
    if (playerEmbedUrl && playerEmbedUrl.startsWith("http")) {
      return playerEmbedUrl;
    }
    if (videoUrl && isYouTubeUrl(videoUrl)) {
      const ytId = extractYouTubeId(videoUrl);
      if (ytId) return `https://www.youtube.com/embed/${ytId}`;
      return videoUrl;
    }
    const lectureVid = scheduleId || (videoUrl && !videoUrl.startsWith("http") ? videoUrl : null);
    if (lectureVid && !isDirectCapable) {
      return buildAuthorizedPlayerUrl({
        videoId: lectureVid,
        title,
        batchId,
        subjectId,
      });
    }
    return null;
  }, [playerEmbedUrl, scheduleId, videoUrl, title, batchId, subjectId, isDirectCapable]);

  // Derive direct stream URL if one exists for this lecture
  const resolvedDirectUrl = useMemo(() => {
    if (
      videoUrl &&
      (isPlayableMediaUrl(videoUrl) ||
        videoUrl.includes(".m3u8") ||
        videoUrl.includes(".mp4") ||
        videoUrl.includes(".webm"))
    ) {
      return videoUrl;
    }
    if (mp4Recordings && mp4Recordings.length > 0 && mp4Recordings[0]?.url) {
      return mp4Recordings[0].url;
    }
    return null;
  }, [videoUrl, mp4Recordings]);

  // Playback mode: always direct for streamable media, embed only for genuine web players
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(() => {
    if (isDirectCapable) return "direct";
    return resolvedEmbedUrl ? "embed" : "direct";
  });

  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if lecture has any valid playable source
  const hasPlayableSource = Boolean(resolvedEmbedUrl || resolvedDirectUrl);

  const triggerControls = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  }, []);

  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

  const startLoadTimeout = useCallback(() => {
    clearLoadTimeout();
    loadTimeoutRef.current = setTimeout(() => {
      clearLoadTimeout();
      setIsLoading(false);
      // If direct stream timed out, fallback to highest quality MP4 if available
      if (mp4Recordings && mp4Recordings.length > 0 && !customStreamUrl) {
        const fallbackMp4 = mp4Recordings[0].url;
        setSelectedQuality(mp4Recordings[0].quality);
        setCustomStreamUrl(fallbackMp4);
        setRetryKey((k) => k + 1);
        return;
      }
      // Only fallback to embed if resolvedEmbedUrl is genuine and not an m3u8/mp4 link
      if (
        playbackMode === "direct" &&
        resolvedEmbedUrl &&
        !resolvedEmbedUrl.includes(".m3u8") &&
        !resolvedEmbedUrl.includes(".mp4")
      ) {
        setPlaybackMode("embed");
        setPlaybackError(null);
      } else {
        setPlaybackError("Video stream load hone me samay lag raha hai. Kripya Retry dabayein.");
      }
    }, 15000);
  }, [clearLoadTimeout, customStreamUrl, mp4Recordings, playbackMode, resolvedEmbedUrl]);

  // Teardown and reset completely whenever changing lectures (scheduleId)
  useEffect(() => {
    clearLoadTimeout();
    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
        v.removeAttribute("src");
        v.load();
      } catch {
        // ignore
      }
    }
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {
        // ignore
      }
      hlsRef.current = null;
    }
    if (dashPlayerRef.current) {
      try {
        dashPlayerRef.current.reset();
      } catch {
        // ignore
      }
      dashPlayerRef.current = null;
    }

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackError(null);
    setIsCompleted(false);

    // Prefer direct stream mode whenever media is streamable
    if (isDirectCapable || resolvedDirectUrl) {
      setPlaybackMode("direct");
    } else if (resolvedEmbedUrl) {
      setPlaybackMode("embed");
    } else {
      setPlaybackMode("direct");
    }
  }, [scheduleId, resolvedDirectUrl, isDirectCapable, resolvedEmbedUrl, clearLoadTimeout]);

  const [selectedQuality, setSelectedQuality] = useState<string>("auto");
  const [customStreamUrl, setCustomStreamUrl] = useState<string | null>(null);

  const activePlayUrl = useMemo(() => {
    if (customStreamUrl) return customStreamUrl;
    return resolvedDirectUrl;
  }, [customStreamUrl, resolvedDirectUrl]);

  const handleQualityChange = useCallback(
    (quality: string, url?: string) => {
      setSelectedQuality(quality);
      const pos = videoRef.current?.currentTime || currentTime;
      if (quality === "auto" || !url) {
        setCustomStreamUrl(null);
      } else {
        setCustomStreamUrl(url);
      }
      setRetryKey((k) => k + 1);
      setTimeout(() => {
        if (videoRef.current && pos > 0) {
          videoRef.current.currentTime = pos;
          if (isPlaying) videoRef.current.play().catch(() => {});
        }
      }, 100);
    },
    [currentTime, isPlaying],
  );

  // Direct video engine mounting
  useEffect(() => {
    if (playbackMode !== "direct" || !activePlayUrl) return;

    const video = videoRef.current;
    if (!video) return;

    let isSubscribed = true;
    setIsLoading(true);
    setPlaybackError(null);
    startLoadTimeout();

    const lower = activePlayUrl.toLowerCase();
    const isMpd = lower.includes(".mpd");
    const isM3u8 = lower.includes(".m3u8");

    const onDirectReady = () => {
      clearLoadTimeout();
      setIsLoading(false);
      setPlaybackError(null);
    };

    video.addEventListener("canplay", onDirectReady);
    video.addEventListener("loadeddata", onDirectReady);
    video.addEventListener("playing", onDirectReady);

    if (isM3u8 && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hlsRef.current = hls;

      const proxiedHls = toProxiedHlsUrl(activePlayUrl);
      hls.loadSource(proxiedHls);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!isSubscribed) return;
        clearLoadTimeout();
        setIsLoading(false);
        if (initialPosition > 0) {
          video.currentTime = initialPosition;
        }
      });

      let hasTriedRemoteVvFallback = false;
      let hasTriedDirectFallback = false;

      hls.on(Hls.Events.FRAG_LOADED, () => {
        if (!isSubscribed) return;
        clearLoadTimeout();
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!isSubscribed) return;
        if (data.fatal) {
          clearLoadTimeout();
          // 1. If local /api/public/hls failed, try direct remote proxy https://vidya-verse.ai.studio/api/public/hls
          if (!hasTriedRemoteVvFallback && activePlayUrl.includes(".m3u8")) {
            hasTriedRemoteVvFallback = true;
            const remoteProxyUrl = `https://vidya-verse.ai.studio/api/public/hls?url=${encodeURIComponent(activePlayUrl)}`;
            hls.loadSource(remoteProxyUrl);
            return;
          }
          // 2. Try direct activePlayUrl (supported by Cloudflare CORS)
          if (!hasTriedDirectFallback && activePlayUrl.includes(".m3u8")) {
            hasTriedDirectFallback = true;
            hls.loadSource(activePlayUrl);
            return;
          }
          // 3. Fallback to highest quality MP4 if available
          if (mp4Recordings && mp4Recordings.length > 0 && !customStreamUrl) {
            const fallbackMp4 = mp4Recordings[0].url;
            setSelectedQuality(mp4Recordings[0].quality);
            setCustomStreamUrl(fallbackMp4);
            setRetryKey((k) => k + 1);
            return;
          }
          // 4. Fallback to embed only if genuine web player
          if (
            resolvedEmbedUrl &&
            !resolvedEmbedUrl.includes(".m3u8") &&
            !resolvedEmbedUrl.includes(".mp4")
          ) {
            setPlaybackMode("embed");
          } else {
            setPlaybackError("Video stream could not be loaded. Please click Retry below.");
          }
        }
      });
    } else if (isM3u8 && video.canPlayType("application/vnd.apple.mpegurl")) {
      const proxiedHls = toProxiedHlsUrl(activePlayUrl);
      video.src = proxiedHls;
      if (initialPosition > 0) {
        video.currentTime = initialPosition;
      }
    } else if (isMpd) {
      try {
        const dash = dashjs.MediaPlayer().create();
        dashPlayerRef.current = dash;
        dash.initialize(video, activePlayUrl, false);
        dash.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
          if (!isSubscribed) return;
          clearLoadTimeout();
          setIsLoading(false);
          if (initialPosition > 0) {
            video.currentTime = initialPosition;
          }
        });
        dash.on(dashjs.MediaPlayer.events.ERROR, () => {
          if (!isSubscribed) return;
          clearLoadTimeout();
          if (resolvedEmbedUrl) {
            setPlaybackMode("embed");
          } else {
            setPlaybackError("Video unavailable");
          }
        });
      } catch {
        if (resolvedEmbedUrl) {
          setPlaybackMode("embed");
        } else {
          setPlaybackError("Video unavailable");
        }
      }
    } else {
      video.src = activePlayUrl || resolvedDirectUrl || "";
      if (initialPosition > 0) {
        video.currentTime = initialPosition;
      }
    }

    return () => {
      isSubscribed = false;
      clearLoadTimeout();
      video.removeEventListener("canplay", onDirectReady);
      video.removeEventListener("loadeddata", onDirectReady);
      video.removeEventListener("playing", onDirectReady);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (dashPlayerRef.current) {
        try {
          dashPlayerRef.current.reset();
        } catch {
          // ignore
        }
        dashPlayerRef.current = null;
      }
    };
  }, [
    playbackMode,
    activePlayUrl,
    initialPosition,
    retryKey,
    resolvedEmbedUrl,
    mp4Recordings,
    customStreamUrl,
    startLoadTimeout,
    clearLoadTimeout,
  ]);

  // Handle external seek targets
  useEffect(() => {
    if (seekTarget !== null && videoRef.current && playbackMode === "direct") {
      videoRef.current.currentTime = seekTarget;
      setCurrentTime(seekTarget);
      videoRef.current.play().catch(() => {});
    }
  }, [seekTarget, playbackMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowLeft" || e.key === "j") {
        e.preventDefault();
        handleSeekRelative(-10);
      } else if (e.key === "ArrowRight" || e.key === "l") {
        e.preventDefault();
        handleSeekRelative(10);
      } else if (e.key === "m") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "f") {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const onTimeUpdateHandler = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    onTimeUpdate?.(v.currentTime, v.duration || 0);

    if (v.buffered.length > 0 && v.duration > 0) {
      const bufferedEnd = v.buffered.end(v.buffered.length - 1);
      setBufferedPercent(Math.min(100, (bufferedEnd / v.duration) * 100));
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    setPlaybackError(null);
    if (v.paused) {
      v.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          v.muted = true;
          setIsMuted(true);
          v.play()
            .then(() => setIsPlaying(true))
            .catch(() => setPlaybackError("Video load nahi ho pa raha. Retry karein."));
        });
    } else {
      v.pause();
      setIsPlaying(false);
    }
    triggerControls();
  };

  const handleSeekRelative = (seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    const target = Math.max(0, Math.min(v.duration || 0, v.currentTime + seconds));
    v.currentTime = target;
    setCurrentTime(target);
    triggerControls();
  };

  const handleScrubberChange = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = val;
    setCurrentTime(val);
    triggerControls();
  };

  const handleVolumeChange = (newVol: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
    triggerControls();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isMuted) {
      v.volume = volume || 1;
      setIsMuted(false);
    } else {
      v.volume = 0;
      setIsMuted(true);
    }
    triggerControls();
  };

  const handleSpeedChange = (newSpeed: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = newSpeed;
    setSpeed(newSpeed);
    triggerControls();
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleRetry = () => {
    setPlaybackError(null);
    setIsLoading(true);
    setRetryKey((k) => k + 1);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={triggerControls}
      onTouchStart={triggerControls}
      className={`group relative select-none overflow-hidden bg-black text-white shadow-2xl transition-all ${
        isTheater ? "w-full max-w-none rounded-none" : "w-full rounded-2xl ring-1 ring-border"
      }`}
      style={{ aspectRatio: "16/9" }}
    >
      {/* 1. Video Engine */}
      {playbackMode === "embed" && resolvedEmbedUrl ? (
        /* Authorized Web Player Engine (Iframe with full DRM & Key support) */
        <div className="relative h-full w-full bg-neutral-950">
          <iframe
            key={`embed-player-${scheduleId}-${retryKey}`}
            src={resolvedEmbedUrl}
            title={title}
            onLoad={() => {
              clearLoadTimeout();
              setIsLoading(false);
            }}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          {isLoading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xs">
              <div className="flex size-12 items-center justify-center rounded-full bg-black/80 text-white shadow-xl ring-1 ring-white/10">
                <Loader2 className="size-6 animate-spin text-amber-500" />
              </div>
              <p className="mt-2 text-xs font-semibold text-white/90">Loading lecture video...</p>
            </div>
          )}
        </div>
      ) : playbackMode === "direct" && (activePlayUrl || resolvedDirectUrl) ? (
        /* Native Stream Engine (HLS / DASH / MP4) */
        <div className="relative h-full w-full bg-black">
          <video
            ref={videoRef}
            poster={posterUrl || undefined}
            onTimeUpdate={onTimeUpdateHandler}
            onLoadedMetadata={() => {
              if (videoRef.current) setDuration(videoRef.current.duration || 0);
              setIsLoading(false);
            }}
            onPlay={() => {
              setIsPlaying(true);
              setIsLoading(false);
              triggerControls();
            }}
            onPause={() => {
              setIsPlaying(false);
              setShowControls(true);
            }}
            onEnded={() => {
              setIsPlaying(false);
              setIsCompleted(true);
              onEnded?.();
            }}
            onClick={togglePlay}
            playsInline
            preload="auto"
            className="h-full w-full object-contain cursor-pointer"
          />

          {/* Center Play Button Overlay */}
          {!isPlaying && !playbackError && !isLoading && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/40 transition hover:bg-black/30"
              role="button"
              aria-label="Play video"
            >
              <div className="flex size-18 items-center justify-center rounded-full bg-amber-500 text-black shadow-2xl transition hover:scale-110 active:scale-95 ring-4 ring-amber-500/30">
                <Play className="size-9 fill-current translate-x-0.5" />
              </div>
            </div>
          )}

          {/* Buffering Indicator */}
          {isLoading && isPlaying && (
            <div className="pointer-events-none absolute inset-0 z-15 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs">
              <div className="flex size-12 items-center justify-center rounded-full bg-black/80 text-white shadow-xl ring-1 ring-white/10">
                <Loader2 className="size-6 animate-spin text-amber-500" />
              </div>
              <p className="mt-2 text-xs font-semibold text-white/90">Buffering stream...</p>
            </div>
          )}
        </div>
      ) : null}

      {/* UNAVAILABLE OR LOADING STATE */}
      {!hasPlayableSource && (
        <div className="absolute inset-0 z-25 flex flex-col items-center justify-center bg-black/95 p-6 text-center">
          {isLoadingSource ? (
            <>
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10 text-amber-400 mb-3 ring-1 ring-white/15">
                <Loader2 className="size-7 animate-spin text-amber-500" />
              </div>
              <h3 className="text-base font-bold text-white">Loading Lecture Stream</h3>
              <p className="mt-1.5 text-xs text-white/70 max-w-sm">
                Connecting to Vidyaverse authorized stream...
              </p>
            </>
          ) : (
            <>
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10 text-amber-400 mb-3 ring-1 ring-white/15">
                <ShieldAlert className="size-7" />
              </div>
              <h3 className="text-base font-bold text-white">Video unavailable</h3>
              <p className="mt-1.5 text-xs text-white/70 max-w-sm">
                Video stream could not be loaded. Please click Retry below.
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-4 press inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 transition"
              >
                <RefreshCw className="size-3.5" />
                <span>Retry</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* ERROR STATE */}
      {playbackError && hasPlayableSource && (
        <div className="absolute inset-0 z-25 flex flex-col items-center justify-center bg-black/90 p-6 text-center backdrop-blur-xs">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 mb-3 ring-1 ring-amber-500/30">
            <AlertCircle className="size-7" />
          </div>
          <h3 className="text-base font-bold text-white">Video unavailable</h3>
          <p className="mt-1.5 text-xs text-white/70 max-w-sm">{playbackError}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleRetry}
              className="press inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
            >
              <RefreshCw className="size-3.5" />
              <span>Retry</span>
            </button>
            {resolvedEmbedUrl && playbackMode !== "embed" && (
              <button
                type="button"
                onClick={() => {
                  setPlaybackError(null);
                  setPlaybackMode("embed");
                }}
                className="rounded-xl bg-white/20 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/30 transition"
              >
                Switch to Web Player
              </button>
            )}
          </div>
        </div>
      )}

      {/* Completion Overlay */}
      {isCompleted && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-6 text-center backdrop-blur-xs">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="size-8" />
          </div>
          <h3 className="mt-3 text-base font-bold text-white">Lecture Completed!</h3>
          <p className="mt-1 max-w-xs text-xs text-white/70">
            Great job! You watched this course lecture and earned +25 XP.
          </p>
          <button
            onClick={() => {
              setIsCompleted(false);
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(() => {});
              }
            }}
            className="mt-4 press inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-white/90 transition"
          >
            <RotateCcw className="size-3.5" /> Replay Lecture
          </button>
        </div>
      )}

      {/* 2. Top Header Overlay */}
      <div
        className={`pointer-events-none absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/85 via-black/50 to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white/90 backdrop-blur ring-1 ring-white/15">
            <Radio className="size-3 text-emerald-400 animate-pulse" />
            <span className="uppercase tracking-wider">Authorized Lecture</span>
          </div>

          {Boolean(
            (batchId && (batchId.startsWith("vv-") || batchId.startsWith("sw-"))) ||
            (mp4Recordings && mp4Recordings.length > 0) ||
            (activePlayUrl &&
              (activePlayUrl.includes("hranker.com") || activePlayUrl.includes("vidya-verse"))),
          ) && (
            <div className="flex items-center gap-1 rounded-md bg-sky-500/25 px-2 py-0.5 text-[10px] font-bold text-sky-300 ring-1 ring-sky-400/40 backdrop-blur">
              <Zap className="size-2.5 text-sky-400 fill-current" />
              <span>Vidyaverse HD</span>
            </div>
          )}

          {/* Mode Switcher: only shown if there is a legitimate embed player (e.g. YouTube) */}
          {resolvedEmbedUrl && !isDirectCapable && (
            <div className="pointer-events-auto flex items-center rounded-lg bg-black/60 p-0.5 ring-1 ring-white/15 backdrop-blur">
              <button
                type="button"
                onClick={() => setPlaybackMode("embed")}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  playbackMode === "embed"
                    ? "bg-amber-500 text-black shadow-xs font-bold"
                    : "text-white/70 hover:text-white"
                }`}
                title="Use Authorized Web Player"
              >
                <ShieldCheck className="size-3" />
                <span>Web Player</span>
              </button>
              <button
                type="button"
                onClick={() => setPlaybackMode("direct")}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  playbackMode === "direct"
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-white/70 hover:text-white"
                }`}
                title="Use Direct Stream"
              >
                <Zap className="size-3" />
                <span>Direct Stream</span>
              </button>
            </div>
          )}

          <span className="hidden md:inline truncate text-xs font-semibold text-white/90 drop-shadow-sm ml-1">
            {title}
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {/* Reload stream button */}
          <button
            type="button"
            onClick={handleRetry}
            className="flex size-7 items-center justify-center rounded-lg bg-black/50 text-white/80 backdrop-blur hover:bg-white/20 transition ring-1 ring-white/10"
            title="Reload lecture"
          >
            <RefreshCw className="size-3.5" />
          </button>

          {/* Live Chat Toggle */}
          <button
            type="button"
            onClick={() => setIsChatOpen((prev) => !prev)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold backdrop-blur ring-1 ring-white/10 transition ${
              isChatOpen
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "bg-black/50 text-white/90 hover:bg-white/20"
            }`}
          >
            <MessageSquare className="size-3.5" />
            <span className="hidden sm:inline">Live Chat</span>
          </button>
        </div>
      </div>

      {/* 3. Bottom Controls Bar (Direct Stream Only) */}
      {playbackMode === "direct" && (
        <div
          className={`pointer-events-auto absolute bottom-0 inset-x-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 pt-6 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Progress Scrubber */}
          <div className="group/scrub relative mb-2 flex h-2 w-full cursor-pointer items-center">
            <div className="absolute inset-y-0 w-full rounded-full bg-white/20" />
            <div
              className="absolute inset-y-0 rounded-full bg-white/40"
              style={{ width: `${bufferedPercent}%` }}
            />
            <div
              className="absolute inset-y-0 rounded-full bg-amber-500"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleScrubberChange(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="flex size-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                {isPlaying ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4 fill-current" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSeekRelative(-10)}
                className="flex size-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition text-white/80"
                title="Rewind 10s"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleSeekRelative(10)}
                className="flex size-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition text-white/80"
                title="Forward 10s"
              >
                <RotateCw className="size-3.5" />
              </button>

              {/* Volume / Mute */}
              <button
                type="button"
                onClick={toggleMute}
                className="flex size-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition text-white/80"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="size-3.5" />
                ) : volume < 0.5 ? (
                  <Volume1 className="size-3.5" />
                ) : (
                  <Volume2 className="size-3.5" />
                )}
              </button>

              {/* Time display */}
              <span className="text-[11px] font-mono font-medium text-white/80">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Quality Switcher if MP4 recordings available */}
              {mp4Recordings && mp4Recordings.length > 0 && (
                <div className="flex items-center rounded-lg bg-white/10 p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleQualityChange("auto")}
                    className={`px-1.5 py-0.5 rounded font-bold transition ${
                      selectedQuality === "auto"
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Auto
                  </button>
                  {mp4Recordings.map((rec) => (
                    <button
                      key={rec.quality}
                      type="button"
                      onClick={() => handleQualityChange(rec.quality, rec.url)}
                      className={`px-1.5 py-0.5 rounded font-bold transition ${
                        selectedQuality === rec.quality
                          ? "bg-amber-500 text-black font-bold"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      {rec.quality}
                    </button>
                  ))}
                </div>
              )}

              {/* Playback speed */}
              <div className="flex items-center rounded-lg bg-white/10 p-0.5 text-[11px]">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSpeedChange(s)}
                    className={`px-1.5 py-0.5 rounded font-semibold transition ${
                      speed === s
                        ? "bg-amber-500 text-black font-bold"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Fullscreen */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="flex size-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Player Live Chat Drawer */}
      <InPlayerChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        courseId={batchId || "course"}
        lessonId={scheduleId || "lecture"}
        lectureTitle={title}
      />
    </div>
  );
}
