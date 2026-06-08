export type NoteStatus = "published" | "draft";
export type MoodPrivacy = "private" | "anonymous" | "summary";
export type SocialPlatform = "github" | "youtube" | "bilibili" | "xiaohongshu";

export type ProfileSocialLinks = Partial<Record<SocialPlatform, string>>;

export type UserProfile = {
  id: string;
  authUserId?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  statusEmoji?: string | null;
  statusText?: string | null;
  bio?: string | null;
  socialLinks: ProfileSocialLinks;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Note = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  section: string;
  tags: string[];
  mood?: string | null;
  moodIntensity?: number | null;
  moodPrivacy?: MoodPrivacy | null;
  monsterId?: string | null;
  supportCount?: number;
  location?: string | null;
  coverUrl?: string | null;
  authorProfileId?: string | null;
  authorProfile?: UserProfile | null;
  status: NoteStatus;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
};

export type NoteComment = {
  id: string;
  noteId: string;
  authorName: string;
  authorUrl?: string | null;
  body: string;
  status: "pending" | "approved" | "hidden";
  createdAt: string;
};

export type MoodSupportAction = {
  id: string;
  noteId?: string | null;
  noteSlug?: string | null;
  monsterId: string;
  action: string;
  createdAt: string;
};

export type Section = {
  id: string;
  label: string;
  mark: string;
  description: string;
};
