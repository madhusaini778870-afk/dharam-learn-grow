import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/pages/Admin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal · Dharam Bhai Study" },
      {
        name: "description",
        content:
          "Admin-only portal to manage Dharam Bhai Study courses, subjects, chapters, lectures, notes, live classes, books and students.",
      },
      { property: "og:title", content: "Admin Portal · Dharam Bhai Study" },
      { property: "og:description", content: "Manage courses, lectures, notes, live classes and books." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});
