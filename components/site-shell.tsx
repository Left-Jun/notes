import { BookOpen, Home, LayoutDashboard, Moon, PenLine, Sparkles } from "lucide-react";
import Image from "next/image";
import { SocialIcon } from "@/components/social-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { sections, siteName, socialLinks } from "@/lib/site";

type SiteShellProps = {
  active?: string;
  children: React.ReactNode;
};

export function SiteShell({ active = "home", children }: SiteShellProps) {
  const nav = sections.filter((section) => !["all"].includes(section.id));

  return (
    <div className="site-shell">
      <aside className="site-sidebar">
        <div className="profile">
          <div className="profile-head">
            <a className="avatar-wrap" href="/" aria-label="返回首页">
              <Image className="avatar" src="/img/avatar.jpg" alt="limenauts avatar" width={112} height={112} priority />
              <span className="avatar-status" tabIndex={0} aria-label="动态站已接入发布后台">
                <span aria-hidden="true">✦</span>
                <span className="status-popover" role="tooltip">
                  <strong>动态站接入中</strong>
                  <small>先把写作、发布和图片上传做稳，移动端应用以后再接登录体系。</small>
                </span>
              </span>
            </a>
          </div>
          <div className="profile-copy">
            <p className="profile-name">{siteName}</p>
            <p className="profile-subtitle">阈限手记：随笔、日记、旅行与一些突然冒出来的小想法。</p>
          </div>
          <div className="profile-social" aria-label="社交链接">
            {socialLinks.map((item) => (
              <a href={item.href} target="_blank" rel="me noopener noreferrer" aria-label={item.label} title={item.label} key={item.id}>
                <SocialIcon id={item.id} />
              </a>
            ))}
          </div>
        </div>

        <nav className="main-nav" aria-label="主导航">
          {nav.map((section) => (
            <a className={active === section.id ? "is-active" : ""} href={section.id === "home" ? "/" : section.id === "about" ? "/category/all" : `/category/${section.id}`} key={section.id}>
              <span aria-hidden="true">{section.mark}</span>
              <span>{section.label}</span>
            </a>
          ))}
          <a className={active === "admin" ? "is-active" : ""} href="/admin">
            <LayoutDashboard size={18} />
            <span>后台</span>
          </a>
        </nav>

        <div className="sidebar-status">
          <div>
            <Sparkles size={16} />
            <span>发布状态</span>
          </div>
          <small>本地可演示发布；线上通过 Supabase 和发布口令写入。</small>
        </div>

        <div className="sidebar-bottom">
          <ThemeToggle />
        </div>
      </aside>

      <main className="site-main" id="content">
        {children}
        <footer className="site-footer">
          <span>© 2026-{new Date().getFullYear()} limenauts</span>
          <span>Built with Next.js and Supabase</span>
        </footer>
      </main>
    </div>
  );
}

export const navIcons = { Home, PenLine, BookOpen, Moon };
