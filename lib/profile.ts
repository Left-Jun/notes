import type { ProfileSocialLinks, SocialPlatform, UserProfile } from "@/lib/types";

export const deletedProfileName = "已注销账号";

export const socialPlatforms: Array<{
  id: SocialPlatform;
  label: string;
  placeholder: string;
}> = [
  {
    id: "website",
    label: "个人网站",
    placeholder: "https://leftjun.com"
  },
  {
    id: "github",
    label: "GitHub",
    placeholder: "https://github.com/Left-Jun"
  },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "https://www.youtube.com/@Limenaut"
  },
  {
    id: "bilibili",
    label: "Bilibili",
    placeholder: "https://space.bilibili.com/..."
  },
  {
    id: "xiaohongshu",
    label: "小红书",
    placeholder: "https://www.xiaohongshu.com/user/profile/..."
  },
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "https://www.instagram.com/..."
  },
  {
    id: "weibo",
    label: "微博",
    placeholder: "https://weibo.com/..."
  }
];

export const defaultProfile: UserProfile = {
  id: "site-owner",
  authUserId: null,
  displayName: "limenauts",
  avatarUrl: "/img/avatar.jpg",
  statusEmoji: "✦",
  statusText: "动态站接入中",
  bio: "因为山就在那里。",
  socialLinks: {
    website: "https://leftjun.com",
    github: "https://github.com/Left-Jun",
    youtube: "https://www.youtube.com/@Limenaut",
    bilibili: "https://space.bilibili.com/498452594?spm_id_from=333.1007.0.0",
    xiaohongshu: "https://www.xiaohongshu.com/user/profile/608d850d000000000100987d"
  },
  deletedAt: null
};

export const deletedProfile: UserProfile = {
  id: "deleted",
  authUserId: null,
  displayName: deletedProfileName,
  avatarUrl: "/img/avatar.jpg",
  statusEmoji: " ",
  statusText: "这个账号已经注销",
  bio: "",
  socialLinks: {},
  deletedAt: new Date(0).toISOString()
};

export function visibleSocialLinks(links?: ProfileSocialLinks | null) {
  return socialPlatforms
    .map((platform) => ({
      ...platform,
      href: links?.[platform.id]?.trim() || ""
    }))
    .filter((item) => item.href);
}

export function displayProfile(profile?: UserProfile | null) {
  if (!profile) return defaultProfile;
  if (profile.deletedAt) return { ...deletedProfile, id: profile.id };
  return {
    ...defaultProfile,
    ...profile,
    socialLinks: profile.socialLinks || {}
  };
}
