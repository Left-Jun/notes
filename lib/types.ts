export type NoteStatus = "published" | "draft";

export type Note = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  section: string;
  tags: string[];
  mood?: string | null;
  location?: string | null;
  coverUrl?: string | null;
  status: NoteStatus;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
};

export type NoteComment = {
  id: string;
  noteId: string;
  authorName: string;
  authorUrl?: string | null;
  body: string;
  status: "pending" | "approved" | "hidden";
  createdAt: string;
};

export type Section = {
  id: string;
  label: string;
  mark: string;
  description: string;
};
