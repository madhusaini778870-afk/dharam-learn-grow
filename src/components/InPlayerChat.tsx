import { useState, useRef, useEffect } from "react";
import { X, Send, MessageSquare, Users, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { gamificationStore } from "@/services/gamificationStore";

export interface ChatMessage {
  id: string;
  sender: string;
  badge?: string;
  text: string;
  time: string;
  isSelf?: boolean;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "m-1",
    sender: "Rahul Verma",
    badge: "JEE Main 2026",
    text: "Sir the derivation at 12:40 is crystal clear! Thank you 🙏",
    time: "2m ago",
  },
  {
    id: "m-2",
    sender: "Ananya Dixit",
    badge: "Class 12",
    text: "Did everyone solve question 4 from today's DPP sheet?",
    time: "1m ago",
  },
  {
    id: "m-3",
    sender: "Dharam Bhai Study AI",
    badge: "Bot",
    text: "Tip: You can download today's lecture PDF notes from the Notes tab.",
    time: "Just now",
  },
];

const EMOJI_LIST = ["🔥", "👍", "💡", "❓", "💯", "👏"];

export function InPlayerChat({
  isOpen,
  onClose,
  lectureTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  lectureTitle?: string;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const myName =
      (user?.user_metadata?.["full_name"] as string | undefined) ||
      user?.name ||
      "Student Aspirant";

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: myName,
      badge: "You",
      text: inputText.trim(),
      time: "Just now",
      isSelf: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Award small bonus XP for active participation
    gamificationStore.addBonusXp(5, "Live Chat Participation");
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText((prev) => `${prev} ${emoji}`.trim());
  };

  return (
    <div className="absolute inset-y-0 right-0 z-40 flex w-full max-w-[320px] flex-col bg-card/95 backdrop-blur-md ring-1 ring-border shadow-2xl transition-all animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-3 bg-muted/40">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/15 text-red-600 dark:text-red-400">
            <MessageSquare className="size-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground leading-none">Lecture Live Chat</h4>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>128 students active</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground transition"
          aria-label="Close Chat"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl p-2.5 ${
              m.isSelf
                ? "bg-amber-500/15 text-foreground ring-1 ring-amber-500/30 ml-3"
                : m.sender.includes("Bot")
                  ? "bg-muted/70 text-foreground ring-1 ring-border"
                  : "bg-muted/40 text-foreground"
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-[11px] text-foreground truncate">{m.sender}</span>
                {m.badge ? (
                  <span
                    className={`rounded px-1 py-0.2 text-[9px] font-semibold uppercase ${
                      m.isSelf
                        ? "bg-amber-500 text-white"
                        : m.sender.includes("Bot")
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {m.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[9px] text-muted-foreground shrink-0">{m.time}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-foreground/90 break-words">{m.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reaction Emojis */}
      <div className="flex items-center justify-between gap-1 border-t border-border px-3 py-1.5 bg-muted/20">
        {EMOJI_LIST.map((em) => (
          <button
            key={em}
            type="button"
            onClick={() => handleEmojiClick(em)}
            className="flex size-6 items-center justify-center rounded-md hover:bg-muted text-sm transition active:scale-95"
            title="React"
          >
            {em}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-1.5 border-t border-border p-2 bg-card"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask doubt or comment..."
          className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition hover:opacity-90 disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="size-3.5" />
        </button>
      </form>
    </div>
  );
}
