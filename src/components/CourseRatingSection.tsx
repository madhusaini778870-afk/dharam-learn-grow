import { useState, useEffect } from "react";
import { gamificationStore, type ReviewItem } from "@/services/gamificationStore";
import { useAuth } from "@/hooks/useAuth";
import { Star, MessageSquare, CheckCircle2, Sparkles, Send, ThumbsUp } from "lucide-react";

export function CourseRatingSection({
  courseId,
  courseTitle,
  isEnrolled,
}: {
  courseId: string;
  courseTitle: string;
  isEnrolled: boolean;
}) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[]>(() =>
    gamificationStore.getCourseReviews(courseId),
  );

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const update = () => setReviews(gamificationStore.getCourseReviews(courseId));
    window.addEventListener("dharam_reviews_updated", update);
    return () => window.removeEventListener("dharam_reviews_updated", update);
  }, [courseId]);

  const QUICK_TAGS = [
    "🔥 Concept Clarity",
    "📚 Best DPPs",
    "⭐ Top Faculty",
    "⚡ Fast Revision",
    "🎯 Exam Oriented",
  ];

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() && selectedTags.length === 0) return;

    const userName =
      (user?.user_metadata?.["full_name"] as string | undefined) ||
      user?.name ||
      "Student Aspirant";

    gamificationStore.addCourseReview(courseId, {
      userName,
      rating,
      comment: comment.trim() || `Excellent course! High quality lectures and DPPs.`,
      tags: selectedTags,
    });

    setSubmitted(true);
    setIsFormOpen(false);
    setComment("");
    setSelectedTags([]);
    setTimeout(() => setSubmitted(false), 5000);
  };

  // Calculate average rating
  const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(
    1,
  );

  return (
    <section className="mt-8 rounded-2xl bg-card p-5 ring-1 ring-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Star className="size-4 fill-current" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Ratings &amp; Student Reviews
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Feedback from students enrolled in this batch
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold text-foreground">{avgRating}</span>
            <div className="flex text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`size-3.5 ${
                    s <= Math.round(Number(avgRating))
                      ? "fill-current text-amber-500"
                      : "text-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground">({reviews.length} reviews)</span>
        </div>
      </div>

      {/* Success Banner */}
      {submitted ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
          <span>Your review has been published! +15 XP bonus awarded.</span>
        </div>
      ) : null}

      {/* Write Review Toggle Button */}
      {!isFormOpen && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3.5 ring-1 ring-border">
          <div className="flex items-center gap-2 text-xs text-foreground">
            <Sparkles className="size-4 text-amber-500" />
            <span className="font-semibold">Have you attended lectures in this course?</span>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="press rounded-xl bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background transition hover:opacity-90"
          >
            Write a Review
          </button>
        </div>
      )}

      {/* Review Submission Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-3.5 rounded-xl bg-muted/30 p-4 ring-1 ring-border"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Rate this Course</span>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          {/* Star selector */}
          <div className="flex items-center gap-1.5 py-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => setRating(star)}
                className="p-1 transition hover:scale-110"
                aria-label={`${star} Stars`}
              >
                <Star
                  className={`size-6 ${
                    (hoverRating !== null ? star <= hoverRating : star <= rating)
                      ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                      : "text-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-xs font-bold text-foreground">
              {rating === 5
                ? "Excellent (5/5)"
                : rating === 4
                  ? "Very Good (4/5)"
                  : rating === 3
                    ? "Good (3/5)"
                    : rating === 2
                      ? "Fair (2/5)"
                      : "Needs Improvement (1/5)"}
            </span>
          </div>

          {/* Quick feedback tags */}
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              What did you like the most?
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                    selectedTags.includes(tag)
                      ? "bg-amber-500 text-white font-semibold"
                      : "bg-card ring-1 ring-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Comment input */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your honest review about the teacher, notes, video quality or DPPs..."
            rows={3}
            className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-muted-foreground">
              Reviews help other aspirants pick the best batches
            </span>
            <button
              type="submit"
              className="press inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background shadow transition hover:opacity-90"
            >
              <Send className="size-3" />
              <span>Submit Review (+15 XP)</span>
            </button>
          </div>
        </form>
      )}

      {/* Review List */}
      <div className="mt-5 space-y-3">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className={`rounded-xl p-3.5 ring-1 transition ${
              rev.isUserReview ? "bg-amber-500/5 ring-amber-500/30" : "bg-background ring-border/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-full bg-muted font-bold text-xs text-foreground">
                  {rev.userName[0]?.toUpperCase() || "S"}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">{rev.userName}</span>
                    {rev.isUserReview ? (
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                        You
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{rev.createdAt}</span>
                </div>
              </div>

              <div className="flex text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`size-3 ${
                      s <= rev.rating ? "fill-current" : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-foreground">{rev.comment}</p>

            {rev.tags && rev.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {rev.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
