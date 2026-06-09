import { NextResponse } from "next/server";
import { canUseLocalWrite, incrementLocalNoteSupport, insertLocalMoodSupport } from "@/lib/local-store";
import { getMoodMonster } from "@/lib/mood";
import { getMoodEntryRecordById, incrementMoodEntrySupport, insertMoodEntryEncouragement } from "@/lib/mood-records";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { MoodSupportAction } from "@/lib/types";

const allowedActions = new Set(["送一句支持", "拆成小任务", "陪 TA 呼吸一下"]);

function sanitizeText(value: unknown, fallback = "", max = 120) {
  return String(value || fallback).trim().slice(0, max);
}

function isUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const monsterId = sanitizeText(payload.monsterId);
  const monster = getMoodMonster(monsterId);

  if (!monster) {
    return NextResponse.json({ error: "未知的坏心情怪兽。" }, { status: 400 });
  }

  const action = sanitizeText(payload.action, "送一句支持", 48);
  const normalizedAction = allowedActions.has(action) ? action : "送一句支持";
  const moodEntryId = sanitizeText(payload.moodEntryId, "", 80) || null;
  const message = sanitizeText(payload.message, "有人轻轻地支持了你一下。", 140);
  const noteId = sanitizeText(payload.entryId) || null;
  const noteSlug = sanitizeText(payload.noteSlug) || null;
  const now = new Date().toISOString();

  if (moodEntryId) {
    const entry = await getMoodEntryRecordById(moodEntryId);

    if (!entry || entry.privacy === "private") {
      return NextResponse.json({ error: "这条情绪记录不可支持。" }, { status: 404 });
    }

    if (!isSupabaseConfigured() && !canUseLocalWrite()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const encouragement = await insertMoodEntryEncouragement({
      moodEntryId,
      receiverProfileId: entry.profileId,
      action: normalizedAction,
      message
    });
    const supportCount = await incrementMoodEntrySupport(moodEntryId);
    const support: MoodSupportAction = {
      id: encouragement.id,
      moodEntryId,
      monsterId,
      action: normalizedAction,
      message,
      createdAt: encouragement.createdAt
    };

    if (!isSupabaseConfigured()) {
      await insertLocalMoodSupport(support);
    }

    return NextResponse.json({
      support,
      encouragement,
      supportCount,
      storage: isSupabaseConfigured() ? "supabase" : "local"
    });
  }

  if (!isSupabaseConfigured()) {
    if (!canUseLocalWrite()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const support: MoodSupportAction = {
      id: `local-support-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      noteId,
      noteSlug,
      monsterId,
      action: normalizedAction,
      message,
      createdAt: now
    };

    await insertLocalMoodSupport(support);
    const supportCount = await incrementLocalNoteSupport(noteId, noteSlug);
    return NextResponse.json({ support, supportCount, storage: "local" });
  }

  const supabase = getAdminSupabase();
  let resolvedNoteId = isUuid(noteId) ? noteId : null;

  if (!resolvedNoteId && noteSlug) {
    const { data } = await supabase.from("notes").select("id").eq("slug", noteSlug).maybeSingle();
    resolvedNoteId = data?.id || null;
  }

  const { data: support, error: insertError } = await supabase
    .from("mood_supports")
    .insert({
      note_id: resolvedNoteId,
      note_slug: noteSlug,
      monster_id: monsterId,
      action: normalizedAction
    })
    .select("id, note_id, note_slug, monster_id, action, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  let supportCount: number | null = null;

  if (resolvedNoteId) {
    const { data, error } = await supabase.rpc("increment_note_support", { target_note_id: resolvedNoteId });
    if (!error && typeof data === "number") {
      supportCount = data;
    }
  }

  return NextResponse.json({
    support,
    supportCount,
    storage: "supabase"
  });
}
