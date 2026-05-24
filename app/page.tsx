import { BookOpen, Edit3, UploadCloud } from "lucide-react";
import { NoteCard } from "@/components/note-card";
import { SiteShell } from "@/components/site-shell";
import { getNotes, getSectionStats } from "@/lib/notes";
import { sections } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const notes = await getNotes({ status: "published" });
  const stats = getSectionStats(notes);
  const recent = notes.slice(0, 8);

  return (
    <SiteShell active="home">
      <section className="hero-panel">
        <p className="eyebrow">limenauts</p>
        <h1>把项目之外的日子，也认真收起来。</h1>
        <p className="hero-copy">
          这里会放随笔、日记、旅行记录、小巧思和活动经历。动态新版会继续保留旧站的个人空间感，
          先把写作、图片上传和后台发布做稳，再慢慢扩展成手机应用也能共用的内容系统。
        </p>
        <div className="hero-actions" aria-label="快捷操作">
          <a className="primary-link" href="/admin">
            <Edit3 size={18} />
            写新记录
          </a>
          <a className="secondary-link" href="#recent">
            <BookOpen size={18} />
            看最近
          </a>
          <a className="secondary-link" href="/admin#upload">
            <UploadCloud size={18} />
            上传图片
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
