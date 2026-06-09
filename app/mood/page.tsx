import { MoodStationClient } from "@/components/mood-station-client";
import { SiteShell } from "@/components/site-shell";
import { getNotes } from "@/lib/notes";
import { buildSearchEntries } from "@/lib/search";

export default async function MoodPage() {
  const notes = await getNotes({ status: "published" });
  const searchEntries = buildSearchEntries(notes);

  return (
    <SiteShell active="mood" searchEntries={searchEntries}>
      <section className="list-hero mood-hero mood-hero--compact">
        <div>
          <p className="eyebrow">Mood Station</p>
          <h1>情绪小站</h1>
          <p>先和压力苔对齐，再写下一条真正有用的新情绪。</p>
        </div>
        <div className="hero-actions">
          <a className="primary-link" href="#new-entry">
            写一条记录
          </a>
          <a className="secondary-link" href="/square">
            去广场看看
          </a>
        </div>
      </section>

      <MoodStationClient />
    </SiteShell>
  );
}
