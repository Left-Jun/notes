import { Camera, Gamepad2, Heart, LineChart, Lock, PenLine, ShieldCheck, TrendingUp } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { getNotes } from "@/lib/notes";
import { buildSearchEntries } from "@/lib/search";
import { buildMoodOverview, getMoodEntries, getMoodMonster, getPublicMoodEntries, moodRoadmap } from "@/lib/mood";

export const dynamic = "force-dynamic";

export default async function MoodPage() {
  const notes = await getNotes({ status: "published" });
  const searchEntries = buildSearchEntries(notes);
  const moodEntries = getMoodEntries(notes);
  const moodOverview = buildMoodOverview(moodEntries);
  const publicEntries = getPublicMoodEntries(notes);
  const activeMonster = getMoodMonster(publicEntries[0]?.monsterId || "pressure-bloom");

  return (
    <SiteShell active="mood" searchEntries={searchEntries}>
      <section className="list-hero mood-hero">
        <p className="eyebrow">Mood Trail</p>
        <h1>给心情留一条小路。</h1>
        <p>
          这里把随笔站里的日常记录继续往前推一步：心情可以被写下、被匿名递出去，
          也可以变成一只没有那么吓人的坏心情怪兽。
        </p>
        <div className="hero-actions">
          <a className="primary-link" href="/square">
            <Heart size={18} />
            看心情广场
          </a>
          <a className="secondary-link" href={activeMonster ? `/monster/${activeMonster.id}` : "/monster/pressure-bloom"}>
            <Gamepad2 size={18} />
            试一次修复
          </a>
          <a className="secondary-link" href="/stats">
            <LineChart size={18} />
            状态回顾
          </a>
          <a className="secondary-link" href="/admin">
            <PenLine size={18} />
            写新记录
          </a>
        </div>
      </section>

      <section className="mood-overview-grid" aria-label="心情概览">
        {moodOverview.map((item) => (
          <article className="mood-overview-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.note}</p>
          </article>
        ))}
      </section>

      <section className="content-section mood-layout">
        <div>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Private First</p>
              <h2>最近的心情记录</h2>
            </div>
            <span>{moodEntries.length} 条</span>
          </div>
          <div className="mood-entry-list">
            {moodEntries.map((entry) => {
              const monster = getMoodMonster(entry.monsterId);
              return (
                <article className="mood-entry-card" key={entry.id}>
                  <div className="mood-entry-card__head">
                    <span>{entry.mood}</span>
                    <strong>{entry.intensity}</strong>
                  </div>
                  <h3>{entry.title}</h3>
                  <p>{entry.summary}</p>
                  <div className="mood-entry-card__meta">
                    <span>{entry.privacy === "private" ? "私密" : entry.privacy === "anonymous" ? "匿名公开" : "只公开摘要"}</span>
                    {monster ? <a href={`/monster/${monster.id}`}>{monster.name}</a> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="mood-side-panel" aria-label="心情模块边界">
          <div>
            <ShieldCheck size={18} />
            <strong>隐私优先</strong>
            <p>默认不公开完整日记，广场只承接主动选择的匿名摘要。</p>
          </div>
          <div>
            <TrendingUp size={18} />
            <strong>回顾优先</strong>
            <p>先看趋势和状态变化，再考虑打卡、成就或更强的游戏化。</p>
          </div>
          <div>
            <Camera size={18} />
            <strong>AI 预留</strong>
            <p>照片识别只做“建议心情”，不替用户下结论。</p>
          </div>
          <div>
            <Lock size={18} />
            <strong>不医疗化</strong>
            <p>它是记录和互助工具，不包装成诊断或治疗产品。</p>
          </div>
        </aside>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Roadmap</p>
            <h2>功能骨架</h2>
          </div>
        </div>
        <div className="mood-roadmap">
          {moodRoadmap.map((item) => (
            <article className="mood-roadmap-card" key={item.title}>
              <span>{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
