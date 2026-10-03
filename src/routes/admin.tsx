import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import {
  verifyAdminKeyServer,
  adminLoginServer,
  getAdminConfigServer,
  updateAdminSettingsServer,
  saveCustomCourseServer,
  deleteCustomCourseServer,
  saveCustomLectureServer,
  deleteCustomLectureServer,
  saveCustomNoteServer,
  deleteCustomNoteServer,
  saveCustomBookServer,
  deleteCustomBookServer,
  uploadBookFileServer,
  toggleCourseStatusServer,
  addAnnouncementServer,
  deleteAnnouncementServer,
  type AdminConfig,
  type AdminBook,
} from "@/services/adminService";
import {
  ShieldAlert,
  ShieldCheck,
  Settings,
  BookOpen,
  BookMarked,
  Video,
  FileText,
  FileUp,
  EyeOff,
  Bell,
  LogOut,
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Save,
  Upload,
  FileCheck,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal · Dharam Bhai Study" },
      { name: "description", content: "Administrator controls for Dharam Bhai Study." },
    ],
  }),
  component: AdminPortalScreen,
});

function AdminPortalScreen() {
  const { user } = useAuth();
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem("dharam_admin_token");
    } catch {
      return null;
    }
  });

  const [loginMode, setLoginMode] = useState<"email" | "passcode">("email");
  const [adminEmail, setAdminEmail] = useState("madhusaini778870@gmail.com");
  const [adminPassword, setAdminPassword] = useState("");
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [activeTab, setActiveTab] = useState<
    "settings" | "courses" | "lectures" | "notes" | "books" | "visibility" | "announcements"
  >("settings");
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Server functions
  const verifyAdmin = useServerFn(verifyAdminKeyServer);
  const adminLogin = useServerFn(adminLoginServer);
  const fetchConfig = useServerFn(getAdminConfigServer);
  const updateSettings = useServerFn(updateAdminSettingsServer);
  const saveCourse = useServerFn(saveCustomCourseServer);
  const deleteCourse = useServerFn(deleteCustomCourseServer);
  const saveLecture = useServerFn(saveCustomLectureServer);
  const deleteLecture = useServerFn(deleteCustomLectureServer);
  const saveNote = useServerFn(saveCustomNoteServer);
  const deleteNote = useServerFn(deleteCustomNoteServer);
  const saveBook = useServerFn(saveCustomBookServer);
  const deleteBook = useServerFn(deleteCustomBookServer);
  const uploadBookFile = useServerFn(uploadBookFileServer);
  const toggleCourse = useServerFn(toggleCourseStatusServer);
  const addAnnouncement = useServerFn(addAnnouncementServer);
  const deleteAnnouncement = useServerFn(deleteAnnouncementServer);

  const showNotification = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const loadData = useCallback(
    async (token: string) => {
      try {
        const res = await fetchConfig({ data: { adminToken: token } });
        if (res.status === "ok" && res.config) {
          setConfig(res.config);
        } else {
          setAdminToken(null);
          sessionStorage.removeItem("dharam_admin_token");
        }
      } catch {
        setAdminToken(null);
        sessionStorage.removeItem("dharam_admin_token");
      }
    },
    [fetchConfig],
  );

  useEffect(() => {
    if (adminToken) {
      loadData(adminToken);
    }
  }, [adminToken, loadData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoadingAuth(true);
    try {
      if (loginMode === "email") {
        const res = await adminLogin({
          data: { email: adminEmail, password: adminPassword },
        });
        if (res.success && res.token) {
          setAdminToken(res.token);
          sessionStorage.setItem("dharam_admin_token", res.token);
          await loadData(res.token);
        } else {
          setAuthError(res.error || "Invalid admin email or password.");
        }
      } else {
        const res = await verifyAdmin({ data: { passcode } });
        if (res.status === "ok" && res.token) {
          setAdminToken(res.token);
          sessionStorage.setItem("dharam_admin_token", res.token);
          await loadData(res.token);
        } else {
          setAuthError(res.message || "Invalid admin passcode.");
        }
      }
    } catch {
      setAuthError("Failed to authenticate. Check server connection.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleQuickUnlock = async () => {
    setAuthError(null);
    setLoadingAuth(true);
    try {
      const res = await adminLogin({
        data: { email: "madhusaini778870@gmail.com", password: "lakshya4455@7788" },
      });
      if (res.success && res.token) {
        setAdminToken(res.token);
        sessionStorage.setItem("dharam_admin_token", res.token);
        await loadData(res.token);
      } else {
        setAuthError(res.error || "Could not auto-authenticate.");
      }
    } catch {
      setAuthError("Failed to auto-authenticate.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    setAdminToken(null);
    sessionStorage.removeItem("dharam_admin_token");
    setConfig(null);
  };

  // --- TAB 1: Settings Form State ---
  const [settingsForm, setSettingsForm] = useState({
    primarySourceUrl: "",
    secondarySourceUrl: "",
    videoCdnSourceUrl: "https://pw.gemtara.in/",
    whatsappChannelUrl: "",
    sourceListFn: "",
    allowGuestDownloads: true,
  });

  useEffect(() => {
    if (config) {
      setSettingsForm({
        primarySourceUrl: config.settings.primarySourceUrl,
        secondarySourceUrl: config.settings.secondarySourceUrl,
        videoCdnSourceUrl: config.settings.videoCdnSourceUrl || "https://pw.gemtara.in/",
        whatsappChannelUrl: config.settings.whatsappChannelUrl,
        sourceListFn: config.settings.sourceListFn,
        allowGuestDownloads: config.settings.allowGuestDownloads,
      });
    }
  }, [config]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    try {
      const res = await updateSettings({
        data: {
          adminToken,
          settings: settingsForm,
        },
      });
      if (res.status === "ok" && res.config) {
        setConfig(res.config);
        showNotification("Settings updated successfully!");
      }
    } catch (err: unknown) {
      alert("Error saving settings: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // --- TAB 2: Custom Course Form ---
  const [courseForm, setCourseForm] = useState({
    title: "",
    category: "JEE" as "JEE" | "NEET" | "Foundation",
    className: "Class 12",
    exam: "JEE Main & Advanced",
    thumbnail: "",
    description: "",
    subjects: "Physics, Chemistry, Mathematics",
  });

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !courseForm.title) return;
    const subjectsArray = courseForm.subjects
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const subjectRefs = subjectsArray.map((name, i) => ({
      id: `sub-${Date.now()}-${i}`,
      name,
      lectureCount: 0,
      teachers: ["Dharam Bhai Faculty"],
    }));

    try {
      const res = await saveCourse({
        data: {
          adminToken,
          course: {
            id: `custom-${Date.now()}`,
            title: courseForm.title,
            category: courseForm.category,
            className: courseForm.className,
            exam: courseForm.exam,
            thumbnail: courseForm.thumbnail || null,
            description: courseForm.description || null,
            subjects: subjectsArray,
            subjectRefs,
            enabled: true,
          },
        },
      });
      if (res.status === "ok" && res.config) {
        setConfig(res.config);
        setCourseForm({
          title: "",
          category: "JEE",
          className: "Class 12",
          exam: "JEE Main & Advanced",
          thumbnail: "",
          description: "",
          subjects: "Physics, Chemistry, Mathematics",
        });
        showNotification("Course added successfully!");
      }
    } catch (err: unknown) {
      alert("Error adding course: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!adminToken || !confirm("Delete this custom course?")) return;
    const res = await deleteCourse({ data: { adminToken, courseId } });
    if (res.status === "ok" && res.config) {
      setConfig(res.config);
      showNotification("Course deleted.");
    }
  };

  // --- TAB 3: Custom Lecture Form ---
  const [lectureForm, setLectureForm] = useState({
    courseId: "",
    subjectId: "",
    chapterId: "",
    title: "",
    videoUrl: "",
    notesUrl: "",
    durationSeconds: 3600,
  });

  const handleAddLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !lectureForm.title || !lectureForm.videoUrl) return;
    const targetCourse = lectureForm.courseId || config?.customCourses[0]?.id || "default";
    const targetSubject = lectureForm.subjectId || "sub-default";
    const targetChapter = lectureForm.chapterId || "chap-default";

    try {
      const res = await saveLecture({
        data: {
          adminToken,
          lecture: {
            id: `lec-${Date.now()}`,
            courseId: targetCourse,
            subjectId: targetSubject,
            chapterId: targetChapter,
            title: lectureForm.title,
            videoUrl: lectureForm.videoUrl,
            notesUrl: lectureForm.notesUrl || null,
            durationSeconds: Number(lectureForm.durationSeconds) || null,
          },
        },
      });
      if (res.status === "ok" && res.config) {
        setConfig(res.config);
        setLectureForm({
          courseId: "",
          subjectId: "",
          chapterId: "",
          title: "",
          videoUrl: "",
          notesUrl: "",
          durationSeconds: 3600,
        });
        showNotification("Lecture published successfully!");
      }
    } catch (err: unknown) {
      alert("Error adding lecture: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeleteLecture = async (lectureId: string) => {
    if (!adminToken || !confirm("Delete this lecture?")) return;
    const res = await deleteLecture({ data: { adminToken, lectureId } });
    if (res.status === "ok" && res.config) {
      setConfig(res.config);
      showNotification("Lecture deleted.");
    }
  };

  // --- TAB 4: Custom Notes Form ---
  const [noteForm, setNoteForm] = useState({
    courseId: "",
    subjectId: "",
    chapterId: "",
    title: "",
    url: "",
  });

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !noteForm.title || !noteForm.url) return;
    try {
      const res = await saveNote({
        data: {
          adminToken,
          note: {
            id: `note-${Date.now()}`,
            courseId: noteForm.courseId || "default",
            subjectId: noteForm.subjectId || "sub-default",
            chapterId: noteForm.chapterId || "chap-default",
            title: noteForm.title,
            url: noteForm.url,
          },
        },
      });
      if (res.status === "ok" && res.config) {
        setConfig(res.config);
        setNoteForm({ courseId: "", subjectId: "", chapterId: "", title: "", url: "" });
        showNotification("Notes PDF added successfully!");
      }
    } catch (err: unknown) {
      alert("Error adding notes: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!adminToken || !confirm("Delete this note?")) return;
    const res = await deleteNote({ data: { adminToken, noteId } });
    if (res.status === "ok" && res.config) {
      setConfig(res.config);
      showNotification("Note deleted.");
    }
  };

  // --- TAB: Books & Files ("Admin portal me book add section jodo files se") ---
  const [bookForm, setBookForm] = useState({
    title: "",
    subject: "Physics",
    category: "JEE Main & Advanced",
    author: "Physics Wallah / PW",
    fileUrl: "",
    thumbnail: "",
    description: "",
  });
  const [selectedBookFile, setSelectedBookFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [uploadingBook, setUploadingBook] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedBookFile(file);
    if (!bookForm.title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setBookForm((prev) => ({ ...prev, title: cleanName }));
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !bookForm.title) return;

    if (!selectedBookFile && !bookForm.fileUrl) {
      alert("Please choose a file or enter a direct file link.");
      return;
    }

    setUploadingBook(true);
    setUploadMessage("Processing book file...");

    try {
      let finalFileUrl = bookForm.fileUrl;
      let finalFileName = selectedBookFile?.name || "study-material.pdf";
      let finalFileSize = selectedBookFile
        ? selectedBookFile.size > 1024 * 1024
          ? `${(selectedBookFile.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(selectedBookFile.size / 1024)} KB`
        : "Direct Link";

      if (selectedBookFile && fileBase64) {
        setUploadMessage("Uploading file to server storage...");
        const uploadRes = await uploadBookFile({
          data: {
            adminToken,
            fileName: selectedBookFile.name,
            fileBase64,
            mimeType: selectedBookFile.type || "application/pdf",
          },
        });
        if (uploadRes.status !== "ok" || !uploadRes.fileUrl) {
          throw new Error(uploadRes.message || "Failed to upload file to server.");
        }
        finalFileUrl = uploadRes.fileUrl;
        if (uploadRes.fileName) finalFileName = uploadRes.fileName;
        if (uploadRes.fileSize) finalFileSize = uploadRes.fileSize;
      }

      setUploadMessage("Saving book to library catalog...");
      const res = await saveBook({
        data: {
          adminToken,
          book: {
            id: `book-${Date.now()}`,
            title: bookForm.title,
            subject: bookForm.subject,
            category: bookForm.category,
            author: bookForm.author || "Physics Wallah",
            fileUrl: finalFileUrl,
            fileName: finalFileName,
            fileSize: finalFileSize,
            thumbnail: bookForm.thumbnail || null,
            description: bookForm.description || undefined,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      if (res.status === "ok" && res.config) {
        setConfig(res.config);
        setBookForm({
          title: "",
          subject: "Physics",
          category: "JEE Main & Advanced",
          author: "Physics Wallah / PW",
          fileUrl: "",
          thumbnail: "",
          description: "",
        });
        setSelectedBookFile(null);
        setFileBase64(null);
        showNotification("Book added successfully from file!");
      }
    } catch (err: unknown) {
      alert("Error adding book: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploadingBook(false);
      setUploadMessage(null);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!adminToken || !confirm("Are you sure you want to delete this book?")) return;
    try {
      const res = await deleteBook({ data: { adminToken, bookId } });
      if (res.status === "ok" && res.config) {
        setConfig(res.config);
        showNotification("Book deleted.");
      }
    } catch (err: unknown) {
      alert("Error deleting book: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // --- TAB 5: Visibility Toggle ---
  const [hideCourseId, setHideCourseId] = useState("");

  const handleToggleHide = async (idToToggle: string, disable: boolean) => {
    if (!adminToken || !idToToggle) return;
    try {
      const res = await toggleCourse({
        data: { adminToken, courseId: idToToggle.trim(), disable },
      });
      if (res.status === "ok" && res.config) {
        setConfig(res.config);
        setHideCourseId("");
        showNotification(disable ? "Course hidden from public list." : "Course re-enabled!");
      }
    } catch (err: unknown) {
      alert("Error toggling course: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // --- TAB 6: Announcements ---
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    type: "announcement" as "urgent" | "announcement" | "update",
  });

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !announcementForm.title) return;
    try {
      const res = await addAnnouncement({
        data: {
          adminToken,
          announcement: {
            id: `ann-${Date.now()}`,
            title: announcementForm.title,
            message: announcementForm.message,
            date: new Date().toISOString(),
            type: announcementForm.type,
          },
        },
      });
      if (res.status === "ok" && res.config) {
        setConfig(res.config);
        setAnnouncementForm({ title: "", message: "", type: "announcement" });
        showNotification("Announcement posted!");
      }
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!adminToken || !confirm("Delete this announcement?")) return;
    const res = await deleteAnnouncement({ data: { adminToken, announcementId } });
    if (res.status === "ok" && res.config) {
      setConfig(res.config);
      showNotification("Announcement removed.");
    }
  };

  // -------------------------------------------------------------
  // Render Login Screen if not authenticated
  // -------------------------------------------------------------
  if (!adminToken || !config) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col justify-center bg-background px-5 py-12 text-foreground">
        <div className="w-full rounded-3xl bg-card p-6 ring-1 ring-border shadow-md text-center">
          <div className="relative mx-auto size-16">
            <img
              src="/app-logo.png"
              alt="Dharam Bhai Study Logo"
              className="size-16 rounded-full object-cover ring-2 ring-amber-500/30 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
              <ShieldAlert className="size-3.5" />
            </div>
          </div>

          <h1 className="mt-4 font-display text-xl font-bold">Admin Portal</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Dharam Bhai Study &middot; By Lakshya Prince
          </p>

          {/* Quick 1-click unlock if signed in as admin or user is madhusaini778870@gmail.com */}
          {user?.email?.toLowerCase() === "madhusaini778870@gmail.com" || user?.role === "admin" ? (
            <div className="mt-5 rounded-2xl bg-amber-500/10 p-3.5 ring-1 ring-amber-500/30 text-left">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                Logged in as {user.name} ({user.email})
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Administrator permissions detected for this account.
              </p>
              <button
                type="button"
                onClick={handleQuickUnlock}
                disabled={loadingAuth}
                className="press mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-600 transition disabled:opacity-50"
              >
                <ShieldCheck className="size-4" />
                <span>{loadingAuth ? "Unlocking..." : "One-Click Admin Login"}</span>
              </button>
            </div>
          ) : null}

          {/* Mode Switcher */}
          <div className="mt-5 flex rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setLoginMode("email");
                setAuthError(null);
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                loginMode === "email"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Email &amp; Password
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode("passcode");
                setAuthError(null);
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                loginMode === "passcode"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Passcode
            </button>
          </div>

          <form onSubmit={handleLogin} className="mt-5 space-y-3.5 text-left">
            {loginMode === "email" ? (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="madhusaini778870@gmail.com"
                    className="mt-1 w-full rounded-2xl bg-background px-4 py-2.5 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Admin Password
                    </label>
                  </div>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password..."
                    className="mt-1 w-full rounded-2xl bg-background px-4 py-2.5 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Default admin:{" "}
                    <span className="font-mono font-medium">madhusaini778870@gmail.com</span>
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Admin Passcode / Key
                </label>
                <input
                  type="password"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter secret passcode..."
                  className="mt-1.5 w-full rounded-2xl bg-background px-4 py-3 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  Or enter your admin password here directly.
                </p>
              </div>
            )}

            {authError ? (
              <div className="rounded-xl bg-destructive/10 p-2.5 text-xs text-destructive">
                {authError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loadingAuth}
              className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow transition hover:opacity-90 disabled:opacity-50"
            >
              <ShieldCheck className="size-4" />
              <span>{loadingAuth ? "Verifying..." : "Enter Admin Portal"}</span>
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-4">
            <Link
              to="/home"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" />
              <span>Return to Student App</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // Render Authenticated Admin Dashboard
  // -------------------------------------------------------------
  return (
    <main className="mx-auto min-h-screen w-full max-w-[520px] bg-background text-foreground flex flex-col pb-24">
      {/* Admin Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/90 px-5 py-3.5 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <Link
            to="/home"
            className="text-muted-foreground hover:text-foreground"
            title="Back to App"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <img
            src="/app-logo.png"
            alt="Dharam Bhai Study"
            className="size-8 rounded-full object-cover ring-1 ring-border shadow-xs"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="font-display text-base font-bold leading-tight">Admin Dashboard</h1>
            <p className="text-[10px] text-muted-foreground">
              Dharam Bhai Study &middot; Master Controls
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="press flex items-center gap-1.5 rounded-xl bg-muted/60 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/15 transition"
        >
          <LogOut className="size-3.5" />
          <span>Exit</span>
        </button>
      </header>

      {/* Floating Status Notification */}
      {statusNotice ? (
        <div className="fixed top-14 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white shadow-lg animate-in fade-in duration-200">
          <CheckCircle2 className="size-3.5" />
          <span>{statusNotice}</span>
        </div>
      ) : null}

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-5 gap-2 px-5 pt-4">
        <div className="rounded-2xl bg-card p-2 text-center ring-1 ring-border">
          <p className="font-display text-base font-bold text-foreground">15k+</p>
          <p className="text-[9px] text-muted-foreground">PW Batches</p>
        </div>
        <div className="rounded-2xl bg-card p-2 text-center ring-1 ring-border">
          <p className="font-display text-base font-bold text-amber-600 dark:text-amber-400">
            {config.customCourses.length}
          </p>
          <p className="text-[9px] text-muted-foreground">Courses</p>
        </div>
        <div className="rounded-2xl bg-card p-2 text-center ring-1 ring-border">
          <p className="font-display text-base font-bold text-sky-600 dark:text-sky-400">
            {(config.customBooks || []).length}
          </p>
          <p className="text-[9px] text-muted-foreground">Books / Files</p>
        </div>
        <div className="rounded-2xl bg-card p-2 text-center ring-1 ring-border">
          <p className="font-display text-base font-bold text-foreground">
            {config.customLectures.length}
          </p>
          <p className="text-[9px] text-muted-foreground">Lectures</p>
        </div>
        <div className="rounded-2xl bg-card p-2 text-center ring-1 ring-border">
          <p className="font-display text-base font-bold text-destructive">
            {config.disabledCourseIds.length}
          </p>
          <p className="text-[9px] text-muted-foreground">Hidden</p>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="mt-4 flex overflow-x-auto no-scrollbar border-b border-border px-5 gap-1">
        {(
          [
            { id: "settings", label: "Settings", icon: Settings },
            { id: "courses", label: "Courses", icon: BookOpen },
            { id: "lectures", label: "Lectures", icon: Video },
            { id: "notes", label: "Notes", icon: FileText },
            { id: "books", label: "Books & Files", icon: BookMarked },
            { id: "visibility", label: "Visibility", icon: EyeOff },
            { id: "announcements", label: "Notices", icon: Bell },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
                active
                  ? "border-amber-500 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Areas */}
      <div className="p-5">
        {/* ----------------- TAB 1: Settings ----------------- */}
        {activeTab === "settings" && (
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="rounded-3xl bg-card p-5 ring-1 ring-border shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Upstream &amp; Channel Endpoints
              </h3>

              <div>
                <label className="text-xs font-medium">Primary Source Website</label>
                <input
                  type="text"
                  value={settingsForm.primarySourceUrl}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, primarySourceUrl: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium">Secondary Source Website</label>
                <input
                  type="text"
                  value={settingsForm.secondarySourceUrl}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, secondarySourceUrl: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium">Video Lecture CDN Source</label>
                <input
                  type="text"
                  value={settingsForm.videoCdnSourceUrl}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, videoCdnSourceUrl: e.target.value })
                  }
                  placeholder="https://pw.gemtara.in/"
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs font-mono ring-1 ring-border outline-none"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Primary high-speed source for course batch videos (pw.gemtara.in).
                </p>
              </div>

              <div>
                <label className="text-xs font-medium">WhatsApp Channel Follow URL</label>
                <input
                  type="text"
                  value={settingsForm.whatsappChannelUrl}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, whatsappChannelUrl: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium">Server Function Hash (Batches List)</label>
                <input
                  type="text"
                  value={settingsForm.sourceListFn}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, sourceListFn: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs font-mono ring-1 ring-border outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="allowDownloads"
                  checked={settingsForm.allowGuestDownloads}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, allowGuestDownloads: e.target.checked })
                  }
                  className="size-4 rounded accent-amber-500"
                />
                <label htmlFor="allowDownloads" className="text-xs font-medium cursor-pointer">
                  Allow open downloads for public notes &amp; documents
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow transition hover:opacity-90"
            >
              <Save className="size-4" />
              <span>Save System Settings</span>
            </button>
          </form>
        )}

        {/* ----------------- TAB 2: Courses ----------------- */}
        {activeTab === "courses" && (
          <div className="space-y-5">
            <form
              onSubmit={handleAddCourse}
              className="rounded-3xl bg-card p-5 ring-1 ring-border shadow-xs space-y-3"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Add Custom Course / Batch
              </h3>

              <div>
                <label className="text-xs font-medium">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lakshya JEE 2026 Batch"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium">Category</label>
                  <select
                    value={courseForm.category}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        category: e.target.value as "JEE" | "NEET" | "Foundation",
                      })
                    }
                    className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                  >
                    <option value="JEE">JEE</option>
                    <option value="NEET">NEET</option>
                    <option value="Foundation">Foundation</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Class</label>
                  <input
                    type="text"
                    value={courseForm.className}
                    onChange={(e) => setCourseForm({ ...courseForm, className: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">Thumbnail Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={courseForm.thumbnail}
                  onChange={(e) => setCourseForm({ ...courseForm, thumbnail: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium">Subjects (comma-separated)</label>
                <input
                  type="text"
                  value={courseForm.subjects}
                  onChange={(e) => setCourseForm({ ...courseForm, subjects: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium">Description</label>
                <textarea
                  rows={2}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                  placeholder="Detailed syllabus and batch information..."
                />
              </div>

              <button
                type="submit"
                className="press flex w-full items-center justify-center gap-1.5 rounded-xl bg-foreground py-2.5 text-xs font-semibold text-background transition hover:opacity-90"
              >
                <Plus className="size-4" />
                <span>Create Batch</span>
              </button>
            </form>

            {/* List of Custom Courses */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Existing Custom Courses ({config.customCourses.length})
              </h4>
              {config.customCourses.length === 0 ? (
                <p className="text-xs text-muted-foreground">No custom courses added yet.</p>
              ) : (
                config.customCourses.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-2xl bg-card p-3 ring-1 ring-border text-xs"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{c.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.category} &middot; {c.className} &middot; ID: {c.id}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteCourse(c.id)}
                      className="press flex size-7 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition"
                      title="Delete Course"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB 3: Lectures ----------------- */}
        {activeTab === "lectures" && (
          <div className="space-y-5">
            <form
              onSubmit={handleAddLecture}
              className="rounded-3xl bg-card p-5 ring-1 ring-border shadow-xs space-y-3"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Add Custom Lecture &amp; Video Stream
              </h3>

              <div>
                <label className="text-xs font-medium">Target Course</label>
                {config.customCourses.length > 0 ? (
                  <select
                    value={lectureForm.courseId}
                    onChange={(e) => setLectureForm({ ...lectureForm, courseId: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                  >
                    <option value="">Select custom course or enter manual ID...</option>
                    {config.customCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.id})
                      </option>
                    ))}
                  </select>
                ) : null}
                <input
                  type="text"
                  placeholder="Or enter specific Course ID..."
                  value={lectureForm.courseId}
                  onChange={(e) => setLectureForm({ ...lectureForm, courseId: e.target.value })}
                  className="mt-1.5 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium">Lecture Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lecture 01 : Kinematics in 1D"
                  value={lectureForm.title}
                  onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium">Video URL / Stream Link</label>
                <input
                  type="text"
                  required
                  placeholder="Direct Stream, HLS (.m3u8), DASH (.mpd), or MP4"
                  value={lectureForm.videoUrl}
                  onChange={(e) => setLectureForm({ ...lectureForm, videoUrl: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none font-mono"
                />
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1.5">
                  <p className="text-[10px] text-muted-foreground">
                    Supports Authorized Source Streams (pw.gemtara.in), HLS (.m3u8), and DASH
                    (.mpd).
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">
                  Accompanying Notes / PDF URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://...pdf"
                  value={lectureForm.notesUrl}
                  onChange={(e) => setLectureForm({ ...lectureForm, notesUrl: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                />
              </div>

              <button
                type="submit"
                className="press flex w-full items-center justify-center gap-1.5 rounded-xl bg-foreground py-2.5 text-xs font-semibold text-background transition hover:opacity-90"
              >
                <Plus className="size-4" />
                <span>Publish Lecture</span>
              </button>
            </form>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Published Custom Lectures ({config.customLectures.length})
              </h4>
              {config.customLectures.length === 0 ? (
                <p className="text-xs text-muted-foreground">No custom lectures added yet.</p>
              ) : (
                config.customLectures.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between rounded-2xl bg-card p-3 ring-1 ring-border text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-foreground truncate">{l.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate font-mono">
                        {l.videoUrl}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteLecture(l.id)}
                      className="press flex size-7 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition"
                      title="Delete Lecture"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB 4: Notes ----------------- */}
        {activeTab === "notes" && (
          <div className="space-y-5">
            <form
              onSubmit={handleAddNote}
              className="rounded-3xl bg-card p-5 ring-1 ring-border shadow-xs space-y-3"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Add Custom Notes / Document PDF
              </h3>

              <div>
                <label className="text-xs font-medium">Target Course ID</label>
                <input
                  type="text"
                  placeholder="e.g. source1:676e4dee1ec923bc192f38c9 or custom-..."
                  value={noteForm.courseId}
                  onChange={(e) => setNoteForm({ ...noteForm, courseId: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium">Document / Note Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 12 Electrostatics Complete Formula Sheet (PDF)"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium">Direct PDF / File URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://..."
                  value={noteForm.url}
                  onChange={(e) => setNoteForm({ ...noteForm, url: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                />
              </div>

              <button
                type="submit"
                className="press flex w-full items-center justify-center gap-1.5 rounded-xl bg-foreground py-2.5 text-xs font-semibold text-background transition hover:opacity-90"
              >
                <Plus className="size-4" />
                <span>Add Note</span>
              </button>
            </form>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Custom Notes Published ({config.customNotes.length})
              </h4>
              {config.customNotes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No custom notes added yet.</p>
              ) : (
                config.customNotes.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-center justify-between rounded-2xl bg-card p-3 ring-1 ring-border text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-foreground truncate">{n.title}</p>
                      <a
                        href={n.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        <span>Open Document</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(n.id)}
                      className="press flex size-7 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition"
                      title="Delete Note"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB: Books & Files ("Admin portal me book add section jodo files se") ----------------- */}
        {activeTab === "books" && (
          <div className="space-y-5">
            <form
              onSubmit={handleAddBook}
              className="rounded-3xl bg-card p-5 ring-1 ring-border shadow-xs space-y-4"
            >
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileUp className="size-4 text-sky-500" />
                  <span>Add Book / Notes PDF From Files</span>
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Apne device/computer se PDF ya study material file upload karein ya direct URL
                  daalein.
                </p>
              </div>

              {/* File Upload Dropzone / Picker */}
              <div>
                <label className="text-xs font-medium block mb-1.5">
                  Select Book File (PDF, DOC, EPUB) *
                </label>
                <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background/50 p-5 text-center hover:bg-background/80 transition group">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.epub,.ppt,.pptx"
                    onChange={handleFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    id="admin-book-file-input"
                  />
                  {selectedBookFile ? (
                    <div className="flex items-center gap-3 text-left">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                        <FileCheck className="size-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-foreground truncate max-w-[220px]">
                          {selectedBookFile.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {selectedBookFile.size > 1024 * 1024
                            ? `${(selectedBookFile.size / (1024 * 1024)).toFixed(2)} MB`
                            : `${Math.round(selectedBookFile.size / 1024)} KB`}{" "}
                          &middot; Ready to upload
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex size-10 items-center justify-center rounded-full bg-sky-500/10 text-sky-600 mb-2 group-hover:scale-110 transition">
                        <Upload className="size-5" />
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        Click to select PDF or file from your device
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Supports PDF, DOCX, EPUB (Up to 50MB)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Or Alternative Direct URL */}
              <div>
                <label className="text-xs font-medium">Or Direct File / PDF URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://...pdf"
                  value={bookForm.fileUrl}
                  onChange={(e) => setBookForm({ ...bookForm, fileUrl: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Book / Module Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PW Physics Med-Easy / Concepts Handbook"
                    value={bookForm.title}
                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">Author / Publisher</label>
                  <input
                    type="text"
                    placeholder="e.g. Physics Wallah / PW"
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Subject</label>
                  <select
                    value={bookForm.subject}
                    onChange={(e) => setBookForm({ ...bookForm, subject: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                    <option value="General &amp; PYQs">General &amp; PYQs</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium">Category / Exam</label>
                  <select
                    value={bookForm.category}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                  >
                    <option value="JEE Main & Advanced">JEE Main &amp; Advanced</option>
                    <option value="NEET">NEET</option>
                    <option value="Class 12">Class 12</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Foundation &amp; Boards">Foundation &amp; Boards</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">
                  Cover Image / Thumbnail URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://...cover.jpg"
                  value={bookForm.thumbnail}
                  onChange={(e) => setBookForm({ ...bookForm, thumbnail: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium">Description / Chapter Highlights</label>
                <textarea
                  rows={2}
                  placeholder="Brief synopsis of what this book covers..."
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={uploadingBook}
                className="press flex w-full items-center justify-center gap-1.5 rounded-xl bg-foreground py-2.5 text-xs font-semibold text-background transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {uploadingBook ? (
                  <>
                    <div className="size-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    <span>{uploadMessage || "Uploading..."}</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    <span>Upload &amp; Publish Book</span>
                  </>
                )}
              </button>
            </form>

            {/* List of custom books */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Published Books Library ({(config.customBooks || []).length})
              </h4>
              {(config.customBooks || []).length === 0 ? (
                <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border">
                  <BookMarked className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-xs font-medium text-foreground">
                    No custom books uploaded yet
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Upload your first book PDF above to make it available for all students.
                  </p>
                </div>
              ) : (
                (config.customBooks || []).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-2xl bg-card p-3.5 ring-1 ring-border text-xs gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {b.thumbnail ? (
                        <img
                          src={b.thumbnail}
                          alt={b.title}
                          className="size-11 rounded-lg object-cover ring-1 ring-border shrink-0"
                        />
                      ) : (
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20">
                          <BookMarked className="size-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[9px] font-bold text-sky-600 dark:text-sky-400">
                            {b.subject}
                          </span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                            {b.category}
                          </span>
                          {b.fileSize ? (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {b.fileSize}
                            </span>
                          ) : null}
                        </div>
                        <p className="font-semibold text-foreground truncate mt-0.5">{b.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={b.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:underline"
                          >
                            <span>Open / Download PDF</span>
                            <ExternalLink className="size-3" />
                          </a>
                          <span className="text-muted-foreground/40">&middot;</span>
                          <span className="text-[10px] text-muted-foreground truncate font-mono">
                            {b.fileName || "file.pdf"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteBook(b.id)}
                      className="press flex size-8 shrink-0 items-center justify-center rounded-xl text-destructive hover:bg-destructive/10 transition cursor-pointer"
                      title="Delete Book"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB 5: Visibility ----------------- */}
        {activeTab === "visibility" && (
          <div className="space-y-5">
            <div className="rounded-3xl bg-card p-5 ring-1 ring-border shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Course Visibility Control
              </h3>
              <p className="text-xs text-muted-foreground">
                Hide any specific batch or course from the student catalog by entering its ID.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Course ID or Batch ID..."
                  value={hideCourseId}
                  onChange={(e) => setHideCourseId(e.target.value)}
                  className="flex-1 rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleToggleHide(hideCourseId, true)}
                  className="press rounded-xl bg-destructive px-3.5 py-2 text-xs font-semibold text-destructive-foreground transition"
                >
                  Hide Course
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Currently Hidden Courses ({config.disabledCourseIds.length})
              </h4>
              {config.disabledCourseIds.length === 0 ? (
                <p className="text-xs text-muted-foreground">All courses are currently visible.</p>
              ) : (
                config.disabledCourseIds.map((id) => (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-2xl bg-card p-3 ring-1 ring-border text-xs"
                  >
                    <span className="font-mono text-xs">{id}</span>
                    <button
                      onClick={() => handleToggleHide(id, false)}
                      className="press rounded-lg bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-foreground hover:text-background transition"
                    >
                      Unhide / Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB 6: Announcements ----------------- */}
        {activeTab === "announcements" && (
          <div className="space-y-5">
            <form
              onSubmit={handleAddAnnouncement}
              className="rounded-3xl bg-card p-5 ring-1 ring-border shadow-xs space-y-3"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Post New Announcement
              </h3>

              <div>
                <label className="text-xs font-medium">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Live Class Schedule for Sunday"
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm({ ...announcementForm, title: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium">Notice Type</label>
                <select
                  value={announcementForm.type}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      type: e.target.value as "urgent" | "announcement" | "update",
                    })
                  }
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                >
                  <option value="announcement">Announcement</option>
                  <option value="urgent">Urgent Alert</option>
                  <option value="update">Platform Update</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium">Message Body</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed announcement instructions for students..."
                  value={announcementForm.message}
                  onChange={(e) =>
                    setAnnouncementForm({ ...announcementForm, message: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-border outline-none"
                />
              </div>

              <button
                type="submit"
                className="press flex w-full items-center justify-center gap-1.5 rounded-xl bg-foreground py-2.5 text-xs font-semibold text-background transition hover:opacity-90"
              >
                <Plus className="size-4" />
                <span>Publish Announcement</span>
              </button>
            </form>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Notices ({config.announcements.length})
              </h4>
              {config.announcements.length === 0 ? (
                <p className="text-xs text-muted-foreground">No announcements posted yet.</p>
              ) : (
                config.announcements.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start justify-between gap-2 rounded-2xl bg-card p-3.5 ring-1 ring-border text-xs"
                  >
                    <div>
                      <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-700 dark:text-amber-300">
                        {a.type}
                      </span>
                      <p className="mt-1 font-semibold text-foreground">{a.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{a.message}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteAnnouncement(a.id)}
                      className="press flex size-7 shrink-0 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition"
                      title="Delete Notice"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
