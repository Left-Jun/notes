import { BookOpen, Feather, Heart, Home, Mail, MessageCircle, Plus, UserRound } from "lucide-react";
import { AuthQuickEntry, MobileProfileNavItem, SidebarAdminLink, SidebarProfile } from "@/components/profile-client";
import { MobileNavController, SidebarCollapseButton } from "@/components/sidebar-controls";
import { SiteSearch, type SiteSearchEntry } from "@/components/site-search";
import { ThemeToggle } from "@/components/theme-toggle";

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
      mark: <Home size={18} />,
      description: "回到最近记录。"
    },
    {
      id: "posts",
      href: "/category/posts",
      label: "随笔",
      mark: <BookOpen size={18} />,
      description: "偏长一点的想法。"
    },
    {
      id: "diary",
      href: "/category/diary",
      label: "日记",
      mark: <Feather size={18} />,
      description: "短一点的近况。"
    },
    {
      id: "square",
      href: "/square",
      label: "情绪广场",
      mark: <MessageCircle size={18} />,
      description: "看公开的情绪求助。"
    },
    {
      id: "mood",
      href: "/mood",
      label: "情绪小站",
      mark: <Heart size={18} />,
      description: "记录自己的情绪。"
    },
    {
      id: "contact",
      href: "/contact",
      label: "联系开发者",
      mark: <Mail size={18} />,
      description: "邮箱和站点维护信息。"
    },
    {
      id: "auth",
      href: "/me",
      label: "我的",
      mark: <UserRound size={18} />,
      description: "个人主页与账号。"
    }
  ];
  const mobileNav = [
    { id: "home", href: "/", label: "主页", icon: <Home size={17} /> },
    { id: "square", href: "/square", label: "广场", icon: <MessageCircle size={17} /> },
    { id: "mood", href: "/mood", label: "情绪", icon: <Heart size={17} /> }
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
            <SidebarAdminLink active={active === "admin"} />
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
        {mobileNav.slice(0, 2).map((section) => (
          <a
            className={active === section.id ? "is-active" : ""}
            href={section.href}
            aria-current={active === section.id ? "page" : undefined}
            key={section.id}
          >
            <span aria-hidden="true">{section.icon}</span>
            <span>{section.label}</span>
          </a>
        ))}
        <a className={active === "admin" ? "mobile-create-link is-active" : "mobile-create-link"} href="/admin" aria-label="写新记录" aria-current={active === "admin" ? "page" : undefined}>
          <Plus size={24} aria-hidden="true" />
        </a>
        {mobileNav.slice(2).map((section) => (
          <a
            className={active === section.id ? "is-active" : ""}
            href={section.href}
            aria-current={active === section.id ? "page" : undefined}
            key={section.id}
          >
            <span aria-hidden="true">{section.icon}</span>
            <span>{section.label}</span>
          </a>
        ))}
        <MobileProfileNavItem active={active === "auth"} />
      </nav>
    </>
  );
}
