import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Screen, Footer, PageHeader, ChevronRight } from "@/components/app-shell";
import { ListSkeleton, StateCard, RetryButton } from "@/components/states";

/**
 * Admin portal. Every read and write here goes through the signed-in student's
 * own session, and the database's access rules only allow them when the account
 * holds the admin role — there is no password, key or bypass in this file.
 */

// The admin tables are addressed by name, so an untyped view of the client is used.
const db = supabase as unknown as SupabaseClient;

type FieldKind = "text" | "textarea" | "number" | "datetime";
type FieldDef = { name: string; label: string; kind?: FieldKind; placeholder?: string; required?: boolean };
type Row = Record<string, unknown>;

type Tab = "dashboard" | "courses" | "lectures" | "notes" | "live" | "books" | "users";

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "courses", label: "Courses" },
  { id: "lectures", label: "Lectures" },
  { id: "notes", label: "Notes" },
  { id: "live", label: "Live" },
  { id: "books", label: "Books" },
  { id: "users", label: "Users" },
];

export function AdminPage() {
  const { session, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  if (loading || roleLoading) {
    return (
      <Screen>
        <PageHeader title="Admin" />
        <div className="mt-4 px-5">
          <ListSkeleton count={3} />
        </div>
      </Screen>
    );
  }

  if (!isAdmin) {
    return (
      <Screen>
        <PageHeader title="Admin" />
        <div className="mt-4 px-5">
          <StateCard
            tone="warn"
            title="Admins only"
            body="This area is limited to accounts with admin access. If that should be you, ask the app owner to grant it."
          />
        </div>
        <Footer />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="Admin Portal" subtitle="Manage the catalogue students see" />

      <div className="mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`press shrink-0 rounded-full px-3.5 py-2 text-[12px] font-semibold ring-1 ${
              tab === item.id
                ? "bg-foreground text-background ring-foreground"
                : "bg-card text-muted-foreground ring-border"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3 px-5">
        {tab === "dashboard" ? <Dashboard onOpen={setTab} /> : null}
        {tab === "courses" ? <CoursesAdmin /> : null}
        {tab === "lectures" ? <PerCourseAdmin kind="lectures" /> : null}
        {tab === "notes" ? <PerCourseAdmin kind="notes" /> : null}
        {tab === "live" ? (
          <CrudSection
            table="admin_live_classes"
            heading="Live classes"
            titleField="title"
            subtitleFields={["subject", "teacher", "starts_at"]}
            order="starts_at"
            fields={[
              { name: "title", label: "Class title", required: true },
              { name: "subject", label: "Subject" },
              { name: "teacher", label: "Teacher" },
              { name: "starts_at", label: "Starts at", kind: "datetime" },
              { name: "exam", label: "Exam", placeholder: "JEE / NEET" },
              { name: "join_url", label: "Authorized public join / stream URL" },
            ]}
          />
        ) : null}
        {tab === "books" ? (
          <CrudSection
            table="admin_books"
            heading="Books"
            titleField="title"
            subtitleFields={["exam", "class_name"]}
            fields={[
              { name: "title", label: "Book title", required: true },
              { name: "description", label: "Description", kind: "textarea" },
              { name: "exam", label: "Exam", placeholder: "JEE / NEET" },
              { name: "class_name", label: "Class", placeholder: "Class 11" },
              { name: "cover_url", label: "Cover image URL" },
              { name: "file_url", label: "Public PDF / file URL" },
            ]}
          />
        ) : null}
        {tab === "users" ? <UsersAdmin /> : null}
      </div>
      <Footer />
    </Screen>
  );
}

/* ------------------------------- dashboard ------------------------------- */

function Dashboard({ onOpen }: { onOpen: (tab: Tab) => void }) {
  const counts = useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const tables = [
        "admin_courses",
        "admin_lectures",
        "admin_notes",
        "admin_live_classes",
        "admin_books",
        "profiles",
        "enrollments",
      ] as const;
      const entries = await Promise.all(
        tables.map(async (table) => {
          const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
          if (error) throw error;
          return [table, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<(typeof tables)[number], number>;
    },
  });

  if (counts.isLoading) return <ListSkeleton count={2} />;
  if (counts.isError)
    return (
      <StateCard
        title="Couldn't load the dashboard"
        body="We couldn't reach your data just now."
        action={<RetryButton onClick={() => counts.refetch()} />}
      />
    );

  const stats: { label: string; value: number; tab: Tab }[] = [
    { label: "Courses", value: counts.data!.admin_courses, tab: "courses" },
    { label: "Lectures", value: counts.data!.admin_lectures, tab: "lectures" },
    { label: "Notes", value: counts.data!.admin_notes, tab: "notes" },
    { label: "Live classes", value: counts.data!.admin_live_classes, tab: "live" },
    { label: "Books", value: counts.data!.admin_books, tab: "books" },
    { label: "Students", value: counts.data!.profiles, tab: "users" },
    { label: "Enrollments", value: counts.data!.enrollments, tab: "users" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <button
          key={stat.label}
          type="button"
          onClick={() => onOpen(stat.tab)}
          className="press rounded-3xl bg-card p-4 text-left ring-1 ring-border"
        >
          <p className="font-display text-[26px] leading-none">{stat.value}</p>
          <p className="mt-1.5 text-[12px] text-muted-foreground">{stat.label}</p>
        </button>
      ))}
    </div>
  );
}

/* --------------------------- generic crud block --------------------------- */

function value(row: Row, key: string): string {
  const raw = row[key];
  if (raw === null || raw === undefined) return "";
  return String(raw);
}

function CrudSection({
  table,
  heading,
  titleField,
  subtitleFields = [],
  fields,
  filter,
  order = "created_at",
}: {
  table: string;
  heading: string;
  titleField: string;
  subtitleFields?: string[];
  fields: FieldDef[];
  filter?: { column: string; value: string };
  order?: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = ["admin-table", table, filter?.value ?? "all"];
  const [editing, setEditing] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const list = useQuery({
    queryKey,
    queryFn: async () => {
      let query = db.from(table).select("*");
      if (filter) query = query.eq(filter.column, filter.value);
      const { data, error } = await query.order(order, { ascending: order !== "created_at" });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload: Row = {};
      for (const field of fields) {
        const raw = (draft[field.name] ?? "").trim();
        if (field.kind === "number") payload[field.name] = raw === "" ? 0 : Number(raw);
        else if (field.kind === "datetime") payload[field.name] = raw === "" ? null : new Date(raw).toISOString();
        else payload[field.name] = raw === "" ? null : raw;
      }
      if (filter) payload[filter.column] = filter.value;
      if (editing) {
        const { error } = await db.from(table).update(payload).eq("id", String(editing["id"]));
        if (error) throw error;
      } else {
        const { error } = await db.from(table).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setEditing(null);
      setDraft({});
      setFormError(null);
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ["admin-counts"] });
    },
    onError: (error: unknown) => setFormError(error instanceof Error ? error.message : "Could not save."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ["admin-counts"] });
    },
  });

  const toggle = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await db
        .from(table)
        .update({ enabled: !row["enabled"] })
        .eq("id", String(row["id"]));
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
  });

  function startEdit(row: Row) {
    setEditing(row);
    setFormError(null);
    const next: Record<string, string> = {};
    for (const field of fields) {
      const raw = row[field.name];
      if (field.kind === "datetime" && typeof raw === "string")
        next[field.name] = new Date(raw).toISOString().slice(0, 16);
      else next[field.name] = raw === null || raw === undefined ? "" : String(raw);
    }
    setDraft(next);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const missing = fields.find((field) => field.required && !(draft[field.name] ?? "").trim());
    if (missing) {
      setFormError(`${missing.label} is required.`);
      return;
    }
    save.mutate();
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="rounded-3xl bg-card p-4 ring-1 ring-border">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {editing ? `Edit ${heading.toLowerCase()}` : `Add to ${heading.toLowerCase()}`}
        </p>
        <div className="mt-3 space-y-2.5">
          {fields.map((field) => (
            <label key={field.name} className="block">
              <span className="text-[11px] text-muted-foreground">{field.label}</span>
              {field.kind === "textarea" ? (
                <textarea
                  value={draft[field.name] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [field.name]: e.target.value })}
                  rows={3}
                  placeholder={field.placeholder}
                  className="mt-1 w-full rounded-2xl bg-background px-3.5 py-2.5 text-sm outline-none ring-1 ring-border"
                />
              ) : (
                <input
                  value={draft[field.name] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [field.name]: e.target.value })}
                  type={field.kind === "number" ? "number" : field.kind === "datetime" ? "datetime-local" : "text"}
                  placeholder={field.placeholder}
                  className="mt-1 w-full rounded-2xl bg-background px-3.5 py-2.5 text-sm outline-none ring-1 ring-border"
                />
              )}
            </label>
          ))}
        </div>

        {formError ? (
          <p className="mt-3 rounded-2xl bg-destructive/10 px-3.5 py-2.5 text-[12px] text-destructive">
            {formError}
          </p>
        ) : null}

        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            disabled={save.isPending}
            className="press rounded-2xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground disabled:opacity-60"
          >
            {save.isPending ? "Saving…" : editing ? "Save changes" : "Add"}
          </button>
          {editing ? (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setDraft({});
                setFormError(null);
              }}
              className="press rounded-2xl bg-background px-4 py-2.5 text-[13px] font-semibold ring-1 ring-border"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {list.isLoading ? <ListSkeleton count={2} /> : null}
      {list.isError ? (
        <StateCard
          title={`Couldn't load ${heading.toLowerCase()}`}
          body="Please try again."
          action={<RetryButton onClick={() => list.refetch()} />}
        />
      ) : null}
      {list.data?.length === 0 ? (
        <p className="rounded-3xl bg-card px-4 py-6 text-center text-[13px] text-muted-foreground ring-1 ring-border">
          Nothing added yet.
        </p>
      ) : null}

      {list.data?.map((row) => (
        <div key={String(row["id"])} className="rounded-3xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-display text-[16px] leading-tight">{value(row, titleField) || "Untitled"}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {subtitleFields.map((key) => value(row, key)).filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                row["enabled"] ? "bg-pine/15 text-pine" : "bg-muted text-muted-foreground"
              }`}
            >
              {row["enabled"] ? "Published" : "Hidden"}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => startEdit(row)}
              className="press rounded-xl bg-background px-3 py-2 text-[12px] font-semibold ring-1 ring-border"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => toggle.mutate(row)}
              className="press rounded-xl bg-background px-3 py-2 text-[12px] font-semibold ring-1 ring-border"
            >
              {row["enabled"] ? "Unpublish" : "Publish"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Delete this permanently?")) remove.mutate(String(row["id"]));
              }}
              className="press rounded-xl bg-background px-3 py-2 text-[12px] font-semibold text-destructive ring-1 ring-border"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- courses tab ------------------------------ */

function CoursesAdmin() {
  return (
    <CrudSection
      table="admin_courses"
      heading="Courses"
      titleField="title"
      subtitleFields={["exam", "class_name", "category"]}
      fields={[
        { name: "title", label: "Course / batch title", required: true },
        { name: "description", label: "Description", kind: "textarea" },
        { name: "exam", label: "Exam", placeholder: "JEE / NEET" },
        { name: "class_name", label: "Class", placeholder: "Class 11" },
        { name: "category", label: "Category", placeholder: "jee, neet, class-11, class-12, other" },
        { name: "thumbnail_url", label: "Thumbnail image URL" },
        { name: "source_url", label: "Public source page URL (optional)" },
      ]}
    />
  );
}

/* --------------------- lectures & notes (per course) ---------------------- */

function PerCourseAdmin({ kind }: { kind: "lectures" | "notes" }) {
  const [courseId, setCourseId] = useState<string>("");

  const courses = useQuery({
    queryKey: ["admin-table", "admin_courses", "all"],
    queryFn: async () => {
      const { data, error } = await db
        .from("admin_courses")
        .select("id, title")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const options = useMemo(() => courses.data ?? [], [courses.data]);

  if (courses.isLoading) return <ListSkeleton count={2} />;
  if (options.length === 0)
    return (
      <StateCard
        tone="warn"
        title="Add a course first"
        body={`Create a course in the Courses tab, then add ${kind} to it.`}
      />
    );

  return (
    <div className="space-y-3">
      <label className="block rounded-3xl bg-card p-4 ring-1 ring-border">
        <span className="text-[11px] text-muted-foreground">Course</span>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="mt-1 w-full rounded-2xl bg-background px-3.5 py-2.5 text-sm outline-none ring-1 ring-border"
        >
          <option value="">Select a course…</option>
          {options.map((course) => (
            <option key={String(course["id"])} value={String(course["id"])}>
              {value(course, "title")}
            </option>
          ))}
        </select>
      </label>

      {courseId ? (
        kind === "lectures" ? (
          <CrudSection
            table="admin_lectures"
            heading="Lectures"
            titleField="title"
            subtitleFields={["subject", "chapter"]}
            order="order_index"
            filter={{ column: "course_id", value: courseId }}
            fields={[
              { name: "subject", label: "Subject", required: true, placeholder: "Physics" },
              { name: "chapter", label: "Chapter", required: true, placeholder: "Units and Measurement" },
              { name: "title", label: "Lecture title", required: true },
              { name: "order_index", label: "Order", kind: "number" },
              { name: "video_url", label: "Authorized public video / player URL" },
              { name: "notes_url", label: "Notes PDF URL (optional)" },
            ]}
          />
        ) : (
          <CrudSection
            table="admin_notes"
            heading="Notes"
            titleField="title"
            subtitleFields={["url"]}
            filter={{ column: "course_id", value: courseId }}
            fields={[
              { name: "title", label: "Notes title", required: true },
              { name: "url", label: "Public PDF URL", required: true },
            ]}
          />
        )
      ) : (
        <p className="rounded-3xl bg-card px-4 py-6 text-center text-[13px] text-muted-foreground ring-1 ring-border">
          Select a course to manage its {kind}.
        </p>
      )}
    </div>
  );
}

/* -------------------------------- users tab ------------------------------- */

function UsersAdmin() {
  const students = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profileResult, enrollmentResult] = await Promise.all([
        db.from("profiles").select("id, full_name, email, created_at").order("created_at", { ascending: false }),
        db.from("enrollments").select("user_id, course_title"),
      ]);
      if (profileResult.error) throw profileResult.error;
      if (enrollmentResult.error) throw enrollmentResult.error;
      const rows = (enrollmentResult.data ?? []) as Row[];
      return ((profileResult.data ?? []) as Row[]).map((profile) => ({
        profile,
        enrolled: rows.filter((row) => row["user_id"] === profile["id"]).length,
      }));
    },
  });

  if (students.isLoading) return <ListSkeleton count={3} />;
  if (students.isError)
    return (
      <StateCard
        title="Couldn't load students"
        body="Please try again."
        action={<RetryButton onClick={() => students.refetch()} />}
      />
    );

  return (
    <div className="space-y-2.5">
      {students.data?.map(({ profile, enrolled }) => (
        <div
          key={String(profile["id"])}
          className="flex items-center gap-3 rounded-3xl bg-card p-4 ring-1 ring-border"
        >
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-foreground font-display text-background">
            {(value(profile, "full_name")[0] ?? value(profile, "email")[0] ?? "S").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{value(profile, "full_name") || "Student"}</p>
            <p className="truncate text-[11px] text-muted-foreground">{value(profile, "email")}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-[18px] leading-none">{enrolled}</p>
            <p className="text-[10px] text-muted-foreground">enrolled</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </div>
      ))}
      {students.data?.length === 0 ? (
        <p className="rounded-3xl bg-card px-4 py-6 text-center text-[13px] text-muted-foreground ring-1 ring-border">
          No students yet.
        </p>
      ) : null}
    </div>
  );
}

export default AdminPage;
