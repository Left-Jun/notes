import { defaultProfile } from "@/lib/profile";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ProfileSocialLinks, UserProfile } from "@/lib/types";

export type ProfileRow = {
  id: string;
  auth_user_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  status_emoji: string | null;
  status_text: string | null;
  bio: string | null;
  social_links: ProfileSocialLinks | null;
  deleted_at: string | null;
  created_at?: string;
  updated_at?: string;
};

export function mapProfile(row?: ProfileRow | null): UserProfile | null {
  if (!row) return null;

  return {
    id: row.id,
    authUserId: row.auth_user_id,
    displayName: row.display_name || defaultProfile.displayName,
    avatarUrl: row.avatar_url,
    statusEmoji: row.status_emoji,
    statusText: row.status_text,
    bio: row.bio,
    socialLinks: row.social_links || {},
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function profileToRow(profile: Partial<UserProfile>) {
  return {
    display_name: profile.displayName,
    avatar_url: profile.avatarUrl,
    status_emoji: profile.statusEmoji,
    status_text: profile.statusText,
    bio: profile.bio,
    social_links: profile.socialLinks || {}
  };
}

function defaultDisplayNameForEmail(email?: string | null) {
  const normalized = String(email || "").trim().toLowerCase();
  if (normalized === "limenaut0@gmail.com") return "limenaut";
  if (normalized === "zuo051607@163.com") return "Left Jun";
  return "";
}

export async function getProfileById(id: string) {
  if (!isSupabaseConfigured()) {
    return id === defaultProfile.id ? defaultProfile : null;
  }

  const { data, error } = await getAdminSupabase().from("profiles").select("*").eq("id", id).single();
  if (error || !data) return id === defaultProfile.id ? defaultProfile : null;
  return mapProfile(data as ProfileRow);
}

export async function getProfileByAuthUserId(authUserId: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await getAdminSupabase().from("profiles").select("*").eq("auth_user_id", authUserId).single();
  if (error || !data) return null;
  return mapProfile(data as ProfileRow);
}

export async function ensureProfileForUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const existing = await getProfileByAuthUserId(user.id);
  if (existing) return existing;

  const displayName =
    defaultDisplayNameForEmail(user.email) ||
    String(user.user_metadata?.display_name || user.user_metadata?.name || "").trim() ||
    user.email?.split("@")[0] ||
    defaultProfile.displayName;

  const { data, error } = await getAdminSupabase()
    .from("profiles")
    .insert({
      auth_user_id: user.id,
      display_name: displayName,
      avatar_url: null,
      status_emoji: defaultProfile.statusEmoji,
      status_text: defaultProfile.statusText,
      bio: "",
      social_links: {}
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapProfile(data as ProfileRow);
}

export async function listProfilesByIds(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length || !isSupabaseConfigured()) return new Map<string, UserProfile>();

  const { data, error } = await getAdminSupabase().from("profiles").select("*").in("id", uniqueIds);
  if (error || !data) return new Map<string, UserProfile>();

  return new Map(
    (data as ProfileRow[])
      .map((row) => mapProfile(row))
      .filter((profile): profile is UserProfile => Boolean(profile))
      .map((profile) => [profile.id, profile])
  );
}
