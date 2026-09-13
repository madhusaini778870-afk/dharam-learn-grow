import { useEffect, useState } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { CloseIcon } from "@/components/app-shell";

const KEY = "dbs-community-popup-shown-at";

/** Admin-controlled WhatsApp / Telegram invite, shown at most once per cooldown. */
export function CommunityPopup() {
  const { data } = useAppSettings();
  const [open, setOpen] = useState(false);
  const community = data?.community;

  useEffect(() => {
    if (!community) return;
    const enabled =
      (community.whatsappEnabled && community.whatsappUrl) ||
      (community.telegramEnabled && community.telegramUrl);
    if (!enabled) return;

    const last = Number(window.localStorage.getItem(KEY) ?? 0);
    const cooldown = Math.max(0, community.cooldownDays) * 86_400_000;
    if (last && Date.now() - last < cooldown) return;

    const timer = window.setTimeout(() => setOpen(true), 2500);
    return () => window.clearTimeout(timer);
  }, [community]);

  function dismiss() {
    window.localStorage.setItem(KEY, String(Date.now()));
    setOpen(false);
  }

  if (!open || !community) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 px-4 pb-6 backdrop-blur-sm">
      <div className="animate-rise w-full max-w-[480px] rounded-3xl bg-card p-5 ring-1 ring-border">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="font-display text-[20px] leading-tight">{community.title}</p>
            <p className="mt-1.5 text-[13px] text-muted-foreground">{community.message}</p>
          </div>
          <button type="button" onClick={dismiss} aria-label="Close" className="press text-muted-foreground">
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {community.whatsappEnabled && community.whatsappUrl ? (
            <a
              href={community.whatsappUrl}
              target="_blank"
              rel="noreferrer noopener"
              onClick={dismiss}
              className="press block rounded-2xl bg-pine py-3 text-center text-sm font-semibold text-paper"
            >
              Join on WhatsApp
            </a>
          ) : null}
          {community.telegramEnabled && community.telegramUrl ? (
            <a
              href={community.telegramUrl}
              target="_blank"
              rel="noreferrer noopener"
              onClick={dismiss}
              className="press block rounded-2xl bg-foreground py-3 text-center text-sm font-semibold text-background"
            >
              Join on Telegram
            </a>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="w-full py-2 text-center text-[12px] text-muted-foreground"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
