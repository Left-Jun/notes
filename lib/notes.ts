import { marked } from "marked";
import { getLocalComments, getLocalNotes } from "@/lib/local-store";
import { seedNotes } from "@/lib/seed-notes";
import { getPublicSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { MoodPrivacy, Note, NoteComment, NoteStatus } from "@/lib/types";

type NoteRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content_md: string;
  section: string;
  tags: string[] | null;
  mood: string | null;
  mood_intensity: number | null;
  mood_privacy: MoodPrivacy | null;
  monster_id: string | null;
  support_count: number | null;
  location: string | null;
  cover_url: string | null;
  status: NoteStatus;
  published_at: string;
  created_at: string;
  updated_at: string;
};

type CommentRow = {
  id: string;
  note_id: string;
  author_name: string;
  author_url: string | null;
  body: string;
  status: "pending" | "approved" | "hidden";
  created_at: string;
};

function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary || "",
    content: row.content_md,
    section: row.section,
    tags: row.tags || [],
    mood: row.mood,
    moodIntensity: row.mood_intensity,
    moodPrivacy: row.mood_privacy,
    monsterId: row.monster_id,
    supportCount: row.support_count || 0,
    location: row.location,
    coverUrl: row.cover_url,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapComment(row: CommentRow): NoteComment {
  return {
    id: row.id,
    noteId: row.note_id,
    authorName: row.author_name,
    authorUrl: row.author_url,
    body: row.body,
    status: row.status,
    createdAt: row.created_at
  };
}

function mergeNotes(primary: Note[], fallback: Note[]) {
  const seen = new Set<string>();

  return [...primary, ...fallback].filter((note) => {
    if (seen.has(note.slug)) return false;
    seen.add(note.slug);
    return true;
  });
}

export async function getNotes(options: { section?: string; status?: NoteStatus } = {}) {
  if (!isSupabaseConfigured()) {
    const localNotes = await getLocalNotes();
    return mergeNotes(localNotes, seedNotes)
      .filter((note) => (options.section ? note.section === options.section : true))
      .filter((note) => (options.status ? note.status === options.status : true))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  const supabase = getPublicSupabase();
  let query = supabase
    .from("notes")
    .select("*")
    .order("published_at", { ascending: false });

  if (options.status) {
    query = query.eq("status", options.status);
  }

  if (options.section) {
    query = query.eq("section", options.section);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return seedNotes;
  }

  return (data || []).map((row) => mapNote(row as NoteRow));
}

export async function getNoteBySlug(slug: string) {
  if (!isSupabaseConfigured()) {
    const localNotes = await getLocalNotes();
    return localNotes.find((note) => note.slug === slug) || seedNotes.find((note) => note.slug === slug) || null;
  }

  const supabase = getPublicSupabase();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) {
    return seedNotes.find((note) => note.slug === slug) || null;
  }

  return mapNote(data as NoteRow);
}

export async function getComments(noteId: string) {
  if (!isSupabaseConfigured()) {
    const comments = await getLocalComments();
    return comments
      .filter((comment) => comment.noteId === noteId)
      .filter((comment) => comment.status === "approved")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  const supabase = getPublicSupabase();
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("note_id", noteId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return (data || []).map((row) => mapComment(row as CommentRow));
}

export function getSectionStats(notes: Note[]) {
  return notes.reduce<Record<string, number>>((acc, note) => {
    acc[note.section] = (acc[note.section] || 0) + 1;
    return acc;
  }, {});
}

export function renderMarkdown(markdown: string) {
  return marked.parse(markdown, {
    async: false,
    gfm: true
  }) as string;
}
