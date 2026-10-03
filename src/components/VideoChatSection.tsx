import { useState, useEffect, useRef, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchVideoChatMessagesServer,
  sendVideoChatMessageServer,
  reactToVideoChatMessageServer,
  deleteVideoChatMessageServer,
  type VideoChatMessage,
} from "@/services/videoChatService";
import { useAuth } from "@/hooks/useAuth";
import {
  Send,
  HelpCircle,
  Clock,
  Trash2,
  Smile,
  Sparkles,
  User,
  ShieldCheck,
  GraduationCap,
  MessageSquare,
  CheckCircle2,
  Flame,
  Lightbulb,
  ThumbsUp,
  Heart,
} from "lucide-react";

type VideoChatSectionProps = {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  currentPlaySeconds?: number;
  onSeekTo?: (seconds: number) => void;
  onOpenDoubtSolver?: () => void;
};

const REACTION_ICONS: Record<string, { icon: typeof ThumbsUp; label: string }> = {
  "👍": { icon: ThumbsUp, label: "Helpful" },
  "❤️": { icon: Heart, label: "Love it" },
  "💡": { icon: Lightbulb, label: "Understood" },
  "🔥": { icon: Flame, label: "Awesome" },
};

function formatTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}:${remM < 10 ? "0" : ""}${remM}:${s < 10 ? "0" : ""}${s}`;
  }
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

function timeAgo(dateString: string): string {
  const past = new Date(dateString).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - past) / 1000));
  if (diffSec < 45) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function getInitials(name: string): string {
  if (!name) return "S";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function VideoChatSection({
  courseId,
  lessonId,
  lessonTitle,
  currentPlaySeconds = 0,
  onSeekTo,
  onOpenDoubtSolver,
}: VideoChatSectionProps) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const fetchMessages = useServerFn(fetchVideoChatMessagesServer);
  const sendMessage = useServerFn(sendVideoChatMessageServer);
  const reactMessage = useServerFn(reactToVideoChatMessageServer);
  const deleteMessage = useServerFn(deleteVideoChatMessageServer);

  const [filter, setFilter] = useState<"all" | "questions">("all");
  const [inputText, setInputText] = useState("");
  const [isQuestion, setIsQuestion] = useState(false);
  const [attachTimestamp, setAttachTimestamp] = useState(false);
  const [taggedTime, setTaggedTime] = useState<number | null>(null);

  // Guest name fallback if not logged in
  const [guestName, setGuestName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dharam_chat_guest_name") || "";
    }
    return "";
  });

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Real-time polling every 4 seconds for live classroom discussion
  const { data, isLoading } = useQuery({
    queryKey: ["videoChat", courseId, lessonId],
    queryFn: () => fetchMessages({ data: { courseId, lessonId } }),
    refetchInterval: 4000,
  });

  const messages: VideoChatMessage[] = useMemo(() => {
    if (data?.status === "ok" && Array.isArray(data.messages)) {
      return data.messages;
    }
    return [];
  }, [data]);

  const currentUserId = user?.id || (guestName ? `guest_${guestName}` : "guest_viewer");
  const currentUserName = user?.name || guestName || "Student";
  const currentUserRole = isAdmin ? "admin" : "student";

  // When attach timestamp is toggled, capture current playhead time
  const handleToggleTimestamp = () => {
    if (attachTimestamp) {
      setAttachTimestamp(false);
      setTaggedTime(null);
    } else {
      setAttachTimestamp(true);
      setTaggedTime(Math.floor(currentPlaySeconds));
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Post message mutation
  const sendMutation = useMutation({
    mutationFn: async (textToSend: string) => {
      if (!textToSend.trim()) return;

      const res = await sendMessage({
        data: {
          courseId,
          lessonId,
          userId: currentUserId,
          userName: currentUserName,
          userRole: currentUserRole,
          text: textToSend.trim(),
          isQuestion,
          timestampSeconds: attachTimestamp && taggedTime !== null ? taggedTime : null,
        },
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to post message");
      }
      return res.message;
    },
    onSuccess: () => {
      setInputText("");
      setIsQuestion(false);
      setAttachTimestamp(false);
      setTaggedTime(null);
      queryClient.invalidateQueries({ queryKey: ["videoChat", courseId, lessonId] });
      setTimeout(scrollToBottom, 150);
    },
  });

  // Reaction mutation
  const reactionMutation = useMutation({
    mutationFn: async ({ messageId, reaction }: { messageId: string; reaction: string }) => {
      const res = await reactMessage({
        data: {
          courseId,
          lessonId,
          messageId,
          userId: currentUserId,
          reaction,
        },
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videoChat", courseId, lessonId] });
    },
  });

  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await deleteMessage({
        data: {
          courseId,
          lessonId,
          messageId,
          userId: currentUserId,
          isAdmin,
        },
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videoChat", courseId, lessonId] });
    },
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sendMutation.isPending) return;

    if (!user && !guestName.trim()) {
      const prompted = prompt("Please enter your name for class discussion:", "Student");
      if (!prompted) return;
      setGuestName(prompted.trim());
      localStorage.setItem("dharam_chat_guest_name", prompted.trim());
    }

    sendMutation.mutate(inputText);
  };

  const filteredMessages = useMemo(() => {
    if (filter === "questions") {
      return messages.filter((m) => m.isQuestion);
    }
    return messages;
  }, [messages, filter]);

  const questionCount = useMemo(() => {
    return messages.filter((m) => m.isQuestion).length;
  }, [messages]);

  const quickPrompts = [
    "Understood this concept! 👍",
    "Can you clarify the formula at this timestamp?",
    "Very helpful lecture sir!",
    "Where can I find additional practice questions?",
  ];

  return (
    <div className="flex flex-col rounded-2xl bg-card ring-1 ring-border shadow-xs overflow-hidden">
      {/* Top Chat Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-foreground">Lecture Live Chat</h3>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {messages.length} {messages.length === 1 ? "student comment" : "student comments"}
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              filter === "all"
                ? "bg-foreground text-background shadow-xs font-semibold"
                : "bg-muted/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({messages.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("questions")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition ${
              filter === "questions"
                ? "bg-amber-500 text-white shadow-xs font-semibold"
                : "bg-muted/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            <HelpCircle className="size-3" />
            <span>Doubts ({questionCount})</span>
          </button>
        </div>
      </div>

      {/* Optional AI Doubt Assistant shortcut */}
      {onOpenDoubtSolver && (
        <div className="flex items-center justify-between border-b border-border/60 bg-amber-500/5 px-4 py-2 text-xs">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
            <Sparkles className="size-3.5" />
            <span className="text-[11px] font-medium">Have an instant question?</span>
          </div>
          <button
            type="button"
            onClick={onOpenDoubtSolver}
            className="press text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
          >
            Ask AI Tutor →
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        className="flex max-h-[380px] min-h-[220px] flex-col gap-3 overflow-y-auto p-4"
      >
        {isLoading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
            <span className="text-xs">Connecting to lecture discussion...</span>
          </div>
        ) : null}

        {!isLoading && filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <MessageSquare className="size-8 stroke-1 text-muted-foreground/50 mb-2" />
            <p className="text-xs font-semibold text-foreground">
              {filter === "questions" ? "No questions asked yet" : "Be the first to say hello!"}
            </p>
            <p className="mt-1 text-[11px] max-w-xs">
              {filter === "questions"
                ? "Have a doubt about this lecture? Check 'Ask as Question' below to highlight your question."
                : "Share your thoughts, ask questions, or discuss key exam formulas with classmates."}
            </p>
          </div>
        ) : null}

        {filteredMessages.map((msg) => {
          const isOwn = msg.userId === currentUserId;
          const isInstructor = msg.userRole === "instructor";
          const isAdminUser = msg.userRole === "admin";
          const hasTimestamp = typeof msg.timestampSeconds === "number";

          return (
            <div
              key={msg.id}
              className={`group flex gap-2.5 transition-all ${
                isOwn ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* User Avatar */}
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold shadow-xs ${
                  isInstructor
                    ? "bg-amber-500 text-white ring-2 ring-amber-300 dark:ring-amber-700"
                    : isAdminUser
                      ? "bg-purple-600 text-white"
                      : isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground ring-1 ring-border"
                }`}
              >
                {isInstructor ? (
                  <GraduationCap className="size-4" />
                ) : isAdminUser ? (
                  <ShieldCheck className="size-4" />
                ) : (
                  getInitials(msg.userName)
                )}
              </div>

              {/* Message Bubble Container */}
              <div
                className={`flex flex-col max-w-[85%] ${
                  isOwn ? "items-end text-right" : "items-start text-left"
                }`}
              >
                {/* Name & Role Header */}
                <div className="flex items-center gap-1.5 px-1 pb-1 text-[11px]">
                  <span className="font-semibold text-foreground">{msg.userName}</span>
                  {isInstructor && (
                    <span className="rounded-sm bg-amber-500/15 px-1 py-0.2 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                      Faculty
                    </span>
                  )}
                  {isAdminUser && (
                    <span className="rounded-sm bg-purple-500/15 px-1 py-0.2 text-[9px] font-bold text-purple-700 dark:text-purple-300">
                      Admin
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    · {timeAgo(msg.createdAt)}
                  </span>
                </div>

                {/* Bubble Body */}
                <div
                  className={`relative rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                    msg.isQuestion
                      ? "bg-amber-500/10 text-foreground ring-1 ring-amber-500/30"
                      : isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/70 text-foreground ring-1 ring-border/60"
                  }`}
                >
                  {/* Question Tag */}
                  {msg.isQuestion && (
                    <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      <HelpCircle className="size-3" />
                      <span>Student Question</span>
                    </div>
                  )}

                  {/* Clickable Video Timestamp Chip */}
                  {hasTimestamp && (
                    <button
                      type="button"
                      onClick={() => onSeekTo && onSeekTo(msg.timestampSeconds!)}
                      title={`Seek lecture to ${formatTimestamp(msg.timestampSeconds!)}`}
                      className={`mb-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition ${
                        isOwn
                          ? "bg-background/20 text-primary-foreground hover:bg-background/30"
                          : "bg-primary/15 text-primary hover:bg-primary/25"
                      }`}
                    >
                      <Clock className="size-2.5" />
                      <span>▶ {formatTimestamp(msg.timestampSeconds!)}</span>
                    </button>
                  )}

                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                </div>

                {/* Reaction and Action Bar */}
                <div className="mt-1 flex items-center gap-1.5 px-1">
                  {/* Reactions chips */}
                  {Object.entries(REACTION_ICONS).map(([emoji]) => {
                    const userList = msg.reactions?.[emoji] ?? [];
                    const count = userList.length;
                    const hasReacted = userList.includes(currentUserId);

                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() =>
                          reactionMutation.mutate({ messageId: msg.id, reaction: emoji })
                        }
                        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] transition ${
                          hasReacted
                            ? "bg-primary/15 font-bold text-primary ring-1 ring-primary/30"
                            : count > 0
                              ? "bg-muted/60 text-muted-foreground hover:bg-muted"
                              : "opacity-0 group-hover:opacity-60 hover:opacity-100"
                        }`}
                        title={`React with ${emoji}`}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span>{count}</span>}
                      </button>
                    );
                  })}

                  {/* Delete button (for author or admin) */}
                  {(isOwn || isAdmin) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Delete this message?")) {
                          deleteMutation.mutate(msg.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-70 hover:opacity-100 text-muted-foreground hover:text-destructive p-0.5 transition"
                      title="Delete message"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Prompts Carousel if no text typed */}
      {!inputText && (
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-border/50 bg-muted/20 px-3 py-2 no-scrollbar">
          <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
            Quick say:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(prompt);
                inputRef.current?.focus();
              }}
              className="press shrink-0 rounded-full border border-border/70 bg-card px-2.5 py-1 text-[10px] text-muted-foreground hover:border-primary/50 hover:text-foreground transition whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="border-t border-border bg-card p-3 flex flex-col gap-2"
      >
        {/* Timestamp & Question Control Row */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            {/* Timestamp tag button */}
            <button
              type="button"
              onClick={handleToggleTimestamp}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                attachTimestamp
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="size-3" />
              <span>
                {attachTimestamp && taggedTime !== null
                  ? `Tagged at ${formatTimestamp(taggedTime)}`
                  : `Tag Time (${formatTimestamp(currentPlaySeconds)})`}
              </span>
            </button>

            {/* Question toggle */}
            <button
              type="button"
              onClick={() => setIsQuestion(!isQuestion)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                isQuestion
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <HelpCircle className="size-3" />
              <span>Ask Doubt</span>
            </button>
          </div>

          {/* Guest name badge/edit if not signed in */}
          {!user && (
            <button
              type="button"
              onClick={() => {
                const name = prompt("Enter your display name:", guestName || "Student");
                if (name) {
                  setGuestName(name.trim());
                  localStorage.setItem("dharam_chat_guest_name", name.trim());
                }
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground underline truncate max-w-[120px]"
              title="Click to edit your display name"
            >
              Chatting as {guestName || "Guest"}
            </button>
          )}
        </div>

        {/* Input Text Box and Send Button */}
        <div className="relative flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isQuestion
                ? "Ask your doubt regarding this lecture..."
                : "Type your comment or discussion..."
            }
            maxLength={1000}
            className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary shadow-xs"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || sendMutation.isPending}
            className="press flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background disabled:opacity-40 disabled:pointer-events-none transition hover:opacity-90 shadow-xs"
            title="Send comment"
          >
            {sendMutation.isPending ? (
              <div className="size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
