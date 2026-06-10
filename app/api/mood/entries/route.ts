import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getRequestUser } from "@/lib/auth-server";
import { ensureProfileForUser } from "@/lib/profiles";
import { createMoodEntryRecord, deleteMoodEntryRecord, getPersonalMoodBundle, updateMoodEntryRecord } from "@/lib/mood-records";

function revalidateMoodViews(entry?: { id?: string; monsterId?: string | null }) {
  revalidatePath("/");
  revalidatePath("/square");
  revalidatePath("/mood");
  if (entry?.monsterId) revalidatePath(`/monster/${entry.monsterId}`);
}

async function getAuthorizedProfile(request: Request) {
  const { user, error } = await getRequestUser(request);
  if (!user) {
    return { response: NextResponse.json({ error: error || "Unauthorized" }, { status: 401 }) };
  }

  const profile = await ensureProfileForUser(user);
  if (!profile || profile.deletedAt) {
    return { response: NextResponse.json({ error: "Profile is unavailable." }, { status: profile?.deletedAt ? 410 : 500 }) };
  }

  return { profile };
}

export async function GET(request: Request) {
  const result = await getAuthorizedProfile(request);
  if ("response" in result) return result.response;

  try {
    const bundle = await getPersonalMoodBundle(result.profile.id);
    return NextResponse.json(bundle);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load mood entries." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const result = await getAuthorizedProfile(request);
  if ("response" in result) return result.response;

  try {
    const payload = await request.json();
    const entry = await createMoodEntryRecord(result.profile.id, payload);
    revalidateMoodViews(entry);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create mood entry." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const result = await getAuthorizedProfile(request);
  if ("response" in result) return result.response;

  try {
    const payload = await request.json();
    const id = String(payload.id || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Missing mood entry id." }, { status: 400 });
    }

    const entry = await updateMoodEntryRecord(result.profile.id, id, payload);
    if (!entry) {
      return NextResponse.json({ error: "Mood entry not found." }, { status: 404 });
    }

    revalidateMoodViews(entry);
    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update mood entry." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const result = await getAuthorizedProfile(request);
  if ("response" in result) return result.response;

  try {
    const id = new URL(request.url).searchParams.get("id") || "";

    if (!id.trim()) {
      return NextResponse.json({ error: "Missing mood entry id." }, { status: 400 });
    }

    const deleted = await deleteMoodEntryRecord(result.profile.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Mood entry not found." }, { status: 404 });
    }

    revalidateMoodViews();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete mood entry." }, { status: 500 });
  }
}
