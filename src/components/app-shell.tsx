import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col bg-background">
      <div className="flex-1 pb-28">{children}</div>
      <BottomNav />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  back,
}: {
  title: string;
  subtitle?: string;
  back?: string;
}) {
  return (
    <header className="px-5 pt-6">
      {back ? (
        <Link to={back} className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ChevronLeft className="size-4" />
          Back
        </Link>
      ) : null}
      <h1 className="font-display text-[26px] leading-tight">{title}</h1>
      {subtitle ? <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}

export function Footer() {
  return (
    <p className="px-5 pb-6 pt-8 text-center text-[11px] tracking-wide text-muted-foreground">
      Dharam Bhai Study · By Lakshya Prince
    </p>
  );
}

const NAV = [
  { to: "/home", label: "Home", icon: HomeIcon },
  { to: "/courses", label: "Courses", icon: GridIcon },
  { to: "/my-learning", label: "My Courses", icon: FolderIcon },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-[520px] -translate-x-1/2 border-t border-border bg-background/95 px-5 pb-5 pt-2.5 backdrop-blur">
      <div className="flex items-center justify-between">
        {NAV.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-2 ${
                active ? "text-lamp-deep" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-5" />
              <span className={`text-[10px] ${active ? "font-semibold text-foreground" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

type IconProps = { className?: string };

export function HomeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v9h12v-9" />
    </svg>
  );
}

export function GridIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 4v16M4 9h16" />
    </svg>
  );
}

export function FolderIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H9l1 1.5h8.5A1.5 1.5 0 0 1 20 7v11a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18Z" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function ChevronLeft({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function ChevronRight({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function SparkIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z" />
      <path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9Z" />
    </svg>
  );
}

export function DocIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 4h9l3 3v13H6Z" />
      <path d="M9 9h5M9 12h5" />
    </svg>
  );
}

export function LiveIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 12a4 4 0 1 1 8 0" />
      <path d="M12 3v3M4.5 16.5a7 7 0 0 1 15 0" />
      <circle cx="12" cy="16" r="1.4" />
    </svg>
  );
}

export function SendIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
