import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CoursesPage } from "@/pages/Courses";
import { CATEGORIES, type Category } from "@/services/courseNormalizer";

type SearchParams = { category: Category | undefined };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    category: CATEGORIES.find((item) => item === search["category"]),
  }),
  head: () => ({
    meta: [
      { title: "Search Courses · Dharam Bhai Study" },
      {
        name: "description",
        content: "Search every publicly listed batch by name, exam or class inside Dharam Bhai Study.",
      },
      { property: "og:title", content: "Search Courses · Dharam Bhai Study" },
      { property: "og:description", content: "Search courses by name, exam or class." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchScreen,
});

function SearchScreen() {
  const { category } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <CoursesPage
      title="Search"
      subtitle="Search the complete public catalog"
      category={category}
      onCategoryChange={(next) => navigate({ to: "/search", search: { category: next } })}
    />
  );
}
