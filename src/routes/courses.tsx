import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CATEGORIES, type Category } from "@/services/courseNormalizer";
import { CoursesPage } from "@/pages/Courses";

type CourseSearch = { category: Category | undefined };

export const Route = createFileRoute("/courses")({
  validateSearch: (search: Record<string, unknown>): CourseSearch => {
    const raw = search["category"];
    const match = CATEGORIES.find((item) => item === raw);
    return { category: match };
  },
  head: () => ({
    meta: [
      { title: "Vidyaverse Courses · Dharam Bhai Study" },
      {
        name: "description",
        content:
          "Browse high-definition video lecture courses from https://vidya-verse.ai.studio/ with notes and instant streaming.",
      },
      { property: "og:title", content: "Vidyaverse Courses · Dharam Bhai Study" },
      {
        property: "og:description",
        content: "Vidyaverse course catalog with search, topics, and video lectures.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoursesRoute,
});

function CoursesRoute() {
  const { category } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <CoursesPage
      category={category}
      onCategoryChange={(next) => navigate({ to: "/courses", search: { category: next } })}
    />
  );
}
