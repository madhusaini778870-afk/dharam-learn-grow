import { useEffect, useState, useId } from "react";
import { Check } from "lucide-react";
import { studentStore, type ChapterProgressStats } from "@/services/studentStore";

export interface ChapterProgressIndicatorProps {
  courseId: string;
  chapterId: string;
  totalLectures?: number | null;
  knownLessonIds?: string[];
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  labelPosition?: "right" | "bottom";
  displayMode?: "fraction" | "percent" | "auto";
  className?: string;
}

const SIZE_CONFIGS = {
  xs: {
    outer: "size-7", // 28px
    viewBoxSize: 32,
    radius: 12.5,
    strokeWidth: 3,
    fontSize: "text-[9px]",
    fractionSize: "text-[7.5px]",
    iconSize: "size-3",
  },
  sm: {
    outer: "size-9", // 36px
    viewBoxSize: 36,
    radius: 14.5,
    strokeWidth: 3.5,
    fontSize: "text-[10px]",
    fractionSize: "text-[8.5px]",
    iconSize: "size-3.5",
  },
  md: {
    outer: "size-12", // 48px
    viewBoxSize: 44,
    radius: 18,
    strokeWidth: 4,
    fontSize: "text-xs",
    fractionSize: "text-[10px]",
    iconSize: "size-4",
  },
  lg: {
    outer: "size-16", // 64px
    viewBoxSize: 56,
    radius: 23,
    strokeWidth: 4.5,
    fontSize: "text-sm",
    fractionSize: "text-xs",
    iconSize: "size-5",
  },
};

export function ChapterProgressIndicator({
  courseId,
  chapterId,
  totalLectures,
  knownLessonIds,
  size = "sm",
  showLabel = false,
  labelPosition = "right",
  displayMode = "auto",
  className = "",
}: ChapterProgressIndicatorProps) {
  const gradientId = useId();
  const [stats, setStats] = useState<ChapterProgressStats>(() =>
    studentStore.getChapterProgress(courseId, chapterId, totalLectures, knownLessonIds),
  );

  useEffect(() => {
    // Immediate compute with updated props
    setStats(studentStore.getChapterProgress(courseId, chapterId, totalLectures, knownLessonIds));

    const handleUpdate = () => {
      setStats(studentStore.getChapterProgress(courseId, chapterId, totalLectures, knownLessonIds));
    };

    window.addEventListener("dharam_progress_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("dharam_gamification_updated", handleUpdate);

    return () => {
      window.removeEventListener("dharam_progress_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("dharam_gamification_updated", handleUpdate);
    };
  }, [courseId, chapterId, totalLectures, knownLessonIds]);

  const config = SIZE_CONFIGS[size] || SIZE_CONFIGS.sm;
  const { radius, strokeWidth, viewBoxSize } = config;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.percentage / 100) * circumference;

  const isCompleted = stats.percentage === 100 && stats.totalCount > 0;
  const hasProgress = stats.completedCount > 0;

  // Decide what text to show in the center
  const renderCenterContent = () => {
    if (isCompleted) {
      return (
        <Check
          className={`${config.iconSize} text-emerald-500 dark:text-emerald-400 stroke-[3] transition-transform duration-300 scale-100`}
        />
      );
    }

    if (displayMode === "percent") {
      return (
        <span
          className={`font-mono font-bold leading-none ${config.fontSize} ${
            hasProgress ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/70"
          }`}
        >
          {stats.percentage}%
        </span>
      );
    }

    if (displayMode === "fraction" || (displayMode === "auto" && size !== "xs")) {
      return (
        <span
          className={`font-mono font-bold leading-none tracking-tighter ${config.fractionSize} ${
            hasProgress ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/70"
          }`}
        >
          {stats.completedCount}/{stats.totalCount}
        </span>
      );
    }

    // Default for xs auto
    return (
      <span
        className={`font-mono font-bold leading-none ${config.fontSize} ${
          hasProgress ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/70"
        }`}
      >
        {stats.completedCount}
      </span>
    );
  };

  const centerCoord = viewBoxSize / 2;
  const tooltipText = `${stats.completedCount} of ${stats.totalCount} lectures completed (${stats.percentage}%)`;

  return (
    <div
      className={`inline-flex items-center gap-2 ${
        labelPosition === "bottom" ? "flex-col" : "flex-row"
      } ${className}`}
      title={tooltipText}
      role="progressbar"
      aria-valuenow={stats.percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Chapter progress: ${tooltipText}`}
    >
      <div className={`relative ${config.outer} shrink-0 flex items-center justify-center`}>
        <svg
          className="size-full -rotate-90 transform"
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        >
          <defs>
            <linearGradient id={`amber-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id={`emerald-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Background circle track */}
          <circle
            cx={centerCoord}
            cy={centerCoord}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-muted/40 dark:stroke-muted/30"
          />

          {/* Foreground progress arc */}
          {stats.totalCount > 0 && (
            <circle
              cx={centerCoord}
              cy={centerCoord}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke={
                isCompleted
                  ? `url(#emerald-${gradientId})`
                  : hasProgress
                    ? `url(#amber-${gradientId})`
                    : "transparent"
              }
              className="transition-all duration-700 ease-out"
            />
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {renderCenterContent()}
        </div>
      </div>

      {showLabel && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-semibold ${
                isCompleted
                  ? "text-emerald-600 dark:text-emerald-400"
                  : hasProgress
                    ? "text-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {stats.completedCount} of {stats.totalCount} completed
            </span>
            {isCompleted && (
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                100%
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {isCompleted
              ? "All lectures completed"
              : `${stats.totalCount - stats.completedCount} lecture${
                  stats.totalCount - stats.completedCount === 1 ? "" : "s"
                } remaining`}
          </p>
        </div>
      )}
    </div>
  );
}
