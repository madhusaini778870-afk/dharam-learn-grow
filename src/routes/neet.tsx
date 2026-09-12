import { createFileRoute } from "@tanstack/react-router";
import { CoursesPage } from "@/pages/Courses";

export const Route = createFileRoute("/neet")({
  head: () => ({
    meta: [
      { title: "NEET Courses · Dharam Bhai Study" },
      {
        name: "description",
        content: "Publicly listed NEET batches with subjects, chapters and lectures inside Dharam Bhai Study.",
      },
      { property: "og:title", content: "NEET Courses · Dharam Bhai Study" },
      { property: "og:description", content: "Publicly listed NEET batches, chapters and lectures." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <CoursesPage
      title="NEET"
      subtitle="Publicly listed NEET batches"
      category="NEET"
      lockedCategory
      onCategoryChange={() => undefined}
    />
  ),
});
