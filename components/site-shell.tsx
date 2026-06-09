import { Heart, Home, LayoutDashboard } from "lucide-react";
import { AuthQuickEntry, MobileProfileNavItem, SidebarProfile } from "@/components/profile-client";
import { MobileNavController, SidebarCollapseButton } from "@/components/sidebar-controls";
import { SiteSearch, type SiteSearchEntry } from "@/components/site-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { sections } from "@/lib/site";

type SiteShellProps = {
  active?: string;
  children: React.ReactNode;
  searchEntries?: SiteSearchEntry[];
};

export function SiteShell({ active = "home", children, searchEntries = [] }: SiteShellProps) {
  const nav = [
    {
      id: "home",
      href: "/",
      label: "首页",
      mark: sections.find((section) => section.id === "home")?.mark || "⌁",
      description: "回到最近记录。"
    },
    {
      id: "posts",
      href: "/category/posts",
      label: "随笔",
      mark: sections.find((section) => section.id === "posts")?.mark || "✎",
      description: "偏长一点的想法。"
    },
    {
      id: "diary",
      href: "/category/diary",
      label: "日记",
      mark: sections.find((section) => section.id === "diary")?.mark || "●",
      description: "短一点的近况。"
    },
    {
      id: "mood",
      href: "/mood",
      label: "心情",
      mark: <Heart size={18} />,
      description: "心情小径。"
    },
    {
      id: "all",
      href: "/category/all",
      label: "全部",
      mark: sections.find((section) => section.id === "all")?.mark || "◼",
      description: "全部公开记录。"
    }
  ];
  const mobileNav = [
    { id: "home", href: "/", label: "首页", mark: sections.find((section) => section.id === "home")?.mark || "⌁" },
    { id: "diary", href: "/category/diary", label: "日记", mark: sections.find((section) => section.id === "diary")?.mark || "●" },
    { id: "mood", href: "/mood", label: "心情", icon: <Heart size={17} /> },
    { id: "all", href: "/category/all", label: "全部", mark: sections.find((section) => section.id === "all")?.mark || "◼" }
  ];

  return (
    <>
      <MobileNavController />
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
                  href={section.href}
                  title={section.description}
                  aria-current={active === section.id ? "page" : undefined}
                  key={section.id}
                >
                  <span aria-hidden="true">{section.mark}</span>
                  <span>{section.label}</span>
                </a>
              ))}
            </nav>
          </div>

          <div className="sidebar-bottom">
            <a className={active === "admin" ? "sidebar-admin-link is-active" : "sidebar-admin-link"} href="/admin" aria-current={active === "admin" ? "page" : undefined}>
              <LayoutDashboard size={17} />
              <span>后台</span>
            </a>
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
        <MobileProfileNavItem active={active === "auth"} />
      </nav>
    </>
  );
}
