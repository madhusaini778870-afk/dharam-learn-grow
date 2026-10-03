import { useState, useTransition } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { fetchCourseDetail } from "@/services/courseApi";
import { extractBatchId, compositeId, type NormalizedCourse } from "@/services/courseNormalizer";
import { studentStore } from "@/services/studentStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Link as LinkIcon,
  Search,
  Sparkles,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Layers,
  GraduationCap,
  ClipboardPaste,
} from "lucide-react";

export type AddBatchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultUrl?: string;
};

// Popular batch and course examples from Vidyaverse and PW Gemtara
const POPULAR_BATCH_PRESETS = [
  {
    name: "Maths Special VOD (Gagan Pratap Sir)",
    id: "6ab25570b2d758e23476cd66",
    category: "SSC & Govt",
    tag: "Vidyaverse",
    source: "vidyaverse",
  },
  {
    name: "English Special VOD (Aman Sir)",
    id: "6ab2555fb2d758e23476cd5d",
    category: "SSC & Govt",
    tag: "Vidyaverse",
    source: "vidyaverse",
  },
  {
    name: "UPSI 2026 दरोगा बैच",
    id: "6ab9209e04d63dccd41ed518",
    category: "SSC & Govt",
    tag: "Vidyaverse",
    source: "vidyaverse",
  },
  {
    name: "Reasoning Foundation VOD",
    id: "6ab2555bb2d758e23476cd58",
    category: "SSC & Govt",
    tag: "Vidyaverse",
    source: "vidyaverse",
  },
  {
    name: "Lakshya JEE 2026",
    id: "665efb583f7a1f59996b7975",
    category: "JEE",
    tag: "PW Gemtara",
    source: "gemtara",
  },
  {
    name: "Yakeen NEET 2026",
    id: "662f551b99787e07a38b1875",
    category: "NEET",
    tag: "PW Gemtara",
    source: "gemtara",
  },
];

export function AddBatchDialog({ open, onOpenChange, defaultUrl = "" }: AddBatchDialogProps) {
  const navigate = useNavigate();
  const loadDetail = useServerFn(fetchCourseDetail);

  const [inputUrl, setInputUrl] = useState(defaultUrl);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewCourse, setPreviewCourse] = useState<NormalizedCourse | null>(null);
  const [isPending, startTransition] = useTransition();

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text.trim());
        void handleFetch(text.trim());
      }
    } catch {
      // ignore clipboard permission error
    }
  };

  const handleFetch = async (targetInput?: string) => {
    const raw = (targetInput ?? inputUrl).trim();
    if (!raw) {
      setErrorMsg("Please enter a course or batch link/ID from Vidyaverse or PW Gemtara");
      return;
    }

    const isVv =
      raw.includes("vidya-verse") ||
      raw.startsWith("vv-") ||
      raw.startsWith("sw-") ||
      raw.includes("multistreaming.site");

    const cleanBatchId = extractBatchId(raw);
    if (!cleanBatchId) {
      setErrorMsg(
        "Could not detect a valid course or batch ID from that link. Please check the URL.",
      );
      return;
    }

    // Prepend vv- prefix if from Vidyaverse
    const lookupId = isVv && !cleanBatchId.startsWith("vv-") ? `vv-${cleanBatchId}` : cleanBatchId;

    setLoading(true);
    setErrorMsg(null);
    setPreviewCourse(null);

    try {
      const res = await loadDetail({ data: { courseId: lookupId } });
      if (res.status === "ok" && res.course) {
        setPreviewCourse(res.course);
      } else {
        // Fallback preview
        const sourceLabel = isVv ? "Vidyaverse" : "pw.gemtara.in";
        setPreviewCourse({
          id: isVv ? compositeId("vidyaverse", cleanBatchId) : compositeId("source1", cleanBatchId),
          sourceCourseId: cleanBatchId,
          slug: null,
          source: isVv ? "vidyaverse" : "source1",
          sourceLabel,
          sourceUrl: isVv
            ? `https://vidya-verse.ai.studio/courses/${cleanBatchId}`
            : `https://pw.gemtara.in/study/batches/${cleanBatchId}`,
          title: `Course Batch (${cleanBatchId.slice(-6)})`,
          thumbnail: null,
          description: isVv
            ? "Course imported from https://vidya-verse.ai.studio/"
            : "Batch imported from https://pw.gemtara.in/study/batches",
          category: "Other",
          className: null,
          exam: null,
          language: "Hinglish",
          startDate: null,
          subjects: [],
          subjectRefs: [],
          teachers: [],
          chapters: [],
          lessons: [],
          videos: [],
          notes: [],
        });
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to fetch batch from source");
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollAndOpen = async () => {
    if (!previewCourse) return;

    startTransition(async () => {
      // 1. Enroll / store in student store
      await studentStore.enrollCourse({
        id: previewCourse.id,
        title: previewCourse.title,
        category: previewCourse.category,
        exam: previewCourse.exam,
        thumbnail: previewCourse.thumbnail,
      });

      // 2. Close modal
      onOpenChange(false);

      // 3. Navigate to course page
      navigate({
        to: "/course/$courseId",
        params: { courseId: previewCourse.id },
      });
    });
  };

  const handleSelectPreset = (preset: (typeof POPULAR_BATCH_PRESETS)[0]) => {
    const url =
      preset.source === "vidyaverse"
        ? `https://vidya-verse.ai.studio/courses/${preset.id}`
        : `https://pw.gemtara.in/study/batches/${preset.id}`;
    setInputUrl(url);
    void handleFetch(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 sm:p-6 overflow-hidden">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Plus className="size-4" />
            </div>
            <DialogTitle className="font-display text-base font-bold tracking-tight">
              Add Batch from Source
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Enter or paste any course link or batch ID from{" "}
            <a
              href="https://vidya-verse.ai.studio/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline underline-offset-2 hover:opacity-80"
            >
              Vidyaverse
            </a>{" "}
            or{" "}
            <a
              href="https://pw.gemtara.in/study/batches"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground underline underline-offset-2 hover:text-primary"
            >
              PW Gemtara
            </a>{" "}
            to immediately access all video lectures and class notes.
          </DialogDescription>
        </DialogHeader>

        {/* Input Field */}
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2 rounded-2xl bg-muted/50 p-1.5 ring-1 ring-border focus-within:ring-primary focus-within:bg-card transition">
            <div className="pl-2 text-muted-foreground">
              <LinkIcon className="size-4" />
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setErrorMsg(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleFetch();
                }
              }}
              placeholder="Paste Vidyaverse or PW Gemtara course URL or ID"
              className="flex-1 bg-transparent px-1 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
            {typeof navigator !== "undefined" && navigator.clipboard && (
              <button
                type="button"
                onClick={handlePaste}
                title="Paste from clipboard"
                className="flex items-center gap-1 rounded-xl bg-background/80 px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground ring-1 ring-border/50 transition"
              >
                <ClipboardPaste className="size-3" />
                <span>Paste</span>
              </button>
            )}
            <button
              type="button"
              disabled={loading || !inputUrl.trim()}
              onClick={() => void handleFetch()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Search className="size-3.5" />
              )}
              <span>Fetch</span>
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs font-medium text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-xl">
              {errorMsg}
            </p>
          )}

          {/* Quick Presets */}
          {!previewCourse && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Featured Vidyaverse &amp; PW Batches
              </p>
              <div className="grid grid-cols-2 gap-2">
                {POPULAR_BATCH_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="flex flex-col items-start p-2.5 rounded-xl bg-card text-left ring-1 ring-border/60 hover:ring-primary/50 hover:bg-muted/40 transition active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                        {preset.category}
                      </span>
                      <span className="text-[9px] font-semibold text-muted-foreground">
                        {preset.tag}
                      </span>
                    </div>
                    <span className="mt-1 text-xs font-semibold text-foreground line-clamp-1">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fetched Preview Card */}
          {previewCourse && (
            <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-xs space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex gap-3 items-start">
                {previewCourse.thumbnail ? (
                  <img
                    src={previewCourse.thumbnail}
                    alt={previewCourse.title}
                    className="size-16 rounded-xl object-cover ring-1 ring-border/60 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex size-16 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <BookOpen className="size-6" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                      {previewCourse.category || "PW Batch"}
                    </span>
                    {previewCourse.className && (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                        {previewCourse.className}
                      </span>
                    )}
                  </div>

                  <h4 className="mt-1 text-xs font-bold text-foreground line-clamp-2 leading-tight">
                    {previewCourse.title}
                  </h4>

                  <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
                    ID: {previewCourse.sourceCourseId}
                  </p>
                </div>
              </div>

              {/* Subject Badges */}
              {previewCourse.subjectRefs && previewCourse.subjectRefs.length > 0 && (
                <div className="pt-1">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">
                    Subjects ({previewCourse.subjectRefs.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {previewCourse.subjectRefs.slice(0, 5).map((s) => (
                      <span
                        key={s.id}
                        className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-foreground/80 ring-1 ring-border/40"
                      >
                        {s.name}
                      </span>
                    ))}
                    {previewCourse.subjectRefs.length > 5 && (
                      <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        +{previewCourse.subjectRefs.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleEnrollAndOpen}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  <span>Add to My Batches &amp; Study</span>
                  <ArrowRight className="size-3" />
                </button>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>
              Connected Source: <strong className="text-foreground">pw.gemtara.in</strong>
            </span>
            <a
              href="https://pw.gemtara.in/study/batches"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline text-primary font-medium"
            >
              <span>Explore pw.gemtara.in</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
