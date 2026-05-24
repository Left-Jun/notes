import { NextResponse } from "next/server";
import { canUseLocalWrite, upsertLocalNote } from "@/lib/local-store";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Note } from "@/lib/types";

function isAuthorized(request: Request) {
  if (!isSupabaseConfigured() && canUseLocalWrite()) {
    return true;
  }

  const expected = process.env.ADMIN_WRITE_TOKEN;
  const received = request.headers.get("x-admin-token");
  return Boolean(expected && received && expected === received);
}

function toSlug(value: unknown, fallback: unknown) {
  return String(value || fallback || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toSummary(summary: unknown, content: unknown) {
  const writtenSummary = String(summary || "").trim();
  if (writtenSummary) return writtenSummary;

  return String(content || "")
    .replace(/[#>*_`-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const now = new Date().toISOString();
  const slug = toSlug(payload.slug, `${payload.title}-${Date.now()}`);

  if (!slug || !payload.title || !payload.content) {
    return NextResponse.json({ error: "标题和正文是必填项。" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    if (!canUseLocalWrite()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const note: Note = {
      id: `local-${slug}`,
      slug,
      title: String(payload.title),
      summary: toSummary(payload.summary, payload.content),
      content: String(payload.content),
      section: payload.section || "posts",
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      mood: payload.mood || null,
      location: payload.location || null,
      coverUrl: payload.coverUrl || null,
      status: payload.status === "draft" ? "draft" : "published",
      publishedAt: payload.publishedAt || now,
      createdAt: now,
      updatedAt: now
    };

    await upsertLocalNote(note);
    return NextResponse.json({ note, storage: "local" });
  }

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("notes")
    .upsert(
      {
        slug,
        title: payload.title,
        summary: toSummary(payload.summary, payload.content),
        content_md: payload.content,
        section: payload.section || "posts",
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        mood: payload.mood || null,
        location: payload.location || null,
        cover_url: payload.coverUrl || null,
        status: payload.status === "draft" ? "draft" : "published",
        published_at: payload.publishedAt || new Date().toISOString()
      },
      { onConflict: "slug" }
    )
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ note: data });
}
