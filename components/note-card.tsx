import { CalendarDays } from "lucide-react";
import { formatDate, getSection } from "@/lib/site";
import type { Note } from "@/lib/types";

export function NoteCard({ note }: { note: Note }) {
  const section = getSection(note.section);

  return (
    <article className="note-card">
      <a href={`/notes/${note.slug}`}>
        <div className="note-card__meta">
          <span className="section-pill">
            {section?.mark} {section?.label || note.section}
          </span>
          <time dateTime={note.publishedAt}>
            <CalendarDays size={15} />
            {formatDate(note.publishedAt)}
          </time>
        </div>
        <h2>{note.title}</h2>
        <p>{note.summary}</p>
        <div className="note-card__foot">
          {note.mood ? <span>{note.mood}</span> : null}
          {note.location ? <span>{note.location}</span> : null}
          {note.tags.slice(0, 3).map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </a>
    </article>
  );
}
