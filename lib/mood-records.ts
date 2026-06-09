import { randomUUID } from "node:crypto";
import {
  deleteLocalMoodEntryRecord,
  getLocalMoodEncouragements,
  getLocalMoodEntryRecords,
  incrementLocalMoodEntrySupport,
  insertLocalMoodEncouragement,
  upsertLocalMoodEntryRecord
} from "@/lib/local-store";
import { getMoodMonster } from "@/lib/mood";
import { defaultProfile } from "@/lib/profile";
import { listProfilesByIds, mapProfile, type ProfileRow } from "@/lib/profiles";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { MoodCoreSummary, MoodDailyGroup, MoodEncouragement, MoodEntryRecord, MoodPrivacy, UserProfile } from "@/lib/types";

type MoodEntryRow = {
  id: string;
  profile_id: string;
  mood: string | null;
  intensity: number | null;
  core_reason: string | null;
  next_action: string | null;
  note: string | null;
  tags: string[] | null;
  privacy: MoodPrivacy | null;
  monster_id: string | null;
  support_count: number | null;
  recorded_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  profiles?: ProfileRow | ProfileRow[] | null;
};

type MoodEncouragementRow = {
  id: string;
  mood_entry_id: string;
  receiver_profile_id: string;
  sender_profile_id: string | null;
  action: string | null;
  message: string | null;
  created_at: string | null;
  profiles?: ProfileRow | ProfileRow[] | null;
};

export type MoodEntryInput = {
  mood?: unknown;
  intensity?: unknown;
  coreReason?: unknown;
  nextAction?: unknown;
  note?: unknown;
  tags?: unknown;
  privacy?: unknown;
  monsterId?: unknown;
  recordedAt?: unknown;
};

export type PersonalMoodBundle = {
  entries: MoodEntryRecord[];
  dailyGroups: MoodDailyGroup[];
  core: MoodCoreSummary;
  encouragements: MoodEncouragement[];
};

function firstProfile(row?: ProfileRow | ProfileRow[] | null) {
  return Array.isArray(row) ? row[0] : row;
}

function normalizePrivacy(value: unknown): MoodPrivacy {
  return value === "anonymous" || value === "summary" || value === "private" ? value : "private";
}

function cleanText(value: unknown, fallback = "", max = 240) {
  return String(value || fallback)
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);
}

function cleanLongText(value: unknown, max = 800) {
  return String(value || "")
    .trim()
    .slice(0, max);
}

function cleanTags(value: unknown) {
  const raw = Array.isArray(value) ? value : String(value || "").split(/[,，、\s]+/);
  return [...new Set(raw.map((item) => cleanText(item, "", 18)).filter(Boolean))].slice(0, 8);
}

function clampIntensity(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 50;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function cleanDate(value: unknown) {
  const raw = String(value || "").trim();
  const parsed = raw ? new Date(raw) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function localDateKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function dayLabel(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00+08:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

function inferMonsterId(input: Pick<MoodEntryRecord, "mood" | "coreReason" | "note" | "tags" | "monsterId">) {
  if (input.monsterId && getMoodMonster(input.monsterId)) return input.monsterId;

  const text = `${input.mood} ${input.coreReason} ${input.note || ""} ${input.tags.join(" ")}`;
  if (/焦虑|压力|紧张|期末|复习|DDL|ddl|忙|崩/.test(text)) return "pressure-bloom";
  if (/低落|难过|平静|疲惫|失眠|夜|空|emo/i.test(text)) return "late-night-cloud";
  return "delay-spark";
}

function entryToRow(entry: MoodEntryRecord) {
  return {
    id: entry.id,
    profile_id: entry.profileId,
    mood: entry.mood,
    intensity: entry.intensity,
    core_reason: entry.coreReason,
    next_action: entry.nextAction,
    note: entry.note || null,
    tags: entry.tags,
    privacy: entry.privacy,
    monster_id: entry.monsterId || inferMonsterId(entry),
    support_count: entry.supportCount,
    recorded_at: entry.recordedAt,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt
  };
}

function mapMoodEntry(row: MoodEntryRow): MoodEntryRecord {
  const profile = mapProfile(firstProfile(row.profiles));
  const entry: MoodEntryRecord = {
    id: row.id,
    profileId: row.profile_id,
    profile,
    mood: row.mood || "记录中",
    intensity: clampIntensity(row.intensity),
    coreReason: row.core_reason || "还没有写下核心原因。",
    nextAction: row.next_action || "给自己一个很小的下一步。",
    note: row.note || null,
    tags: Array.isArray(row.tags) ? row.tags.filter(Boolean).slice(0, 8) : [],
    privacy: normalizePrivacy(row.privacy),
    monsterId: row.monster_id,
    supportCount: row.support_count || 0,
    recordedAt: row.recorded_at || new Date().toISOString(),
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined
  };

  return {
    ...entry,
    monsterId: inferMonsterId(entry)
  };
}

function mapEncouragement(row: MoodEncouragementRow): MoodEncouragement {
  return {
    id: row.id,
    moodEntryId: row.mood_entry_id,
    receiverProfileId: row.receiver_profile_id,
    senderProfileId: row.sender_profile_id,
    senderProfile: mapProfile(firstProfile(row.profiles)),
    action: row.action || "送一句支持",
    message: row.message || "有人轻轻地支持了你一下。",
    createdAt: row.created_at || new Date().toISOString()
  };
}

function withLocalProfile(entry: MoodEntryRecord, profiles: Map<string, UserProfile>) {
  return {
    ...entry,
    profile: profiles.get(entry.profileId) || (entry.profileId === defaultProfile.id ? defaultProfile : entry.profile || null)
  };
}

export function buildMoodDailyGroups(entries: MoodEntryRecord[]): MoodDailyGroup[] {
  const groups = entries.reduce<Record<string, MoodEntryRecord[]>>((acc, entry) => {
    const key = localDateKey(entry.recordedAt);
    acc[key] = [...(acc[key] || []), entry];
    return acc;
  }, {});

  return Object.entries(groups)
    .map(([date, group]) => {
      const moodCounts = group.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
      }, {});
      const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))[0]?.[0] || "记录中";
      const averageIntensity = Math.round(group.reduce((total, entry) => total + entry.intensity, 0) / Math.max(group.length, 1));

      return {
        date,
        label: dayLabel(date),
        entries: [...group].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()),
        averageIntensity,
        dominantMood
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function buildMoodCoreSummary(entries: MoodEntryRecord[]): MoodCoreSummary {
  const today = localDateKey(new Date().toISOString());
  const todayEntries = entries
    .filter((entry) => localDateKey(entry.recordedAt) === today)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  if (!todayEntries.length) {
    return {
      title: "今天还没有记录",
      mood: "待记录",
      intensity: 0,
      entryCount: 0,
      coreReason: "先写下一条此刻状态，不需要完整解释。",
      nextAction: "用 30 秒记录一个情绪核心。"
    };
  }

  const strongest = [...todayEntries].sort((a, b) => b.intensity - a.intensity || new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];

  return {
    title: todayEntries.length > 1 ? "今日主导情绪" : "今日情绪核心",
    mood: strongest.mood,
    intensity: strongest.intensity,
    entryCount: todayEntries.length,
    coreReason: strongest.coreReason,
    nextAction: strongest.nextAction,
    recordedAt: strongest.recordedAt
  };
}

export async function getMoodEntriesForProfile(profileId: string) {
  if (isSupabaseConfigured()) {
    const { data, error } = await getAdminSupabase()
      .from("mood_entries")
      .select("*, profiles:profile_id(*)")
      .eq("profile_id", profileId)
      .order("recorded_at", { ascending: false });

    if (error) throw new Error(error.message);
    return ((data || []) as MoodEntryRow[]).map(mapMoodEntry);
  }

  const entries = (await getLocalMoodEntryRecords()).filter((entry) => entry.profileId === profileId);
  const profiles = await listProfilesByIds(entries.map((entry) => entry.profileId));
  return entries.map((entry) => withLocalProfile(entry, profiles)).sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

export async function getMoodEncouragementsForProfile(profileId: string) {
  if (isSupabaseConfigured()) {
    const { data, error } = await getAdminSupabase()
      .from("mood_encouragements")
      .select("*, profiles:sender_profile_id(*)")
      .eq("receiver_profile_id", profileId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return ((data || []) as MoodEncouragementRow[]).map(mapEncouragement);
  }

  return (await getLocalMoodEncouragements())
    .filter((item) => item.receiverProfileId === profileId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getPersonalMoodBundle(profileId: string): Promise<PersonalMoodBundle> {
  const [entries, encouragements] = await Promise.all([getMoodEntriesForProfile(profileId), getMoodEncouragementsForProfile(profileId)]);
  return {
    entries,
    dailyGroups: buildMoodDailyGroups(entries),
    core: buildMoodCoreSummary(entries),
    encouragements
  };
}

export async function getPublicMoodEntryRecords(limit = 24) {
  if (isSupabaseConfigured()) {
    const { data, error } = await getAdminSupabase()
      .from("mood_entries")
      .select("*, profiles:profile_id(*)")
      .in("privacy", ["anonymous", "summary"])
      .order("recorded_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return ((data || []) as MoodEntryRow[]).map((row) => {
      const entry = mapMoodEntry(row);
      return entry.privacy === "anonymous" ? { ...entry, profile: null } : entry;
    });
  }

  const entries = (await getLocalMoodEntryRecords())
    .filter((entry) => entry.privacy !== "private")
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    .slice(0, limit);
  const profiles = await listProfilesByIds(entries.map((entry) => entry.profileId));
  return entries.map((entry) => withLocalProfile(entry.privacy === "anonymous" ? { ...entry, profile: null } : entry, profiles));
}

export async function getMoodEntryRecordById(id: string) {
  if (!id) return null;

  if (isSupabaseConfigured()) {
    const { data, error } = await getAdminSupabase().from("mood_entries").select("*, profiles:profile_id(*)").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return mapMoodEntry(data as MoodEntryRow);
  }

  const entry = (await getLocalMoodEntryRecords()).find((item) => item.id === id);
  if (!entry) return null;
  const profiles = await listProfilesByIds([entry.profileId]);
  return withLocalProfile(entry, profiles);
}

export async function createMoodEntryRecord(profileId: string, input: MoodEntryInput) {
  const now = new Date().toISOString();
  const entry: MoodEntryRecord = {
    id: randomUUID(),
    profileId,
    mood: cleanText(input.mood, "记录中", 32),
    intensity: clampIntensity(input.intensity),
    coreReason: cleanText(input.coreReason, "还没有写下核心原因。", 120),
    nextAction: cleanText(input.nextAction, "给自己一个很小的下一步。", 120),
    note: cleanLongText(input.note, 800) || null,
    tags: cleanTags(input.tags),
    privacy: normalizePrivacy(input.privacy),
    monsterId: cleanText(input.monsterId, "", 48) || null,
    supportCount: 0,
    recordedAt: cleanDate(input.recordedAt),
    createdAt: now,
    updatedAt: now
  };
  const nextEntry = { ...entry, monsterId: inferMonsterId(entry) };

  if (isSupabaseConfigured()) {
    const { data, error } = await getAdminSupabase().from("mood_entries").insert(entryToRow(nextEntry)).select("*, profiles:profile_id(*)").single();
    if (error) throw new Error(error.message);
    return mapMoodEntry(data as MoodEntryRow);
  }

  return upsertLocalMoodEntryRecord(nextEntry);
}

export async function updateMoodEntryRecord(profileId: string, id: string, input: MoodEntryInput) {
  const existing = await getMoodEntryRecordById(id);
  if (!existing || existing.profileId !== profileId) return null;

  const entry: MoodEntryRecord = {
    ...existing,
    mood: cleanText(input.mood, existing.mood, 32),
    intensity: clampIntensity(input.intensity ?? existing.intensity),
    coreReason: cleanText(input.coreReason, existing.coreReason, 120),
    nextAction: cleanText(input.nextAction, existing.nextAction, 120),
    note: cleanLongText(input.note ?? existing.note, 800) || null,
    tags: cleanTags(input.tags ?? existing.tags),
    privacy: normalizePrivacy(input.privacy ?? existing.privacy),
    monsterId: cleanText(input.monsterId, existing.monsterId || "", 48) || null,
    recordedAt: cleanDate(input.recordedAt ?? existing.recordedAt),
    updatedAt: new Date().toISOString()
  };
  const nextEntry = { ...entry, monsterId: inferMonsterId(entry) };

  if (isSupabaseConfigured()) {
    const { data, error } = await getAdminSupabase()
      .from("mood_entries")
      .update(entryToRow(nextEntry))
      .eq("id", id)
      .eq("profile_id", profileId)
      .select("*, profiles:profile_id(*)")
      .single();

    if (error) throw new Error(error.message);
    return mapMoodEntry(data as MoodEntryRow);
  }

  return upsertLocalMoodEntryRecord(nextEntry);
}

export async function deleteMoodEntryRecord(profileId: string, id: string) {
  if (isSupabaseConfigured()) {
    const { error } = await getAdminSupabase().from("mood_entries").delete().eq("id", id).eq("profile_id", profileId);
    if (error) throw new Error(error.message);
    return true;
  }

  return deleteLocalMoodEntryRecord(profileId, id);
}

export async function insertMoodEntryEncouragement(input: {
  moodEntryId: string;
  receiverProfileId: string;
  senderProfileId?: string | null;
  action: string;
  message?: string | null;
}) {
  const encouragement: MoodEncouragement = {
    id: randomUUID(),
    moodEntryId: input.moodEntryId,
    receiverProfileId: input.receiverProfileId,
    senderProfileId: input.senderProfileId || null,
    action: cleanText(input.action, "送一句支持", 48),
    message: cleanText(input.message, "有人轻轻地支持了你一下。", 140),
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await getAdminSupabase()
      .from("mood_encouragements")
      .insert({
        id: encouragement.id,
        mood_entry_id: encouragement.moodEntryId,
        receiver_profile_id: encouragement.receiverProfileId,
        sender_profile_id: encouragement.senderProfileId,
        action: encouragement.action,
        message: encouragement.message,
        created_at: encouragement.createdAt
      })
      .select("*, profiles:sender_profile_id(*)")
      .single();

    if (error) throw new Error(error.message);
    return mapEncouragement(data as MoodEncouragementRow);
  }

  return insertLocalMoodEncouragement(encouragement);
}

export async function incrementMoodEntrySupport(id: string) {
  if (isSupabaseConfigured()) {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.rpc("increment_mood_entry_support", { target_entry_id: id });
    if (!error && typeof data === "number") return data;

    const entry = await getMoodEntryRecordById(id);
    if (!entry) return null;
    const supportCount = entry.supportCount + 1;
    await supabase.from("mood_entries").update({ support_count: supportCount }).eq("id", id);
    return supportCount;
  }

  return incrementLocalMoodEntrySupport(id);
}
