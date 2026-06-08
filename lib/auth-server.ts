import type { User } from "@supabase/supabase-js";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase";

export async function getRequestUser(request: Request): Promise<{ user: User | null; error?: string; token?: string }> {
  if (!isSupabaseConfigured()) {
    return { user: null, error: "Supabase is not configured." };
  }

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";

  if (!token) {
    return { user: null, error: "Missing authorization token." };
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, error: error?.message || "Invalid authorization token." };
  }

  return { user: data.user, token };
}
