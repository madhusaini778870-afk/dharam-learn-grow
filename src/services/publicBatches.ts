/**
 * Publicly listed batches provided by the app owner, rendered inside the
 * Dharam Bhai Study UI.
 *
 * Rules kept here on purpose:
 *  - Only the exact batch names supplied by the owner are used.
 *  - No direct/deep course URLs are invented: every batch points at the public
 *    listing page it is listed on. Nothing here bypasses login or payment.
 *  - No fake descriptions, teachers, ratings, prices, chapters or lessons.
 */

import {
  LISTING_SOURCE_URL,
  YOUTUBE_CHANNEL_URL,
  compositeId,
  SOURCE_LABEL,
  type Category,
  type NormalizedCourse,
} from "./courseNormalizer";

type Entry = {
  id: string;
  title: string;
  category: Category;
  className?: string | null;
  exam?: string | null;
  sourceUrl: string;
  sourceNote: string;
};

const ENTRIES: Entry[] = [
  {
    id: "awadh-2-0-up-board-2027-hindi-class-11",
    title: "Awadh 2.0 UP Board 2027 (Hindi Medium) Class 11th",
    category: "Class 11",
    className: "Class 11",
    exam: "UP Board",
    sourceUrl: LISTING_SOURCE_URL,
    sourceNote: "Public batch listing",
  },
  {
    id: "arjuna-jee-2027",
    title: "Arjuna JEE 2027",
    category: "JEE",
    exam: "JEE",
    sourceUrl: LISTING_SOURCE_URL,
    sourceNote: "Public batch listing",
  },
  {
    id: "arjuna-neet-2027",
    title: "Arjuna NEET 2027",
    category: "NEET",
    exam: "NEET",
    sourceUrl: LISTING_SOURCE_URL,
    sourceNote: "Public batch listing",
  },
  {
    id: "arjuna-neet-2-0-2027",
    title: "Arjuna NEET 2.0 2027",
    category: "NEET",
    exam: "NEET",
    sourceUrl: LISTING_SOURCE_URL,
    sourceNote: "Public batch listing",
  },
  {
    id: "arjuna-jee-2-0-2027",
    title: "Arjuna JEE 2.0 2027",
    category: "JEE",
    exam: "JEE",
    sourceUrl: LISTING_SOURCE_URL,
    sourceNote: "Public batch listing",
  },
  {
    id: "lakshya-jee-2027",
    title: "Lakshya JEE 2027",
    category: "JEE",
    exam: "JEE",
    sourceUrl: LISTING_SOURCE_URL,
    sourceNote: "Public batch listing",
  },
  {
    id: "lakshya-neet-2027",
    title: "Lakshya NEET 2027",
    category: "NEET",
    exam: "NEET",
    sourceUrl: LISTING_SOURCE_URL,
    sourceNote: "Public batch listing",
  },
  {
    id: "surya-3-0-ssc-cgl-2024-tier-1-2",
    title: "Surya 3.0 SSC CGL 2024 Target Batch (Tier 1+Tier 2) with Test Series",
    category: "Other",
    exam: "SSC CGL",
    sourceUrl: LISTING_SOURCE_URL,
    sourceNote: "Public batch listing",
  },
  {
    id: "vidyapeeth-11th-jee-2024-31-aj102ea",
    title: "Vidyapeeth - 11th JEE 2024 (31-AJ102EA)",
    category: "JEE",
    className: "Class 11",
    exam: "JEE",
    sourceUrl: LISTING_SOURCE_URL,
    sourceNote: "Public batch listing",
  },
  {
    id: "up-police-computer-operator-grade-a",
    title: "UP Police Computer Operator (Grade-A) Selection Batch",
    category: "Other",
    exam: "UP Police",
    sourceUrl: LISTING_SOURCE_URL,
    sourceNote: "Public batch listing",
  },
  {
    id: "pw-jee-wallah-youtube-channel",
    title: "PW JEE Wallah — YouTube channel lessons",
    category: "JEE",
    exam: "JEE",
    sourceUrl: YOUTUBE_CHANNEL_URL,
    sourceNote: "Public YouTube channel",
  },
];

function toCourse(entry: Entry): NormalizedCourse {
  return {
    id: compositeId("listing", entry.id),
    sourceCourseId: entry.id,
    source: "listing",
    sourceLabel: SOURCE_LABEL.listing,
    sourceUrl: entry.sourceUrl,
    sourceNote: entry.sourceNote,
    title: entry.title,
    thumbnail: null,
    description: null,
    category: entry.category,
    className: entry.className ?? null,
    exam: entry.exam ?? null,
    subjects: [],
    teachers: [],
    chapters: [],
    lessons: [],
    videos: [],
    notes: [],
  };
}

export function listedBatches(): NormalizedCourse[] {
  return ENTRIES.map(toCourse);
}
