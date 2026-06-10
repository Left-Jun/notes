import { Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { NoteCard } from "@/components/note-card";
import { SiteShell } from "@/components/site-shell";
import { getNotes } from "@/lib/notes";
import { buildSearchEntries } from "@/lib/search";
import { getSection, normalizeSectionId } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalizedSlug = normalizeSectionId(slug);
  const section = slug === "all" ? getSection("all") : getSection(normalizedSlug);

  if (!section) {
    notFound();
  }

  const allNotes = await getNotes({ status: "published" });
  const notes = slug === "all" ? allNotes : await getNotes({ section: normalizedSlug, status: "published" });
  const searchEntries = buildSearchEntries(allNotes);

  return (
    <SiteShell active={section.id} searchEntries={searchEntries}>
      <section className="list-hero">
        <p className="eyebrow">{section.mark} Archive</p>
        <h1>{section.label}</h1>
        <p>{section.description}</p>
        {section.id === "posts" || section.id === "diary" ? (
          <div className="hero-actions">
            <a className="primary-link" href={`/admin?section=${section.id}`}>
              <Plus size={18} />
              {section.id === "diary" ? "写日记" : "写随笔"}
            </a>
          </div>
        ) : null}
      </section>

      <div className="note-list">
        {notes.map((note) => (
          <NoteCard note={note} key={note.slug} />
        ))}
        {notes.length === 0 ? <p className="empty-state">这里还空着，等下一次记录。</p> : null}
      </div>
    </SiteShell>
  );
}
