import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listNotes } from "@/lib/catalog.functions";
import { Screen, Footer, PageHeader, DocIcon, CloseIcon } from "@/components/app-shell";
import { CatalogUnavailable, ListSkeleton, RetryButton, StateCard } from "@/components/states";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "Books & Notes · Dharam Bhai Study" },
      {
        name: "description",
        content: "Read authorized JEE and NEET study notes and PDFs inside Dharam Bhai Study.",
      },
      { property: "og:title", content: "Books & Notes · Dharam Bhai Study" },
      { property: "og:description", content: "Authorized JEE and NEET study notes and PDFs." },
    ],
  }),
  component: BooksScreen,
});

function BooksScreen() {
  const fetchNotes = useServerFn(listNotes);
  const [openPdf, setOpenPdf] = useState<{ title: string; url: string } | null>(null);

  const notes = useQuery({
    queryKey: ["notes"],
    queryFn: () => fetchNotes(),
    retry: false,
  });

  return (
    <Screen>
      <PageHeader title="Books & Notes" subtitle="Authorized notes and PDFs only" />

      <div className="mt-4 space-y-3 px-5">
        {notes.isLoading ? <ListSkeleton count={3} /> : null}
        {notes.isError ? (
          <StateCard
            title="Network error"
            body="The notes request failed. Check your connection and try again."
            action={<RetryButton onClick={() => notes.refetch()} />}
          />
        ) : null}
        {notes.data?.status === "unavailable" ? (
          <StateCard
            tone="warn"
            title="Notes unavailable"
            body="No authorized notes source is connected, so no notes can be shown."
            action={<RetryButton onClick={() => notes.refetch()} />}
          />
        ) : null}
        {notes.data?.status === "ok" && notes.data.data.length === 0 ? (
          <StateCard title="No notes published" body="The authorized source returned no notes." />
        ) : null}
        {notes.data?.status === "ok"
          ? notes.data.data.map((note) => (
              <div key={note.id} className="rounded-3xl bg-card p-4 ring-1 ring-border">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-pine/12 text-pine">
                    <DocIcon className="size-5" />
                  </div>
                  <p className="min-w-0 flex-1 font-display text-[16px] leading-tight">{note.title}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenPdf({ title: note.title, url: note.url })}
                    className="press flex-1 rounded-xl bg-foreground py-2.5 text-[12px] font-semibold text-background"
                  >
                    Read in app
                  </button>
                  <a
                    href={note.url}
                    target="_blank"
                    rel="noreferrer"
                    className="press rounded-xl bg-background px-4 py-2.5 text-[12px] font-semibold ring-1 ring-border"
                  >
                    Open
                  </a>
                </div>
              </div>
            ))
          : null}
      </div>

      {openPdf ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-night">
          <div className="flex items-center gap-3 px-5 py-4">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-paper">{openPdf.title}</p>
            <button
              type="button"
              onClick={() => setOpenPdf(null)}
              aria-label="Close reader"
              className="grid size-8 place-items-center rounded-full bg-paper/10 text-paper"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
          <iframe title={openPdf.title} src={openPdf.url} className="flex-1 bg-paper" />
        </div>
      ) : null}
      <Footer />
    </Screen>
  );
}
