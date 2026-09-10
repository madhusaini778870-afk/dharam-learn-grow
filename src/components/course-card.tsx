import { Link } from "@tanstack/react-router";
import type { Course } from "@/lib/catalog.functions";
import { LockIcon } from "@/components/app-shell";

export function CourseCard({ course, enrolled }: { course: Course; enrolled?: boolean }) {
  return (
    <div className="animate-rise rounded-3xl bg-card p-3 ring-1 ring-border">
      <div className="flex gap-3">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            loading="lazy"
            className="size-24 shrink-0 rounded-xl object-cover ring-1 ring-border"
          />
        ) : (
          <div className="grid size-24 shrink-0 place-items-center rounded-xl bg-muted text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground ring-1 ring-border">
            No cover
          </div>
        )}
        <div className="min-w-0 flex-1 py-1">
          <div className="flex flex-wrap items-center gap-2">
            {course.exam ? (
              <span className="rounded-md bg-lamp/15 px-2 py-0.5 text-[10px] font-semibold text-lamp-deep">
                {course.exam}
              </span>
            ) : null}
            {course.subject ? (
              <span className="rounded-md bg-foreground/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {course.subject}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 font-display text-[17px] leading-tight text-balance">{course.title}</p>
          {enrolled ? (
            <p className="mt-1.5 text-[12px] font-medium text-pine">Enrolled</p>
          ) : (
            <p className="mt-1.5 flex items-center gap-1 text-[12px] text-locked">
              <LockIcon className="size-3.5" />
              Enroll to view chapters
            </p>
          )}
          <Link
            to="/course/$courseId"
            params={{ courseId: course.id }}
            className="press mt-2.5 inline-flex rounded-xl bg-foreground px-3.5 py-2 text-[12px] font-semibold text-background"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
