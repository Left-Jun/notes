import { Gamepad2, HeartHandshake, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { getMoodMonster, getPublicMoodEntries } from "@/lib/mood";
import { getNotes } from "@/lib/notes";
import { buildSearchEntries } from "@/lib/search";
import { formatDate } from "@/lib/site";

export const dynamic = "force-dynamic";

function monsterHref(monsterId: string, entry: { id: string; noteSlug?: string }) {
  const params = new URLSearchParams({ entry: entry.id });
  if (entry.noteSlug) {
    params.set("slug", entry.noteSlug);
  }
  return `/monster/${monsterId}?${params.toString()}`;
}

export default async function MoodSquarePage() {
  const notes = await getNotes({ status: "published" });
  const searchEntries = buildSearchEntries(notes);
  const publicEntries = getPublicMoodEntries(notes);

  return (
    <SiteShell active="square" searchEntries={searchEntries}>
      <section className="list-hero mood-square-hero">
        <p className="eyebrow">Mood Square</p>
        <h1>匿名心情广场</h1>
        <p>
          这里不追求热闹，只放愿意被看见的一小段心情。别人可以帮忙削弱坏心情怪兽，
          也可以留下一句轻一点的支持。
        </p>
      </section>

      <div className="privacy-strip">
        <ShieldCheck size={18} />
        <span>广场原型默认隐藏身份；完整日记仍留在个人记录里。</span>
      </div>

      <section className="mood-square-grid" aria-label="公开心情">
        {publicEntries.map((entry) => {
          const monster = getMoodMonster(entry.monsterId);
          return (
            <article className="mood-square-card" key={entry.id}>
              <div className="mood-square-card__top">
                <span>{entry.privacy === "anonymous" ? "匿名" : "摘要"}</span>
                <time dateTime={entry.date}>{formatDate(entry.date)}</time>
              </div>
              <h2>{entry.title}</h2>
              <p>{entry.summary}</p>
              <div className="mood-square-card__tags">
                {entry.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
              <div className="mood-square-card__support">
                <span>
                  <HeartHandshake size={15} />
                  {entry.supportCount} 次支持
                </span>
                {monster ? (
                  <a href={monsterHref(monster.id, entry)}>
                    <Gamepad2 size={15} />
                    帮 TA 一下
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>
    </SiteShell>
  );
}
