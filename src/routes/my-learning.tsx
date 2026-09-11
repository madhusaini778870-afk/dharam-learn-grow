import { createFileRoute } from "@tanstack/react-router";
import { MyCoursesPage } from "@/pages/MyCourses";

export const Route = createFileRoute("/my-learning")({
  head: () => ({
    meta: [
      { title: "My Courses · Dharam Bhai Study" },
      {
        name: "description",
        content:
          "The courses you enrolled in, saved to your account and available after every sign-in.",
      },
      { property: "og:title", content: "My Courses · Dharam Bhai Study" },
      { property: "og:description", content: "The courses you enrolled in, saved to your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyCoursesPage,
});
