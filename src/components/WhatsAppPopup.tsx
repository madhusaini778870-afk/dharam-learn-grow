import { useEffect, useState } from "react";
import { MessageCircle, X, ExternalLink } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getPublicSettingsServer } from "@/services/adminService";

const STORAGE_KEY = "dharam_wa_popup_dismissed_at";
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours cooldown

export function WhatsAppPopup() {
  const [visible, setVisible] = useState(false);
  const [channelUrl, setChannelUrl] = useState(
    "https://whatsapp.com/channel/0029VbB3XKSK0IBqD72ndg2i",
  );
  const getSettings = useServerFn(getPublicSettingsServer);

  useEffect(() => {
    // Check local cooldown
    try {
      const lastDismissed = localStorage.getItem(STORAGE_KEY);
      if (lastDismissed) {
        const diff = Date.now() - parseInt(lastDismissed, 10);
        if (diff < COOLDOWN_MS) {
          return;
        }
      }
    } catch {
      // ignore localStorage errors
    }

    // Fetch dynamic channel URL from admin settings if configured
    getSettings()
      .then((settings) => {
        if (settings?.whatsappChannelUrl) {
          setChannelUrl(settings.whatsappChannelUrl);
        }
      })
      .catch(() => {
        // ignore network error
      });

    // Delay slightly for smooth app entrance
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [getSettings]);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      // ignore localStorage errors
    }
  };

  const handleFollow = () => {
    handleDismiss();
    window.open(channelUrl, "_blank", "noopener,noreferrer");
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl ring-1 ring-border text-center">
        {/* Close icon */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition"
          aria-label="Close popup"
        >
          <X className="size-4" />
        </button>

        {/* WhatsApp Icon */}
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <MessageCircle className="size-7" />
        </div>

        <h3 className="mt-4 font-display text-lg font-bold text-foreground">
          Join Dharam Bhai Study WhatsApp Channel
        </h3>

        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Get class updates, announcements and study updates directly on WhatsApp.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={handleFollow}
            className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            <span>Follow Channel</span>
            <ExternalLink className="size-4" />
          </button>

          <button
            onClick={handleDismiss}
            className="press w-full rounded-2xl bg-muted/60 px-4 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
