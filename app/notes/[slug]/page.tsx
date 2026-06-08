import { CalendarDays, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { AuthorBadge } from "@/components/author-badge";
import { SiteShell } from "@/components/site-shell";
import { getNoteBySlug, getNotes, renderMarkdown } from "@/lib/notes";
import { buildSearchEntries } from "@/lib/search";
import { formatDate, getSection } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);

  if (!note) {
    notFound();
  }

  const section = getSection(note.section);
  const html = renderMarkdown(note.content);
  const searchEntries = buildSearchEntries(await getNotes({ status: "published" }));

  return (
    <SiteShell active={note.section} searchEntries={searchEntries}>
      <article className="article-panel">
        <header className="article-header">
          <p className="eyebrow">
            {section?.mark} {section?.label}
          </p>
          <h1>{note.title}</h1>
          <div className="article-meta">
            <AuthorBadge profile={note.authorProfile} />
            <span>
              <CalendarDays size={15} />
              {formatDate(note.publishedAt)}
            </span>
            {note.mood ? <span>{note.mood}</span> : null}
            {note.location ? (
              <span>
                <MapPin size={15} />
                {note.location}
              </span>
            ) : null}
          </div>
          <p className="article-summary">{note.summary}</p>
        </header>
        <div className="article-content" dangerouslySetInnerHTML={{ __html: html }} />
        <footer className="article-tags">
          {note.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </footer>
      </article>
    </SiteShell>
  );
}
