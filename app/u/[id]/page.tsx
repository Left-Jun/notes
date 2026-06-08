import { notFound } from "next/navigation";
import { NoteCard } from "@/components/note-card";
import { SiteShell } from "@/components/site-shell";
import { SocialIcon } from "@/components/social-icon";
import { getNotes } from "@/lib/notes";
import { defaultProfile, displayProfile, visibleSocialLinks } from "@/lib/profile";
import { getProfileById } from "@/lib/profiles";
import { buildSearchEntries } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfileById(id);

  if (!profile) {
    notFound();
  }

  const display = displayProfile(profile);
  const notes = await getNotes({ status: "published" });
  const authoredNotes = notes.filter((note) =>
    display.id === defaultProfile.id ? !note.authorProfileId || note.authorProfileId === display.id : note.authorProfileId === display.id
  );
  const links = visibleSocialLinks(display.socialLinks);

  return (
    <SiteShell active="auth" searchEntries={buildSearchEntries(notes)}>
      <section className="public-profile">
        <div className="public-profile__head">
          <img className={display.deletedAt ? "public-profile__avatar is-deleted" : "public-profile__avatar"} src={display.avatarUrl || "/img/avatar.jpg"} alt="" />
          <div>
            <p className="eyebrow">Profile</p>
            <h1>{display.displayName}</h1>
            <p className="profile-editor__status">
              <span>{display.statusEmoji || "✦"}</span>
              {display.statusText}
            </p>
            <p>{display.bio}</p>
          </div>
        </div>
        {links.length > 0 ? (
          <div className="public-profile__social" aria-label="社交链接">
            {links.map((item) => (
              <a href={item.href} target="_blank" rel="me noopener noreferrer" aria-label={item.label} title={item.label} key={item.id}>
                <SocialIcon id={item.id} />
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        ) : null}
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Notes</p>
            <h2>公开记录</h2>
          </div>
          <span>{authoredNotes.length} 篇</span>
        </div>
        {authoredNotes.length > 0 ? (
          <div className="note-list">
            {authoredNotes.map((note) => (
              <NoteCard note={note} key={note.slug} />
            ))}
          </div>
        ) : (
          <p className="empty-state">还没有公开记录。</p>
        )}
      </section>
    </SiteShell>
  );
}
