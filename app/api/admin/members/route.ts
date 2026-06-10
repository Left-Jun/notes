import { NextResponse } from "next/server";
import { addAdminEmail, getAdminIdentity, listAdminIdentities, removeAdminEmail } from "@/lib/admin";
import { getRequestUser } from "@/lib/auth-server";
import { isSupabaseConfigured } from "@/lib/supabase";

async function getOwner(request: Request) {
  const { user, error } = await getRequestUser(request);
  if (!user) {
    return { response: NextResponse.json({ error: error || "Unauthorized" }, { status: 401 }) };
  }

  const identity = await getAdminIdentity(user.email);
  if (identity?.level !== "owner") {
    return { response: NextResponse.json({ error: "Only the owner can manage admins." }, { status: 403 }) };
  }

  return { identity };
}

export async function GET(request: Request) {
  const result = await getOwner(request);
  if ("response" in result) return result.response;

  return NextResponse.json({ admins: await listAdminIdentities(), current: result.identity });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const result = await getOwner(request);
  if ("response" in result) return result.response;

  try {
    const payload = await request.json();
    return NextResponse.json({ admins: await addAdminEmail(String(payload.email || "")), current: result.identity });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not add admin." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const result = await getOwner(request);
  if ("response" in result) return result.response;

  try {
    const email = new URL(request.url).searchParams.get("email") || "";
    return NextResponse.json({ admins: await removeAdminEmail(email), current: result.identity });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not remove admin." }, { status: 400 });
  }
}
