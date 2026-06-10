import { SiteShell } from "@/components/site-shell";
import { getMoodMonster, getPublicMoodEntries } from "@/lib/mood";
import { getPublicMoodEntryRecords } from "@/lib/mood-records";
import { getNotes } from "@/lib/notes";
import { displayProfile } from "@/lib/profile";
import { buildSearchEntries } from "@/lib/search";
import type { MoodPrivacy, UserProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

type SquareEntry = {
  id: string;
  href: string;
  mood: string;
  intensity: number;
  coreReason: string;
  note?: string | null;
  tags: string[];
  privacy: MoodPrivacy;
  monsterId?: string | null;
  supportCount: number;
  recordedAt: string;
  profile?: UserProfile | null;
};

function privacyCopy(value: MoodPrivacy) {
  if (value === "anonymous") return "匿名公开";
  if (value === "summary") return "摘要公开";
  return "私密";
}

function moodRecordHref(entry: { id: string; monsterId?: string | null }) {
  const monsterId = entry.monsterId || "pressure-bloom";
  return `/monster/${monsterId}?moodEntry=${encodeURIComponent(entry.id)}`;
}

function legacyMoodHref(entry: { id: string; noteSlug?: string; monsterId?: string | null }) {
  const monsterId = entry.monsterId || "pressure-bloom";
  const queryKey = entry.noteSlug ? "slug" : "entry";
  const queryValue = entry.noteSlug || entry.id;
  return `/monster/${monsterId}?${queryKey}=${encodeURIComponent(queryValue)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export default async function MoodSquarePage() {
  const [notes, publicMoodRecords] = await Promise.all([getNotes({ status: "published" }), getPublicMoodEntryRecords()]);
  const searchEntries = buildSearchEntries(notes);
  const publicEntries: SquareEntry[] =
    publicMoodRecords.length > 0
      ? publicMoodRecords.map((entry) => ({
          id: entry.id,
          href: moodRecordHref(entry),
          mood: entry.mood,
          intensity: entry.intensity,
          coreReason: entry.coreReason,
          note: entry.note,
          tags: entry.tags,
          privacy: entry.privacy,
          monsterId: entry.monsterId,
          supportCount: entry.supportCount,
          recordedAt: entry.recordedAt,
          profile: entry.profile
        }))
      : getPublicMoodEntries(notes).map((entry) => ({
          id: entry.id,
          href: legacyMoodHref(entry),
          mood: entry.mood,
          intensity: entry.intensity,
          coreReason: entry.title,
          note: entry.summary,
          tags: entry.tags,
          privacy: entry.privacy,
          monsterId: entry.monsterId,
          supportCount: entry.supportCount,
          recordedAt: entry.date,
          profile: null
        }));

  return (
    <SiteShell active="square" searchEntries={searchEntries}>
      <section className="list-hero mood-square-hero">
        <div>
          <p className="eyebrow">Mood Square</p>
          <h1>匿名情绪广场</h1>
          <p>这里只出现用户主动公开的摘要或匿名情绪。你可以留下一句轻量鼓励，鼓励会进入对方自己的情绪小站。</p>
        </div>
        <div className="hero-actions">
          <a className="primary-link" href="/mood">
            回到我的情绪小站
          </a>
        </div>
      </section>

      {publicEntries.length > 0 ? (
        <section className="mood-square-grid" aria-label="公开情绪记录">
          {publicEntries.map((entry) => {
            const monster = getMoodMonster(entry.monsterId || "pressure-bloom");
            const profile = entry.privacy === "summary" ? displayProfile(entry.profile) : null;

            return (
              <article className="mood-square-card" key={entry.id}>
                <div className="mood-square-card__top">
                  <span>{privacyCopy(entry.privacy)}</span>
                  <span>{formatDate(entry.recordedAt)}</span>
                </div>
                <h2>{entry.mood}</h2>
                <p>{entry.coreReason}</p>
                {entry.note && entry.privacy === "summary" ? <p className="mood-square-card__note">{entry.note}</p> : null}
                <div className="mood-square-card__tags">
                  <span>强度 {entry.intensity}</span>
                  {profile ? <span>{profile.displayName}</span> : <span>匿名朋友</span>}
                  {entry.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="mood-square-card__support">
                  <span>{entry.supportCount} 次支持</span>
                  <a href={entry.href}>{monster ? `帮 TA 击败${monster.name}` : "帮 TA 轻轻推一下"}</a>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="content-section mood-empty-state mood-empty-state--wide">
          <p>广场暂时还没有公开情绪。把自己的记录设为“摘要公开”或“匿名公开”后，这里会出现可以被支持的小小信号。</p>
          <a className="primary-link" href="/mood">
            写一条情绪记录
          </a>
        </section>
      )}
    </SiteShell>
  );
}
