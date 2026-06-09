import { notFound } from "next/navigation";
import { MoodRepairGame } from "@/components/mood-repair-game";
import { SiteShell } from "@/components/site-shell";
import { getMoodEntries, getMoodMonster } from "@/lib/mood";
import { getMoodEntryRecordById, getPublicMoodEntryRecords } from "@/lib/mood-records";
import { getNotes } from "@/lib/notes";
import { buildSearchEntries } from "@/lib/search";

type MonsterSearchParams = {
  moodEntry?: string | string[];
  entry?: string | string[];
  slug?: string | string[];
};

type MonsterPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<MonsterSearchParams>;
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function MonsterPage({ params, searchParams }: MonsterPageProps) {
  const [{ id }, notes, publicMoodEntries] = await Promise.all([
    params,
    getNotes({ status: "published" }),
    getPublicMoodEntryRecords()
  ]);
  const query: MonsterSearchParams = searchParams ? await searchParams : {};
  const monster = getMoodMonster(id);

  if (!monster) {
    notFound();
  }

  const requestedMoodEntryId = firstParam(query.moodEntry || query.entry);
  const requestedMoodEntry = requestedMoodEntryId ? await getMoodEntryRecordById(requestedMoodEntryId) : null;
  const targetMoodEntry =
    requestedMoodEntry && requestedMoodEntry.privacy !== "private"
      ? requestedMoodEntry
      : publicMoodEntries.find((entry) => entry.monsterId === monster.id) || null;

  const legacyEntries = getMoodEntries(notes);
  const legacyEntry = legacyEntries.find((entry) => entry.id === firstParam(query.entry) || entry.noteSlug === firstParam(query.slug));
  const searchEntries = buildSearchEntries(notes);
  const contextTitle = targetMoodEntry ? `${targetMoodEntry.mood} · ${targetMoodEntry.coreReason}` : legacyEntry?.title || monster.source;
  const contextSummary = targetMoodEntry?.note || targetMoodEntry?.nextAction || legacyEntry?.summary || monster.summary;

  return (
    <SiteShell active="square" searchEntries={searchEntries}>
      <section className="list-hero monster-hero">
        <div>
          <p className="eyebrow">Mood Monster</p>
          <h1>{monster.name}</h1>
          <p>{monster.summary}</p>
        </div>
        <div className="hero-actions">
          <a className="primary-link" href="/square">
            回到广场
          </a>
          <a className="secondary-link" href="/mood">
            我的情绪小站
          </a>
        </div>
      </section>

      <section className="monster-layout">
        <MoodRepairGame
          monster={monster}
          moodEntryId={targetMoodEntry?.id || null}
          entryId={legacyEntry?.id || null}
          noteSlug={legacyEntry?.noteSlug || null}
          initialSupportCount={targetMoodEntry?.supportCount ?? legacyEntry?.supportCount ?? monster.supportCount}
        />
        <aside className="mood-side-panel" aria-label="被支持的情绪">
          <div>
            <strong>这次面对的是</strong>
            <p>{contextTitle}</p>
          </div>
          <div>
            <strong>修复提示</strong>
            <p>{contextSummary}</p>
          </div>
          <div>
            <strong>鼓励去向</strong>
            <p>{targetMoodEntry ? "互动完成后会进入对方自己的情绪小站收件箱。" : "旧文章支持会继续累加在文章心情记录里。"}</p>
          </div>
        </aside>
      </section>
    </SiteShell>
  );
}
