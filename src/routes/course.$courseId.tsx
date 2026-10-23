import { createFileRoute } from "@tanstack/react-router";
import { CourseDetailsPage } from "@/pages/CourseDetails";

export const Route = createFileRoute("/course/$courseId")({
  head: () => ({
    meta: [
      { title: "Course details · Dharam Bhai Study" },
      {
        name: "description",
        content:
          "Course subjects, chapters, lessons and notes from the authorized source. Enroll to unlock content.",
      },
      { property: "og:title", content: "Course details · Dharam Bhai Study" },
      { property: "og:description", content: "Course chapters, lessons and notes. Enroll to unlock." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CourseDetailRoute,
});

function CourseDetailRoute() {
  const { courseId } = Route.useParams();
  return <CourseDetailsPage courseId={courseId} />;
}
