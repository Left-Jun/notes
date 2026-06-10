import type { Section } from "@/lib/types";

export const siteName = "limenauts";
export const siteTitle = "limenauts | 阈限手记";
export const siteDescription = "写下项目之外的日子：随笔、日记，以及一些作为标签慢慢留下的小念头。";
export const developerEmail = "leftjun@leftjun.com";

export const sections: Section[] = [
  {
    id: "home",
    label: "首页",
    mark: "⌁",
    description: "最近记录和站点入口。"
  },
  {
    id: "posts",
    label: "随笔",
    mark: "✎",
    description: "偏长一点的想法、观察、复盘和闲谈。"
  },
  {
    id: "diary",
    label: "日记",
    mark: "●",
    description: "短一点的近况，允许碎片化。"
  },
  {
    id: "all",
    label: "全部",
    mark: "◼",
    description: "按时间倒序查看全部公开记录。"
  },
  {
    id: "about",
    label: "关于",
    mark: "?",
    description: "这个小站的定位和记录规则。"
  }
];

export const socialLinks = [
  {
    id: "github",
    label: "GitHub",
    href: "https://github.com/Left-Jun"
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@Limenaut"
  },
  {
    id: "bilibili",
    label: "Bilibili",
    href: "https://space.bilibili.com/498452594?spm_id_from=333.1007.0.0"
  },
  {
    id: "xiaohongshu",
    label: "小红书",
    href: "https://www.xiaohongshu.com/user/profile/608d850d000000000100987d"
  }
];

const sectionAliasTags: Record<string, string> = {
  travel: "旅行",
  ideas: "小巧思",
  events: "活动"
};

export function normalizeSectionId(id?: string | null) {
  if (id === "diary") return "diary";
  if (id === "home" || id === "all" || id === "about") return id;
  return "posts";
}

export function sectionAliasTag(id?: string | null) {
  return id ? sectionAliasTags[id] : undefined;
}

export function getSection(id: string) {
  const normalized = normalizeSectionId(id);
  return sections.find((section) => section.id === normalized);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}
