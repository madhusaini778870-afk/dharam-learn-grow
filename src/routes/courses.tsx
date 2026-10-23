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
      { title: "Courses · Dharam Bhai Study" },
      {
        name: "description",
        content:
          "Browse the combined course catalog from both authorized sources: JEE, NEET and Class 9 to 12 batches.",
      },
      { property: "og:title", content: "Courses · Dharam Bhai Study" },
      {
        property: "og:description",
        content: "Combined JEE, NEET and Class 9-12 course catalog with search and filters.",
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
