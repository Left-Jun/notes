import { formatDate, getSection } from "@/lib/site";
import type { Note } from "@/lib/types";
import type { SiteSearchEntry } from "@/components/site-search";

export function buildSearchEntries(notes: Note[]): SiteSearchEntry[] {
  return notes.map((note) => {
    const section = getSection(note.section);
    const tags = note.tags || [];
    const searchable = [
      note.title,
      note.summary,
      note.section,
      section?.label,
      note.mood,
      note.location,
      ...tags,
      note.content
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return {
      title: note.title,
      summary: note.summary,
      url: `/notes/${note.slug}`,
      section: section ? `${section.mark} ${section.label}` : note.section,
      date: formatDate(note.publishedAt),
      tags,
      search: searchable
    };
  });
}
