import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { canUseLocalWrite } from "@/lib/local-store";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase";

function isAuthorized(request: Request) {
  if (!isSupabaseConfigured() && canUseLocalWrite()) {
    return true;
  }

  const expected = process.env.ADMIN_WRITE_TOKEN;
  const received = request.headers.get("x-admin-token");
  return Boolean(expected && received && expected === received);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "note-images";
  const ext = file.name.split(".").pop() || "bin";
  const path = `notes/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  if (!isSupabaseConfigured()) {
    if (!canUseLocalWrite()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const uploadDir = pathModuleJoin(process.cwd(), "public", "uploads");
    const safeName = `${Date.now()}-${crypto.randomUUID()}.${ext.replace(/[^a-zA-Z0-9]/g, "") || "bin"}`;
    const localPath = pathModuleJoin(uploadDir, safeName);
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(localPath, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/uploads/${safeName}`, path: localPath, storage: "local" });
  }

  const supabase = getAdminSupabase();

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}

function pathModuleJoin(...parts: string[]) {
  return path.join(...parts);
}
