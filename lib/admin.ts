import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { AdminIdentity } from "@/lib/types";

const ownerEmail = "limenaut0@gmail.com";
const builtInAdminEmails = new Set([ownerEmail, "zuo051607@163.com"]);

function normalizeEmail(email?: string | null) {
  return String(email || "").trim().toLowerCase();
}

export function isBuiltInAdminEmail(email?: string | null) {
  const normalized = normalizeEmail(email);
  return normalized ? builtInAdminEmails.has(normalized) : false;
}

export function isOwnerEmail(email?: string | null) {
  return normalizeEmail(email) === ownerEmail;
}

export async function getAdminIdentity(email?: string | null): Promise<AdminIdentity | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  if (isOwnerEmail(normalized)) {
    return { email: normalized, level: "owner", source: "built-in" };
  }

  if (isBuiltInAdminEmail(normalized)) {
    return { email: normalized, level: "admin", source: "built-in" };
  }

  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getAdminSupabase()
    .from("admin_members")
    .select("email")
    .eq("email", normalized)
    .maybeSingle();

  if (error || !data) return null;
  return { email: normalized, level: "admin", source: "database" };
}

export async function listAdminIdentities() {
  const identities: AdminIdentity[] = [
    { email: ownerEmail, level: "owner", source: "built-in" },
    { email: "zuo051607@163.com", level: "admin", source: "built-in" }
  ];

  if (!isSupabaseConfigured()) return identities;

  const { data, error } = await getAdminSupabase().from("admin_members").select("email").order("email", { ascending: true });
  if (error || !data) return identities;

  const seen = new Set(identities.map((item) => item.email));
  for (const row of data as Array<{ email: string }>) {
    const email = normalizeEmail(row.email);
    if (!email || seen.has(email)) continue;
    seen.add(email);
    identities.push({ email, level: "admin", source: "database" });
  }

  return identities;
}

export async function addAdminEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) {
    throw new Error("请输入有效的邮箱。");
  }

  if (isBuiltInAdminEmail(normalized)) {
    return listAdminIdentities();
  }

  const { error } = await getAdminSupabase().from("admin_members").upsert({ email: normalized }, { onConflict: "email" });
  if (error) throw new Error(error.message);
  return listAdminIdentities();
}

export async function removeAdminEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized || isBuiltInAdminEmail(normalized)) {
    throw new Error("内置管理员不能移除。");
  }

  const { error } = await getAdminSupabase().from("admin_members").delete().eq("email", normalized);
  if (error) throw new Error(error.message);
  return listAdminIdentities();
}
