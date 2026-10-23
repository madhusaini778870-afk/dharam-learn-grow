import { createFileRoute } from "@tanstack/react-router";
import { CoursesPage } from "@/pages/Courses";

export const Route = createFileRoute("/jee")({
  head: () => ({
    meta: [
      { title: "JEE Courses · Dharam Bhai Study" },
      {
        name: "description",
        content: "Publicly listed JEE batches with subjects, chapters and lectures inside Dharam Bhai Study.",
      },
      { property: "og:title", content: "JEE Courses · Dharam Bhai Study" },
      { property: "og:description", content: "Publicly listed JEE batches, chapters and lectures." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <CoursesPage
      title="JEE"
      subtitle="Publicly listed JEE batches"
      category="JEE"
      lockedCategory
      onCategoryChange={() => undefined}
    />
  ),
});
