export type NoteStatus = "published" | "draft";
export type MoodPrivacy = "private" | "anonymous" | "summary";
export type SocialPlatform = "website" | "github" | "youtube" | "bilibili" | "xiaohongshu" | "instagram" | "weibo";

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
  moodEntryId?: string | null;
  monsterId: string;
  action: string;
  message?: string | null;
  createdAt: string;
};

export type MoodEntryRecord = {
  id: string;
  profileId: string;
  profile?: UserProfile | null;
  mood: string;
  intensity: number;
  coreReason: string;
  nextAction: string;
  note?: string | null;
  tags: string[];
  privacy: MoodPrivacy;
  monsterId?: string | null;
  supportCount: number;
  recordedAt: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MoodEncouragement = {
  id: string;
  moodEntryId: string;
  receiverProfileId: string;
  senderProfileId?: string | null;
  senderProfile?: UserProfile | null;
  action: string;
  message: string;
  createdAt: string;
};

export type MoodDailyGroup = {
  date: string;
  label: string;
  entries: MoodEntryRecord[];
  averageIntensity: number;
  dominantMood: string;
};

export type MoodCoreSummary = {
  title: string;
  mood: string;
  intensity: number;
  entryCount: number;
  coreReason: string;
  nextAction: string;
  recordedAt?: string;
};

export type Section = {
  id: string;
  label: string;
  mark: string;
  description: string;
};
