import { ArrowRight, BarChart3, HeartHandshake, LineChart, ShieldCheck } from "lucide-react";
import type { CSSProperties } from "react";
import { SiteShell } from "@/components/site-shell";
import {
  buildMoodDistribution,
  buildMoodEntriesFromNotes,
  buildMoodInsight,
  buildMoodTrend,
  buildMonsterStatus,
  getMoodEntries
} from "@/lib/mood";
import { getNotes } from "@/lib/notes";
import { buildSearchEntries } from "@/lib/search";

export const dynamic = "force-dynamic";

function trendStyle(intensity: number): CSSProperties & Record<"--trend-width", string> {
  return {
    height: `${Math.max(intensity, 8)}%`,
    "--trend-width": `${intensity}%`
  };
}

export default async function StatsPage() {
  const notes = await getNotes({ status: "published" });
  const searchEntries = buildSearchEntries(notes);
  const realMoodEntries = buildMoodEntriesFromNotes(notes);
  const moodEntries = getMoodEntries(notes);
  const trend = buildMoodTrend(moodEntries);
  const distribution = buildMoodDistribution(moodEntries);
  const monsters = buildMonsterStatus(moodEntries);
  const insight = buildMoodInsight(moodEntries);
  const isFallback = realMoodEntries.length === 0;

  return (
    <SiteShell active="stats" searchEntries={searchEntries}>
      <section className="list-hero stats-hero">
        <p className="eyebrow">Mood Review</p>
        <h1>把状态慢慢看清楚。</h1>
        <p>
          这里不做打卡排名，也不急着给情绪下结论。它只是把最近的心情强度、公开方式、
          互助次数和坏心情怪兽整理成一个能回看的面板。
        </p>
        <div className="hero-actions">
          <a className="primary-link" href="/mood">
            <LineChart size={18} />
            回到心情小径
          </a>
          <a className="secondary-link" href="/square">
            <HeartHandshake size={18} />
            看匿名广场
          </a>
        </div>
      </section>

      {isFallback ? (
        <div className="privacy-strip">
          <ShieldCheck size={18} />
          <span>当前使用原型样例生成回顾；发布带心情字段的记录后，这里会自动切换到真实数据。</span>
        </div>
      ) : null}

      <section className="stats-layout content-section">
        <article className="stats-panel stats-panel--wide">
          <div className="stats-panel__head">
            <div>
              <p className="eyebrow">Trend</p>
              <h2>心情强度</h2>
            </div>
            <LineChart size={20} />
          </div>
          <div className="trend-chart" aria-label="最近心情强度">
            {trend.map((point) => (
              <div className="trend-chart__item" key={`${point.label}-${point.title}`}>
                <div className="trend-chart__bar" title={`${point.title}：${point.intensity}`}>
                  <span style={trendStyle(point.intensity)} />
                </div>
                <strong>{point.intensity}</strong>
                <small>{point.label}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="stats-panel">
          <div className="stats-panel__head">
            <div>
              <p className="eyebrow">Insight</p>
              <h2>当前判断</h2>
            </div>
            <BarChart3 size={20} />
          </div>
          <div className="insight-card">
            <strong>{insight.title}</strong>
            <p>{insight.body}</p>
          </div>
        </article>
      </section>

      <section className="stats-layout content-section">
        <article className="stats-panel">
          <div className="stats-panel__head">
            <div>
              <p className="eyebrow">Mood Mix</p>
              <h2>心情分布</h2>
            </div>
          </div>
          <div className="distribution-list">
            {distribution.map((item) => (
              <div className="distribution-row" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.count} 条</span>
                </div>
                <div className="distribution-meter" aria-label={`${item.label} ${item.percent}%`}>
                  <span style={{ width: `${item.percent}%` }} />
                </div>
                <em>{item.percent}%</em>
              </div>
            ))}
          </div>
        </article>

        <article className="stats-panel">
          <div className="stats-panel__head">
            <div>
              <p className="eyebrow">Monsters</p>
              <h2>修复对象</h2>
            </div>
          </div>
          <div className="monster-status-list">
            {monsters.map((monster) => (
              <a href={`/monster/${monster.id}`} className="monster-status-row" key={monster.id}>
                <div>
                  <strong>{monster.name}</strong>
                  <span>{monster.tone}</span>
                </div>
                <small>{monster.count} 条 / {monster.supportCount} 次支持 / 强度 {monster.averageIntensity}</small>
                <ArrowRight size={16} />
              </a>
            ))}
          </div>
        </article>
      </section>
    </SiteShell>
  );
}
