import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCourses } from "@/lib/catalog.functions";
import { Screen, Footer, PageHeader } from "@/components/app-shell";
import { CatalogUnavailable, ListSkeleton, RetryButton, StateCard } from "@/components/states";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Classes · Dharam Bhai Study" },
      {
        name: "description",
        content: "Live JEE and NEET class schedule, shown only when an authorized source provides it.",
      },
      { property: "og:title", content: "Live Classes · Dharam Bhai Study" },
      { property: "og:description", content: "Live JEE and NEET class schedule." },
    ],
  }),
  component: LiveScreen,
});

function LiveScreen() {
  const fetchCourses = useServerFn(listCourses);
  const query = useQuery({
    queryKey: ["live"],
    queryFn: () => fetchCourses({ data: {} }),
    retry: false,
  });

  return (
    <Screen>
      <PageHeader title="Live Classes" subtitle="Scheduled sessions from your courses" />
      <div className="mt-4 px-5">
        {query.isLoading ? <ListSkeleton count={2} /> : null}
        {query.isError ? (
          <StateCard
            title="Network error"
            body="The live schedule request failed. Please try again."
            action={<RetryButton onClick={() => query.refetch()} />}
          />
        ) : null}
        {query.data?.status === "unavailable" ? (
          <CatalogUnavailable reason={query.data.reason} onRetry={() => query.refetch()} />
        ) : null}
        {query.data?.status === "ok" ? (
          <StateCard
            title="No live classes scheduled"
            body="The authorized source has not published any live sessions for your courses."
          />
        ) : null}
      </div>
      <Footer />
    </Screen>
  );
}
