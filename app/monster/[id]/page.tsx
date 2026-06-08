import { ArrowLeft, HeartHandshake } from "lucide-react";
import { notFound } from "next/navigation";
import { MoodRepairGame } from "@/components/mood-repair-game";
import { SiteShell } from "@/components/site-shell";
import { getMoodEntries, getMoodMonster } from "@/lib/mood";
import { getNotes } from "@/lib/notes";
import { buildSearchEntries } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function MonsterPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ entry?: string; slug?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const monster = getMoodMonster(id);

  if (!monster) {
    notFound();
  }

  const notes = await getNotes({ status: "published" });
  const searchEntries = buildSearchEntries(notes);
  const targetEntry = getMoodEntries(notes).find((entry) => entry.id === query.entry || entry.noteSlug === query.slug);
  const supportCount = targetEntry?.supportCount ?? monster.supportCount;

  return (
    <SiteShell active="square" searchEntries={searchEntries}>
      <section className="list-hero monster-hero">
        <p className="eyebrow">Repair Game</p>
        <h1>{monster.name}</h1>
        <p>{monster.summary}</p>
        <div className="hero-actions">
          <a className="secondary-link" href="/square">
            <ArrowLeft size={18} />
            回到广场
          </a>
          <a className="primary-link" href="/mood">
            <HeartHandshake size={18} />
            心情小径
          </a>
        </div>
      </section>

      <section className="content-section monster-layout">
        <MoodRepairGame
          monster={monster}
          entryId={targetEntry?.id || query.entry || null}
          noteSlug={targetEntry?.noteSlug || query.slug || null}
          initialSupportCount={supportCount}
        />
        <aside className="monster-brief">
          <span>{monster.tone}</span>
          <h2>它从哪里来</h2>
          <p>{monster.source}</p>
          {targetEntry ? (
            <>
              <h2>正在帮助</h2>
              <p>{targetEntry.title}</p>
            </>
          ) : null}
          <h2>收到的支持</h2>
          <p>{supportCount} 次轻量回应已经让它松动了一点。</p>
        </aside>
      </section>
    </SiteShell>
  );
}
