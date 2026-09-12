import { Link } from "@tanstack/react-router";
import { LockIcon } from "@/components/app-shell";
import type { NormalizedCourse } from "@/services/courseNormalizer";

export function CourseCard({
  course,
  enrolled,
}: {
  course: NormalizedCourse;
  enrolled?: boolean;
}) {
  const chips = [course.category, course.className, ...course.subjects.slice(0, 2)].filter(
    (chip): chip is string => Boolean(chip),
  );

  return (
    <div className="animate-rise rounded-3xl bg-card p-3 ring-1 ring-border">
      <div className="flex gap-3">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            loading="lazy"
            className="size-24 shrink-0 rounded-xl object-cover ring-1 ring-border"
          />
        ) : (
          <div className="grid size-24 shrink-0 place-items-center rounded-xl bg-muted text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground ring-1 ring-border">
            No cover
          </div>
        )}

        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-foreground/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {course.sourceLabel}
            </span>
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-md bg-lamp/15 px-2 py-0.5 text-[10px] font-semibold text-lamp-deep"
              >
                {chip}
              </span>
            ))}
          </div>

          <p className="mt-1.5 font-display text-[17px] leading-tight text-balance">{course.title}</p>

          {course.description ? (
            <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-muted-foreground">
              {course.description}
            </p>
          ) : null}

          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {[
              course.chapters.length ? `${course.chapters.length} chapters` : null,
              course.lessons.length ? `${course.lessons.length} lessons` : null,
              course.notes.length ? `${course.notes.length} notes` : null,
              course.teachers.length ? course.teachers.slice(0, 2).join(", ") : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {enrolled ? (
            <p className="mt-1.5 text-[12px] font-medium text-pine">Enrolled</p>
          ) : (
            <p className="mt-1.5 flex items-center gap-1 text-[12px] text-locked">
              <LockIcon className="size-3.5" />
              Enroll to view chapters
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default CourseCard;
