import { useState, useEffect } from "react";
import { gamificationStore } from "@/services/gamificationStore";
import { Star, Heart, CheckCircle2, Send } from "lucide-react";

export function AppRatingCard() {
  const [savedRating, setSavedRating] = useState(() => gamificationStore.getAppRating());
  const [rating, setRating] = useState(savedRating?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState(savedRating?.feedback || "");
  const [isEditing, setIsEditing] = useState(!savedRating);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    const update = () => setSavedRating(gamificationStore.getAppRating());
    window.addEventListener("dharam_app_rating_updated", update);
    return () => window.removeEventListener("dharam_app_rating_updated", update);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    gamificationStore.saveAppRating(rating, feedback);
    setJustSaved(true);
    setIsEditing(false);
    setTimeout(() => setJustSaved(false), 4000);
  };

  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
            <Heart className="size-4 fill-current" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Rate Dharam Bhai Study</h4>
            <p className="text-[10px] text-muted-foreground">
              Help Lakshya Prince improve your learning experience
            </p>
          </div>
        </div>

        {savedRating && !isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            Edit
          </button>
        ) : null}
      </div>

      {justSaved ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/15 p-2.5 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
          <span>Thank you for rating! +20 XP added to your profile.</span>
        </div>
      ) : null}

      {!isEditing && savedRating ? (
        <div className="mt-3 rounded-xl bg-muted/40 p-3 ring-1 ring-border/50">
          <div className="flex items-center justify-between">
            <div className="flex text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`size-3.5 ${
                    s <= savedRating.rating ? "fill-current" : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Rating Submitted
            </span>
          </div>
          {savedRating.feedback ? (
            <p className="mt-1.5 text-xs text-muted-foreground italic">"{savedRating.feedback}"</p>
          ) : null}
        </div>
      ) : (
        <form onSubmit={handleSave} className="mt-3 space-y-2.5">
          <div className="flex items-center justify-center gap-1.5 py-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => setRating(s)}
                className="p-1 transition hover:scale-115"
              >
                <Star
                  className={`size-6 ${
                    (hoverRating !== null ? s <= hoverRating : s <= rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>

          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Any suggestions or thoughts for the developer?"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="press inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition hover:opacity-90"
            >
              <Send className="size-3" />
              <span>Submit Rating</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
