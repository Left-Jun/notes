import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { canUseLocalWrite, getLocalNotes, insertLocalComment } from "@/lib/local-store";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { NoteComment } from "@/lib/types";

function cleanText(value: unknown, fallback = "", max = 240) {
  return String(value || fallback)
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);
}

function cleanBody(value: unknown) {
  return String(value || "")
    .trim()
    .slice(0, 1200);
}

function cleanUrl(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ error: "评论内容格式不正确。" }, { status: 400 });
  }

  const noteId = cleanText(payload.noteId, "", 80);
  const noteSlug = cleanText(payload.noteSlug, "", 120);
  const authorName = cleanText(payload.authorName, "路过的人", 32);
  const authorUrl = cleanUrl(payload.authorUrl);
  const body = cleanBody(payload.body);

  if (!noteId && !noteSlug) {
    return NextResponse.json({ error: "缺少文章信息。" }, { status: 400 });
  }

  if (body.length < 2) {
    return NextResponse.json({ error: "评论至少需要 2 个字。" }, { status: 400 });
  }

  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    if (!canUseLocalWrite()) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }

    const notes = await getLocalNotes();
    const target = notes.find((note) => note.id === noteId || note.slug === noteSlug);

    if (!target) {
      return NextResponse.json({ error: "没有找到要评论的文章。" }, { status: 404 });
    }

    const comment: NoteComment = {
      id: randomUUID(),
      noteId: target.id,
      authorName,
      authorUrl,
      body,
      status: "approved",
      createdAt: now
    };

    const savedComment = await insertLocalComment(comment);
    return NextResponse.json({ comment: savedComment }, { status: 201 });
  }

  const supabase = getAdminSupabase();
  let resolvedNoteId = noteId;

  if (noteSlug && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(noteId)) {
    const { data: note, error: noteError } = await supabase.from("notes").select("id").eq("slug", noteSlug).eq("status", "published").maybeSingle();
    if (noteError) {
      return NextResponse.json({ error: noteError.message }, { status: 500 });
    }
    resolvedNoteId = note?.id || "";
  }

  if (!resolvedNoteId) {
    return NextResponse.json({ error: "没有找到要评论的文章。" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      note_id: resolvedNoteId,
      author_name: authorName,
      author_url: authorUrl,
      body,
      status: "approved",
      created_at: now
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      comment: {
        id: data.id,
        noteId: data.note_id,
        authorName: data.author_name,
        authorUrl: data.author_url,
        body: data.body,
        status: data.status,
        createdAt: data.created_at
      }
    },
    { status: 201 }
  );
}
