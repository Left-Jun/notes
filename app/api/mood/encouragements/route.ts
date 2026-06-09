import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-server";
import { getMoodEncouragementsForProfile } from "@/lib/mood-records";
import { ensureProfileForUser } from "@/lib/profiles";

export async function GET(request: Request) {
  const { user, error } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const profile = await ensureProfileForUser(user);
  if (!profile || profile.deletedAt) {
    return NextResponse.json({ error: "Profile is unavailable." }, { status: profile?.deletedAt ? 410 : 500 });
  }

  try {
    const encouragements = await getMoodEncouragementsForProfile(profile.id);
    return NextResponse.json({ encouragements });
  } catch (encouragementError) {
    return NextResponse.json(
      { error: encouragementError instanceof Error ? encouragementError.message : "Could not load encouragements." },
      { status: 500 }
    );
  }
}
