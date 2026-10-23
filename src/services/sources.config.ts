/**
 * Centralized registry of every approved education source.
 * Client-safe static metadata only — no keys, no endpoints that carry secrets.
 *
 * Statuses:
 *  - "connected"    : a public, permitted API is integrated in this app
 *  - "list-only"    : a public catalog API is integrated, but it exposes no
 *                     chapter/lecture detail endpoint, so deep content links
 *                     to the official source
 *  - "protected"    : the source blocks machine access (verification wall or
 *                     obfuscated client) — never bypassed
 *  - "no-public-api": reachable website, but no permitted public data endpoint
 *                     exists yet
 */
export type SourceStatus = "connected" | "list-only" | "protected" | "no-public-api";

export type SourceInfo = {
  id: string;
  name: string;
  category: string;
  baseUrl: string;
  status: SourceStatus;
  /** What is actually integrated, stated plainly. */
  integration: string;
  /** Short note shown under the status. */
  note: string;
};

export const SOURCES: SourceInfo[] = [
  {
    id: "source1",
    name: "PW Study (physicswallahx)",
    category: "PW sources",
    baseUrl: "https://physicswallahx.vercel.app",
    status: "connected",
    integration: "Full catalog: batches, subjects, chapters, lectures, notes and today's schedule.",
    note: "Integrated through the site's own public API.",
  },
  {
    id: "pw-study",
    name: "PW Study",
    category: "PW sources",
    baseUrl: "https://pw-t1.space-z.ai",
    status: "list-only",
    integration: "Public batch list with search and pagination. Chapter and lecture data has no public endpoint yet, so lessons open on the official site.",
    note: "Catalog only.",
  },
  {
    id: "next-topper",
    name: "Next Topper",
    category: "Next Topper",
    baseUrl: "https://nt-study-bison.space-z.ai",
    status: "list-only",
    integration: "Public batch catalog. Chapter and lecture data has no public endpoint yet, so lessons open on the official site.",
    note: "Catalog only.",
  },
  {
    id: "pw-studyfox",
    name: "PW StudyFox",
    category: "PW sources",
    baseUrl: "https://pw.studyfox.eu.cc",
    status: "no-public-api",
    integration: "No permitted public data endpoint found yet.",
    note: "You can still open the official site.",
  },
  {
    id: "pw-pi-store",
    name: "PW Pi Store",
    category: "PW sources",
    baseUrl: "https://pi-pro.space-z.ai",
    status: "no-public-api",
    integration: "No permitted public data endpoint found yet.",
    note: "You can still open the official site.",
  },
  {
    id: "mission-jeet",
    name: "Mission Jeet",
    category: "Other study sources",
    baseUrl: "https://mj-studybison.space-z.ai",
    status: "no-public-api",
    integration: "No permitted public data endpoint found yet.",
    note: "You can still open the official site.",
  },
  {
    id: "cw-study",
    name: "CW Study",
    category: "Other study sources",
    baseUrl: "https://cw.studybison.in",
    status: "no-public-api",
    integration: "No permitted public data endpoint found yet.",
    note: "You can still open the official site.",
  },
  {
    id: "free-books",
    name: "Free Books",
    category: "Other study sources",
    baseUrl: "https://books.studybison.in",
    status: "no-public-api",
    integration: "No permitted public data endpoint found yet.",
    note: "You can still open the official site.",
  },
  {
    id: "learnxpw",
    name: "LearnXPW Batches",
    category: "Other study sources",
    baseUrl: "https://www.learnxpw.site",
    status: "no-public-api",
    integration: "No permitted public data endpoint found yet.",
    note: "You can still open the official site.",
  },
  {
    id: "studyratna",
    name: "StudyRatna",
    category: "Other study sources",
    baseUrl: "https://s2-cdn.studyratna.cc",
    status: "protected",
    integration: "The site hides its data behind its own access protection. We never bypass it.",
    note: "Lectures can be added from here only through links you own or are permitted to use, pasted in the Admin Portal.",
  },
];

export function sourceById(id: string): SourceInfo | undefined {
  return SOURCES.find((source) => source.id === id);
}

export const STATUS_LABEL: Record<SourceStatus, string> = {
  connected: "Connected",
  "list-only": "Catalog only",
  protected: "Access protected",
  "no-public-api": "API not available",
};
