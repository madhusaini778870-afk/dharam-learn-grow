import booksJson from "./vidyaverseBooks.json";

export type VidyaverseBook = {
  id: string;
  rawId: string;
  title: string;
  author: string;
  publisher: string;
  category: string;
  editionTag: string;
  coverUrl: string;
  rating: number;
  recommendPercentage: number;
  pages: number;
  fileSize: string;
  downloadCount: number;
  viewCount: number;
  description: string;
  downloadUrl: string;
  source: string;
};

export const VIDYAVERSE_BOOKS: VidyaverseBook[] = booksJson as VidyaverseBook[];
