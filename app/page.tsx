import { Archive, BookOpen, Edit3, Gamepad2, Heart, MessageCircle } from "lucide-react";
import { NoteCard } from "@/components/note-card";
import { SiteShell } from "@/components/site-shell";
import { buildMoodOverview, getMoodEntries, getMoodMonster, getPublicMoodEntries } from "@/lib/mood";
import { getNotes, getSectionStats } from "@/lib/notes";
import { buildSearchEntries } from "@/lib/search";
import { sections } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const notes = await getNotes({ status: "published" });
  const stats = getSectionStats(notes);
  const recent = notes.slice(0, 8);
  const searchEntries = buildSearchEntries(notes);
  const moodEntries = getMoodEntries(notes);
  const moodOverview = buildMoodOverview(moodEntries);
  const publicMoodEntries = getPublicMoodEntries(notes);
  const featuredMonster = getMoodMonster(publicMoodEntries[0]?.monsterId || "pressure-bloom");

  return (
    <SiteShell active="home" searchEntries={searchEntries}>
      <section className="hero-panel">
        <p className="eyebrow">limenauts</p>
        <h1>把项目之外的日子，也认真收起来。</h1>
        <p className="hero-copy">
          这里会放随笔、日记、旅行记录、小巧思和活动经历。不是作品集的另一面，
          只是把日常、路上和一些还没成形的念头安静地收好。
        </p>
        <div className="hero-actions" aria-label="快捷操作">
          <a className="primary-link" href="#recent">
            <BookOpen size={18} />
            看最近
          </a>
          <a className="secondary-link" href="/category/all">
            <Archive size={18} />
            全部记录
          </a>
          <a className="secondary-link" href="/admin">
            <Edit3 size={18} />
            写新记录
          </a>
        </div>
      </section>

      <section className="section-grid" aria-label="内容分类">
        {sections
          .filter((section) => section.id !== "home" && section.id !== "about")
          .map((section) => (
            <a className="section-card" href={`/category/${section.id}`} key={section.id}>
              <span className="section-icon" aria-hidden="true">
                {section.mark}
              </span>
              <strong>{section.label}</strong>
              <small>{section.description}</small>
              <em>{section.id === "all" ? notes.length : stats[section.id] || 0} 篇</em>
            </a>
          ))}
      </section>

      <section className="mood-bridge" aria-label="心情小径入口">
        <div className="mood-bridge__copy">
          <p className="eyebrow">Mood Trail</p>
          <h2>把坏心情也放进记录里。</h2>
          <p>
            从日记里延伸出一条更轻的小径：写下状态、匿名递出一点求助，
            再用一个小游戏把压力怪兽削弱一点。
          </p>
        </div>
        <div className="mood-bridge__stats" aria-label="心情状态摘要">
          {moodOverview.map((item) => (
            <span key={item.label}>
              <strong>{item.value}</strong>
              {item.label}
            </span>
          ))}
        </div>
        <div className="mood-bridge__actions">
          <a href="/mood">
            <Heart size={17} />
            心情小径
          </a>
          <a href="/square">
            <MessageCircle size={17} />
            匿名广场
          </a>
          {featuredMonster ? (
            <a href={`/monster/${featuredMonster.id}`}>
              <Gamepad2 size={17} />
              试试小游戏
            </a>
          ) : null}
        </div>
      </section>

      <section className="content-section" id="recent">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Recent Notes</p>
            <h2>最近记录</h2>
          </div>
          <a href="/category/all">全部</a>
        </div>
        <div className="note-list">
          {recent.map((note) => (
            <NoteCard note={note} key={note.slug} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
