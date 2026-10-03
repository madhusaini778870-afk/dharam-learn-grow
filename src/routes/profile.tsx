import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { updateProfileServer } from "@/services/authService";
import { studentStore } from "@/services/studentStore";
import { gamificationStore } from "@/services/gamificationStore";
import { AppRatingCard } from "@/components/AppRatingCard";
import { Screen, Footer, PageHeader, ChevronRight } from "@/components/app-shell";
import {
  User,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  Save,
  LogIn,
  GraduationCap,
  Flame,
  Zap,
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Check,
  RefreshCw,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · Dharam Bhai Study" },
      {
        name: "description",
        content: "Your student profile, learning progress, account settings and sign out.",
      },
      { property: "og:title", content: "Profile · Dharam Bhai Study" },
      {
        property: "og:description",
        content: "Your student profile, account settings and sign out.",
      },
    ],
  }),
  component: ProfileScreen,
});

// Curated student avatars for quick 1-click selection
const AVATAR_PRESETS = [
  {
    id: "scholar-1",
    label: "Scholar Pro",
    tag: "IIT Aspirant",
    url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80",
  },
  {
    id: "scholar-2",
    label: "Star Scholar",
    tag: "NEET Topper",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80",
  },
  {
    id: "scholar-3",
    label: "Physics Wiz",
    tag: "Science Aspirant",
    url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=240&auto=format&fit=crop&q=80",
  },
  {
    id: "scholar-4",
    label: "Med Ace",
    tag: "Future Doctor",
    url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=240&auto=format&fit=crop&q=80",
  },
  {
    id: "scholar-5",
    label: "Math Prodigy",
    tag: "Problem Solver",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80",
  },
  {
    id: "scholar-6",
    label: "Focus Ninja",
    tag: "Deep Study",
    url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&auto=format&fit=crop&q=80",
  },
  {
    id: "scholar-7",
    label: "Tech Topper",
    tag: "JEE Ranker",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&auto=format&fit=crop&q=80",
  },
  {
    id: "scholar-8",
    label: "Creative Mind",
    tag: "Rank 1 Aim",
    url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=240&auto=format&fit=crop&q=80",
  },
];

// Helper to downscale and crop image into square data URI (<45KB)
async function resizeAndCompressImage(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, maxSize, maxSize);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function ProfileScreen() {
  const { session, loading, user, token, signOut, refreshSession } = useAuth();
  const navigate = useNavigate();
  const updateProfile = useServerFn(updateProfileServer);

  const [name, setName] = useState("");
  const [targetExam, setTargetExam] = useState("JEE 2026");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Profile Picture Section states
  const [showPhotoSection, setShowPhotoSection] = useState(false);
  const [activeAvatarTab, setActiveAvatarTab] = useState<"presets" | "upload" | "url">("presets");
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [fileProcessing, setFileProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Safe SSR initial state
  const [stats, setStats] = useState({
    enrolledCount: 0,
    completedLessonsCount: 0,
    totalProgressPercent: 0,
  });
  const [gamification, setGamification] = useState({
    xp: 0,
    streak: { currentStreak: 0, bestStreak: 0, lastStudyDate: null },
  });

  useEffect(() => {
    // Sync client stats after mount to prevent hydration mismatch
    setStats(studentStore.getStats());
    setGamification(gamificationStore.getState());
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setTargetExam(user.targetExam || "JEE 2026");
      setAvatarUrl(user.avatarUrl || "");
      setStats(studentStore.getStats());
      setGamification(gamificationStore.getState());
    }
  }, [user]);

  useEffect(() => {
    const handleUpdate = () => {
      setStats(studentStore.getStats());
      setGamification(gamificationStore.getState());
    };
    window.addEventListener("dharam_enrollments_updated", handleUpdate);
    window.addEventListener("dharam_progress_updated", handleUpdate);
    window.addEventListener("dharam_gamification_updated", handleUpdate);
    return () => {
      window.removeEventListener("dharam_enrollments_updated", handleUpdate);
      window.removeEventListener("dharam_progress_updated", handleUpdate);
      window.removeEventListener("dharam_gamification_updated", handleUpdate);
    };
  }, []);

  // Save full profile changes or avatar changes
  async function handleSave(newAvatar?: string) {
    if (!token || !name.trim()) return;
    setSaving(true);
    setNotice(null);

    const finalAvatar = newAvatar !== undefined ? newAvatar : avatarUrl;

    try {
      const res = await updateProfile({
        data: {
          token,
          name: name.trim(),
          targetExam,
          avatarUrl: finalAvatar.trim() || undefined,
        },
      });

      if (res.success) {
        setNotice("Profile updated successfully!");
        await refreshSession();
        window.dispatchEvent(new CustomEvent("dharam_gamification_updated"));
        setTimeout(() => setNotice(null), 3000);
      } else {
        setNotice(res.error || "Failed to update profile.");
      }
    } catch {
      setNotice("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  }

  // Handle local file upload
  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotice("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    setFileProcessing(true);
    try {
      const compressedDataUrl = await resizeAndCompressImage(file, 256);
      setAvatarUrl(compressedDataUrl);
      setNotice("Photo selected! Click 'Save Profile Picture' to apply.");
    } catch {
      setNotice("Failed to process image. Please try another photo.");
    } finally {
      setFileProcessing(false);
    }
  }

  // Handle custom image URL
  function handleApplyCustomUrl() {
    const cleanUrl = customUrlInput.trim();
    if (!cleanUrl) {
      setNotice("Please enter an image URL.");
      return;
    }
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      setNotice("URL must start with http:// or https://");
      return;
    }
    setAvatarUrl(cleanUrl);
    setCustomUrlInput("");
    setNotice("Image link loaded! Click 'Save Profile Picture' to apply.");
  }

  // Handle remove picture
  function handleRemoveAvatar() {
    setAvatarUrl("");
    handleSave("");
  }

  // If user is not logged in, show clean authentication requirement card
  if (!loading && !session) {
    return (
      <Screen>
        <PageHeader title="Profile" />
        <div className="mt-8 px-5">
          <div className="rounded-3xl bg-card p-6 text-center ring-1 ring-border shadow-sm">
            <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-muted text-muted-foreground">
              <User className="size-8" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold">Sign in required</h2>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
              Please sign in or create an account to view your student profile, enrolled batches,
              and learning history.
            </p>
            <Link
              to="/auth"
              search={{ redirect: "/profile" }}
              className="press mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md"
            >
              <LogIn className="size-4" />
              <span>Sign In / Create Account</span>
            </Link>
          </div>
        </div>
        <Footer />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="Student Profile" />

      <div className="mt-4 space-y-3.5 px-5 pb-8">
        {/* User Profile Card */}
        <div className="rounded-3xl bg-card p-4.5 ring-1 ring-border shadow-xs">
          <div className="flex items-center gap-3.5">
            {/* Avatar with Click-to-Edit Badge */}
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || "Student Profile"}
                  className="size-14 rounded-2xl object-cover ring-2 ring-primary/30 shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="grid size-14 place-items-center rounded-2xl bg-foreground font-display text-xl font-bold text-background shadow-xs">
                  {(name?.[0] ?? user?.email?.[0] ?? "S").toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowPhotoSection((prev) => !prev)}
                className="press absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow ring-2 ring-card hover:scale-105 transition"
                title="Change or add profile picture"
                aria-label="Add or change profile picture"
              >
                <Camera className="size-3.5" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-display text-lg font-bold leading-tight">
                  {name || "Student"}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    user?.role === "admin"
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {user?.role === "admin" ? "Admin" : "Student"}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground mt-0.5">{user?.email}</p>

              {/* Quick Profile Picture Action Link */}
              <button
                type="button"
                onClick={() => setShowPhotoSection((prev) => !prev)}
                className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <Camera className="size-3" />
                <span>{avatarUrl ? "Change Profile Picture" : "Add Profile Picture"}</span>
              </button>
            </div>
          </div>

          {/* Quick Learning & Gamification Stats */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-border pt-3">
            <div className="rounded-2xl bg-muted/40 p-2.5 text-center">
              <p className="text-base font-bold font-display">{stats.enrolledCount}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Enrolled</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-2.5 text-center">
              <p className="text-base font-bold font-display">{stats.completedLessonsCount}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Completed
              </p>
            </div>
            <div className="rounded-2xl bg-amber-500/10 p-2.5 text-center ring-1 ring-amber-500/20">
              <div className="flex items-center justify-center gap-1">
                <Flame className="size-3.5 text-amber-500 fill-amber-500" />
                <p className="text-base font-bold font-display text-amber-600 dark:text-amber-400">
                  {gamification.streak.currentStreak}d
                </p>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80">
                Streak
              </p>
            </div>
            <div className="rounded-2xl bg-yellow-500/10 p-2.5 text-center ring-1 ring-yellow-500/20">
              <div className="flex items-center justify-center gap-1">
                <Zap className="size-3.5 text-yellow-500 fill-yellow-500" />
                <p className="text-base font-bold font-display text-yellow-600 dark:text-yellow-400">
                  {gamification.xp}
                </p>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-yellow-600/80 dark:text-yellow-400/80">
                Total XP
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ADD PROFILE PICTURE SECTION ("add profile picture add section") */}
        {/* ------------------------------------------------------------- */}
        <div className="rounded-3xl bg-card p-5 ring-1 ring-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Camera className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Student Profile Picture
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Add or customize your photo for batches and leaderboard
                </p>
              </div>
            </div>

            {avatarUrl ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                <Check className="size-3" />
                <span>Photo Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                No Photo Set
              </span>
            )}
          </div>

          {/* Interactive Live Avatar Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl bg-muted/30 p-3.5 ring-1 ring-border/60">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="size-20 rounded-2xl object-cover ring-2 ring-primary/40 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="grid size-20 place-items-center rounded-2xl bg-foreground font-display text-2xl font-bold text-background shadow-sm">
                  {(name?.[0] ?? user?.email?.[0] ?? "S").toUpperCase()}
                </div>
              )}
              {avatarUrl && (
                <div className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                  <Check className="size-3" />
                </div>
              )}
            </div>

            <div className="text-center sm:text-left min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground">
                {avatarUrl ? "Current Picture Preview" : "Default Student Monogram"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {avatarUrl
                  ? "Shown on your profile header, class comments, and the top ranker leaderboard."
                  : "Pick a student avatar below or upload your own picture from device gallery."}
              </p>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={saving}
                  className="press mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-destructive hover:underline"
                >
                  <Trash2 className="size-3" />
                  <span>Remove Picture</span>
                </button>
              )}
            </div>
          </div>

          {/* Method Switcher Tabs */}
          <div className="flex rounded-xl bg-muted p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveAvatarTab("presets")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                activeAvatarTab === "presets"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Avatars</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAvatarTab("upload")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                activeAvatarTab === "upload"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="size-3.5 text-primary" />
              <span>Upload Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAvatarTab("url")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                activeAvatarTab === "url"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ImageIcon className="size-3.5 text-sky-500" />
              <span>Image Link</span>
            </button>
          </div>

          {/* Tab 1: Student Avatar Presets */}
          {activeAvatarTab === "presets" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Choose an Aspirant Avatar:
                </span>
                <span className="text-[10px] text-muted-foreground">1-Tap to select</span>
              </div>

              <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-4">
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = avatarUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      className={`press group relative flex flex-col items-center rounded-2xl p-2 transition text-center ${
                        isSelected
                          ? "bg-primary/10 ring-2 ring-primary"
                          : "bg-muted/40 hover:bg-muted/80 ring-1 ring-border"
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="size-11 rounded-xl object-cover shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                            <Check className="size-2.5" />
                          </div>
                        )}
                      </div>
                      <span className="mt-1.5 truncate text-[10px] font-semibold text-foreground max-w-full">
                        {preset.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground truncate max-w-full">
                        {preset.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Upload from Device */}
          {activeAvatarTab === "upload" && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelected}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-border hover:border-primary/60 bg-muted/20 p-5 text-center transition hover:bg-muted/40"
              >
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {fileProcessing ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : (
                    <Upload className="size-6" />
                  )}
                </div>
                <p className="mt-2 text-xs font-semibold text-foreground">
                  {fileProcessing ? "Optimizing photo..." : "Click to select a photo from device"}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Supports JPG, PNG, WEBP. Automatically centered &amp; cropped.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Paste Image URL */}
          {activeAvatarTab === "url" && (
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-muted-foreground">
                Paste Direct Web Image URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/my-photo.jpg"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="flex-1 rounded-xl bg-background px-3 py-2 text-xs outline-none ring-1 ring-border font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  className="press rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-xs"
                >
                  Load
                </button>
              </div>
            </div>
          )}

          {/* Save Profile Picture Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving || fileProcessing}
              className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow-xs transition hover:opacity-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Saving Profile Picture...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>Save Profile Picture</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Account Details Form */}
        <div className="rounded-3xl bg-card p-5 ring-1 ring-border shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Account Settings
          </p>

          <label className="mt-3 block">
            <span className="text-[11px] font-medium text-muted-foreground">Display Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-background px-3.5 py-2.5 text-sm outline-none ring-1 ring-border"
              placeholder="Your name"
            />
          </label>

          <label className="mt-3 block">
            <span className="text-[11px] font-medium text-muted-foreground">Target Exam</span>
            <select
              value={targetExam}
              onChange={(e) => setTargetExam(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-background px-3.5 py-2.5 text-sm outline-none ring-1 ring-border"
            >
              <option value="JEE 2026">JEE 2026</option>
              <option value="NEET 2026">NEET 2026</option>
              <option value="Class 12 Boards">Class 12 Boards</option>
              <option value="Class 11 Foundation">Class 11 Foundation</option>
              <option value="Class 10 Boards">Class 10 Boards</option>
              <option value="Class 9 Foundation">Class 9 Foundation</option>
            </select>
          </label>

          {notice && (
            <p className="mt-3 rounded-xl bg-primary/10 p-2.5 text-center text-xs font-medium text-primary">
              {notice}
            </p>
          )}

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="press mt-3.5 flex items-center justify-center gap-1.5 rounded-2xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background shadow-xs disabled:opacity-60"
          >
            <Save className="size-3.5" />
            <span>{saving ? "Saving…" : "Save Account Settings"}</span>
          </button>
        </div>

        {/* Navigation Links */}
        <Link
          to="/my-learning"
          className="press flex items-center gap-3 rounded-3xl bg-card p-4 ring-1 ring-border shadow-xs"
        >
          <GraduationCap className="size-5 text-primary" />
          <div className="flex-1">
            <span className="text-sm font-semibold">My Courses &amp; Progress</span>
            <p className="text-[11px] text-muted-foreground">View all your enrolled batches</p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>

        {(user?.role === "admin" ||
          user?.email?.toLowerCase() === "madhusaini778870@gmail.com") && (
          <Link
            to="/admin"
            className="press flex items-center gap-3 rounded-3xl bg-amber-500/10 p-4 ring-1 ring-amber-500/20 shadow-xs"
          >
            <ShieldCheck className="size-5 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Admin Control Portal
              </span>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                Manage courses, users, lectures &amp; settings
              </p>
            </div>
            <ChevronRight className="size-5 text-amber-600" />
          </Link>
        )}

        {/* App Rating & Feedback Section */}
        <AppRatingCard />

        {/* Log Out */}
        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate({ to: "/auth", replace: true });
          }}
          className="press flex w-full items-center justify-center gap-2 rounded-3xl bg-card p-4 text-sm font-semibold text-destructive ring-1 ring-border shadow-xs transition hover:bg-destructive/5"
        >
          <LogOut className="size-4" />
          <span>Log Out</span>
        </button>
      </div>

      <Footer />
    </Screen>
  );
}
