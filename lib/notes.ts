import { marked } from "marked";
import { getLocalComments, getLocalNotes } from "@/lib/local-store";
import { defaultProfile } from "@/lib/profile";
import { listProfilesByIds, mapProfile, type ProfileRow } from "@/lib/profiles";
import { seedNotes } from "@/lib/seed-notes";
import { normalizeSectionId, sectionAliasTag } from "@/lib/site";
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
  author_profile_id: string | null;
  profiles?: ProfileRow | null;
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
  const aliasTag = sectionAliasTag(row.section);
  const tags = row.tags || [];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary || "",
    content: row.content_md,
    section: normalizeSectionId(row.section),
    tags: aliasTag && !tags.includes(aliasTag) ? [aliasTag, ...tags] : tags,
    mood: row.mood,
    moodIntensity: row.mood_intensity,
    moodPrivacy: row.mood_privacy,
    monsterId: row.monster_id,
    supportCount: row.support_count || 0,
    location: row.location,
    coverUrl: row.cover_url,
    authorProfileId: row.author_profile_id,
    authorProfile: row.profiles ? mapProfile(row.profiles) : row.author_profile_id ? null : defaultProfile,
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

function normalizeNote(note: Note): Note {
  const aliasTag = sectionAliasTag(note.section);
  const tags = note.tags || [];

  return {
    ...note,
    section: normalizeSectionId(note.section),
    tags: aliasTag && !tags.includes(aliasTag) ? [aliasTag, ...tags] : tags
  };
}

function matchesOptions(note: Note, options: { section?: string; status?: NoteStatus }) {
  const normalizedSection = options.section ? normalizeSectionId(options.section) : undefined;

  return (normalizedSection ? note.section === normalizedSection : true) && (options.status ? note.status === options.status : true);
}

async function attachLocalAuthorProfiles(notes: Note[]) {
  const profileIds = notes.map((note) => note.authorProfileId).filter((id): id is string => Boolean(id));
  const profiles = await listProfilesByIds(profileIds);

  return notes.map((note) => ({
    ...note,
    authorProfile: note.authorProfileId ? profiles.get(note.authorProfileId) || null : note.authorProfile || defaultProfile
  }));
}

export async function getNotes(options: { section?: string; status?: NoteStatus } = {}) {
  if (!isSupabaseConfigured()) {
    const localNotes = await getLocalNotes();
    const mergedNotes = mergeNotes(localNotes, seedNotes)
      .map(normalizeNote)
      .filter((note) => matchesOptions(note, options))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return attachLocalAuthorProfiles(mergedNotes);
  }

  const supabase = getPublicSupabase();
  let query = supabase
    .from("notes")
    .select("*, profiles:author_profile_id(*)")
    .order("published_at", { ascending: false });

  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    let fallbackQuery = supabase.from("notes").select("*").order("published_at", { ascending: false });
    if (options.status) {
      fallbackQuery = fallbackQuery.eq("status", options.status);
    }
    const { data: fallbackData, error: fallbackError } = await fallbackQuery;
    if (fallbackError) {
      return seedNotes.map((note) => normalizeNote({ ...note, authorProfile: defaultProfile })).filter((note) => matchesOptions(note, options));
    }
    return (fallbackData || []).map((row) => mapNote(row as NoteRow)).filter((note) => matchesOptions(note, options));
  }

  return (data || []).map((row) => mapNote(row as NoteRow)).filter((note) => matchesOptions(note, options));
}

export async function getNoteBySlug(slug: string) {
  if (!isSupabaseConfigured()) {
    const localNotes = await getLocalNotes();
    const note = localNotes.find((item) => item.slug === slug) || seedNotes.find((item) => item.slug === slug) || null;
    if (!note) return null;
    return (await attachLocalAuthorProfiles([normalizeNote(note)]))[0] || null;
  }

  const supabase = getPublicSupabase();
  const { data, error } = await supabase
    .from("notes")
    .select("*, profiles:author_profile_id(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("notes")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    if (!fallbackError && fallbackData) return mapNote(fallbackData as NoteRow);
    const note = seedNotes.find((item) => item.slug === slug) || null;
    return note ? normalizeNote({ ...note, authorProfile: defaultProfile }) : null;
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
    const section = normalizeSectionId(note.section);
    acc[section] = (acc[section] || 0) + 1;
    return acc;
  }, {});
}

export function renderMarkdown(markdown: string) {
  return marked.parse(markdown, {
    async: false,
    gfm: true
  }) as string;
}
