import { Archive, Gamepad2, Heart, Home, LayoutDashboard, LineChart, MessageCircle, PenLine, Sparkles } from "lucide-react";
import { AuthQuickEntry, SidebarProfile } from "@/components/profile-client";
import { MobileNavController, SidebarCollapseButton, SidebarWheelController } from "@/components/sidebar-controls";
import { SiteSearch, type SiteSearchEntry } from "@/components/site-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { sections } from "@/lib/site";

type SiteShellProps = {
  active?: string;
  children: React.ReactNode;
  searchEntries?: SiteSearchEntry[];
};

export function SiteShell({ active = "home", children, searchEntries = [] }: SiteShellProps) {
  const nav = sections.filter((section) => !["all"].includes(section.id));
  const featureNav = [
    {
      id: "mood",
      href: "/mood",
      label: "心情",
      description: "心情日记、状态回顾和坏心情怪兽。",
      icon: <Heart size={18} />
    },
    {
      id: "square",
      href: "/square",
      label: "广场",
      description: "匿名心情摘要和轻量互助。",
      icon: <MessageCircle size={18} />
    },
    {
      id: "stats",
      href: "/stats",
      label: "回顾",
      description: "心情趋势、分布和修复状态。",
      icon: <LineChart size={18} />
    }
  ];
  const mobileNav = [
    { id: "home", href: "/", label: "首页", mark: sections.find((section) => section.id === "home")?.mark || "⌁" },
    { id: "diary", href: "/category/diary", label: "日记", mark: sections.find((section) => section.id === "diary")?.mark || "●" },
    { id: "mood", href: "/mood", label: "心情", icon: <Heart size={17} /> },
    { id: "square", href: "/square", label: "广场", icon: <MessageCircle size={17} /> },
    { id: "all", href: "/category/all", label: "全部", mark: sections.find((section) => section.id === "all")?.mark || "◼" }
  ];

  return (
    <>
      <MobileNavController />
      <SidebarWheelController />
      <div className="site-shell">
        <aside className="site-sidebar">
          <div className="sidebar-top">
            <a className="sidebar-brand" href="/" aria-label="limenauts 阈限手记首页">
              <img
                className="sidebar-brand__logo sidebar-brand__logo--mark"
                src="/brand/lj-mark.png"
                alt=""
                width={4096}
                height={3855}
                aria-hidden="true"
              />
              <img
                className="sidebar-brand__logo sidebar-brand__logo--lockup"
                src="/brand/limenauts_horizontal_transparent.png"
                alt=""
                width={2048}
                height={684}
                aria-hidden="true"
              />
            </a>

            <SidebarProfile />
          </div>

          <div className="sidebar-scroll">
            <nav className="main-nav" aria-label="主导航">
              {nav.map((section) => (
                <a
                  className={active === section.id ? "is-active" : ""}
                  href={section.id === "home" ? "/" : section.id === "about" ? "/category/all" : `/category/${section.id}`}
                  title={section.description}
                  aria-current={active === section.id ? "page" : undefined}
                  key={section.id}
                >
                  <span aria-hidden="true">{section.mark}</span>
                  <span>{section.label}</span>
                </a>
              ))}
              {featureNav.map((item) => (
                <a
                  className={active === item.id ? "is-active" : ""}
                  href={item.href}
                  title={item.description}
                  aria-current={active === item.id ? "page" : undefined}
                  key={item.id}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              ))}
              <a className={active === "admin" ? "is-active" : ""} href="/admin" aria-current={active === "admin" ? "page" : undefined}>
                <LayoutDashboard size={18} />
                <span>后台</span>
              </a>
            </nav>

            <div className="sidebar-quick-actions" aria-label="快捷入口">
              <a className={active === "all" ? "is-active" : ""} href="/category/all">
                <Archive size={16} />
                <span>全部记录</span>
              </a>
              <a className={active === "mood" ? "is-active" : ""} href="/mood">
                <Gamepad2 size={16} />
                <span>心情小径</span>
              </a>
              <a className={active === "stats" ? "is-active" : ""} href="/stats">
                <LineChart size={16} />
                <span>状态回顾</span>
              </a>
              <a href="/admin">
                <PenLine size={16} />
                <span>写新记录</span>
              </a>
            </div>

            <div className="sidebar-status">
              <div>
                <Sparkles size={16} />
                <span>记录状态</span>
              </div>
              <small>{searchEntries.length || "本地"} 篇公开记录；保持轻量写作，不把日常整理成第二个作品集。</small>
            </div>
          </div>

          <div className="sidebar-bottom">
            <SidebarCollapseButton />
          </div>
        </aside>

        <div className="site-toolbar" aria-label="站内工具">
          <div className="site-toolbar__copy">
            <strong>{searchEntries.length > 0 ? "记录索引" : "站内工具"}</strong>
            <span>{searchEntries.length > 0 ? `${searchEntries.length} 篇公开记录` : "搜索、主题与账号入口"}</span>
          </div>
          <div className="site-toolbar__actions">
            <SiteSearch entries={searchEntries} />
            <ThemeToggle />
            <a className="toolbar-icon-link" href="/" aria-label="回到主页" title="回到主页">
              <Home size={18} />
            </a>
            <AuthQuickEntry />
          </div>
        </div>

        <main className="site-main" id="content">
          {children}
          <footer className="site-footer">
            <span>© 2026-{new Date().getFullYear()} limenauts</span>
            <span>Built with Next.js and Supabase</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-bottom-nav" aria-label="移动端主导航">
        {mobileNav.map((section) => (
          <a
            className={active === section.id ? "is-active" : ""}
            href={section.href}
            aria-current={active === section.id ? "page" : undefined}
            key={section.id}
          >
            <span aria-hidden="true">{section.icon || section.mark}</span>
            <span>{section.label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
