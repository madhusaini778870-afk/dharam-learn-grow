import { useState, useEffect } from "react";
import { Send, X, CheckCircle2, Sparkles, BookOpen, Video, Users, ArrowRight } from "lucide-react";

const TELEGRAM_URL = "https://t.me/mrlokygamer";
const POPUP_STORAGE_KEY = "dhs_pw_telegram_popup_dismissed_until";

export function TelegramJoinModal({
  forceOpen = false,
  onCloseManual,
}: {
  forceOpen?: boolean;
  onCloseManual?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    // Check if dismissed previously within 24 hours
    try {
      const dismissedUntil = localStorage.getItem(POPUP_STORAGE_KEY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return;
      }
    } catch {
      // Ignore storage errors
    }

    // Trigger popup after a polite 1.8s delay for fresh visitors
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1800);

    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener("dharam_open_telegram_popup", handleOpenEvent);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("dharam_open_telegram_popup", handleOpenEvent);
    };
  }, [forceOpen]);

  const handleDismiss = (dontShowForAWhile = true) => {
    setIsOpen(false);
    if (onCloseManual) onCloseManual();
    if (dontShowForAWhile) {
      try {
        // Snooze for 24 hours
        localStorage.setItem(POPUP_STORAGE_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
      } catch {
        // Ignore storage errors
      }
    }
  };

  const handleJoin = () => {
    window.open(TELEGRAM_URL, "_blank", "noopener,noreferrer");
    handleDismiss(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-card border border-border/80 shadow-2xl transition-all">
        {/* Decorative Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600" />

        {/* Close Button */}
        <button
          onClick={() => handleDismiss(false)}
          className="absolute right-3.5 top-5.5 z-10 flex size-8 items-center justify-center rounded-full bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          aria-label="Close popup"
        >
          <X className="size-4" />
        </button>

        <div className="p-6">
          {/* Header Icon + Badge */}
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-500 ring-1 ring-sky-500/30">
              <Send className="size-6 -translate-y-0.5 translate-x-0.5" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                <Sparkles className="size-3" /> Official Community
              </span>
              <h2 className="font-display text-lg font-bold text-foreground mt-0.5">
                All Courses Of PW
              </h2>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            Join thousands of JEE &amp; NEET aspirants on Telegram for free access to all official
            Physics Wallah batches, notes, books, DPPs, and daily lecture updates.
          </p>

          {/* Value Props */}
          <div className="mt-4 space-y-2.5 rounded-2xl bg-muted/40 p-3.5 border border-border/50 text-xs">
            <div className="flex items-start gap-2.5">
              <Video className="size-4 shrink-0 text-sky-500 mt-0.5" />
              <span className="text-foreground">
                <strong>All PW Batches &amp; Lectures:</strong> Arjuna, Lakshya, Prayas &amp; Yakeen
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <BookOpen className="size-4 shrink-0 text-sky-500 mt-0.5" />
              <span className="text-foreground">
                <strong>Daily DPPs &amp; PDFs:</strong> Hand-crafted solutions &amp; formula sheets
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <Users className="size-4 shrink-0 text-sky-500 mt-0.5" />
              <span className="text-foreground">
                <strong>Fastest Notifications:</strong> New lecture links &amp; exam updates
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 space-y-2.5">
            <button
              onClick={handleJoin}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/25 hover:bg-sky-500 active:scale-[0.98] transition cursor-pointer"
            >
              <Send className="size-4" />
              <span>Join Telegram Channel Now</span>
              <ArrowRight className="size-4 ml-1" />
            </button>

            <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
              <span className="truncate">Channel: @mrlokygamer</span>
              <button
                onClick={() => handleDismiss(true)}
                className="hover:text-foreground underline underline-offset-2 transition cursor-pointer"
              >
                Remind Me Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
