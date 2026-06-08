import { ProfileEditor } from "@/components/profile-editor";
import { SiteShell } from "@/components/site-shell";
import { getNotes } from "@/lib/notes";
import { buildSearchEntries } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const notes = await getNotes({ status: "published" });
  const searchEntries = buildSearchEntries(notes);

  return (
    <SiteShell active="auth" searchEntries={searchEntries}>
      <ProfileEditor />
    </SiteShell>
  );
}
