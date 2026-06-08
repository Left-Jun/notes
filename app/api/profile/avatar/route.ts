import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-server";
import { ensureProfileForUser } from "@/lib/profiles";
import { getAdminSupabase } from "@/lib/supabase";

const bucket = "profile-avatars";
const maxFileSize = 2 * 1024 * 1024;

function extensionFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request: Request) {
  const { user, error } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const profile = await ensureProfileForUser(user);
  if (!profile || profile.deletedAt) {
    return NextResponse.json({ error: "这个账号不可上传头像。" }, { status: 410 });
  }

  const formData = await request.formData();
  const file = formData.get("avatar");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请选择头像文件。" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "头像必须是图片文件。" }, { status: 400 });
  }

  if (file.size > maxFileSize) {
    return NextResponse.json({ error: "头像不能超过 2MB。" }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  const ext = extensionFromType(file.type);
  const filePath = `${user.id}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
    contentType: file.type,
    upsert: true
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  const avatarUrl = data.publicUrl;

  const { error: updateError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", profile.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ avatarUrl });
}
