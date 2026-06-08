import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-server";
import { defaultProfile, socialPlatforms } from "@/lib/profile";
import { ensureProfileForUser, getProfileByAuthUserId, mapProfile, profileToRow } from "@/lib/profiles";
import { getAdminSupabase } from "@/lib/supabase";
import type { ProfileSocialLinks, UserProfile } from "@/lib/types";

function cleanText(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

function cleanEmoji(value: unknown) {
  return String(value || defaultProfile.statusEmoji || "✦").trim().slice(0, 8);
}

function cleanUrl(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function cleanAvatarUrl(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("/")) return raw;
  return cleanUrl(raw);
}

function cleanSocialLinks(value: unknown): ProfileSocialLinks {
  const input = (value || {}) as Record<string, unknown>;
  return socialPlatforms.reduce<ProfileSocialLinks>((acc, platform) => {
    const href = cleanUrl(input[platform.id]);
    if (href) acc[platform.id] = href;
    return acc;
  }, {});
}

async function getAuthorizedProfile(request: Request) {
  const { user, error } = await getRequestUser(request);
  if (!user) {
    return { response: NextResponse.json({ error: error || "Unauthorized" }, { status: 401 }) };
  }

  const profile = await ensureProfileForUser(user);
  if (!profile) {
    return { response: NextResponse.json({ error: "Profile could not be created." }, { status: 500 }) };
  }

  return { user, profile };
}

export async function GET(request: Request) {
  const result = await getAuthorizedProfile(request);
  if ("response" in result) return result.response;

  return NextResponse.json({ profile: result.profile });
}

export async function PUT(request: Request) {
  const result = await getAuthorizedProfile(request);
  if ("response" in result) return result.response;

  if (result.profile.deletedAt) {
    return NextResponse.json({ error: "这个账号已经注销。" }, { status: 410 });
  }

  const payload = await request.json();
  const displayName = cleanText(payload.displayName, result.profile.displayName);

  if (displayName.length < 2) {
    return NextResponse.json({ error: "昵称至少需要 2 个字符。" }, { status: 400 });
  }

  const nextProfile: Partial<UserProfile> = {
    displayName: displayName.slice(0, 40),
    avatarUrl: cleanAvatarUrl(payload.avatarUrl) || null,
    statusEmoji: cleanEmoji(payload.statusEmoji),
    statusText: cleanText(payload.statusText, defaultProfile.statusText || "").slice(0, 48),
    bio: cleanText(payload.bio).slice(0, 180),
    socialLinks: cleanSocialLinks(payload.socialLinks)
  };

  const { data, error } = await getAdminSupabase()
    .from("profiles")
    .update(profileToRow(nextProfile))
    .eq("id", result.profile.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: mapProfile(data) });
}

export async function DELETE(request: Request) {
  const result = await getAuthorizedProfile(request);
  if ("response" in result) return result.response;

  const deletedAt = new Date().toISOString();
  const { error } = await getAdminSupabase()
    .from("profiles")
    .update({
      display_name: "已注销账号",
      avatar_url: null,
      status_emoji: "",
      status_text: "这个账号已经注销",
      bio: "",
      social_links: {},
      deleted_at: deletedAt
    })
    .eq("id", result.profile.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profile = await getProfileByAuthUserId(result.user.id);
  return NextResponse.json({ profile });
}
