import { AdminEditor } from "@/components/admin-editor";
import { SiteShell } from "@/components/site-shell";
import { getNotes } from "@/lib/notes";
import { buildSearchEntries } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams?: Promise<{ section?: string }> }) {
  const query = searchParams ? await searchParams : {};
  const defaultSection = query.section === "diary" ? "diary" : "posts";
  const notes = await getNotes();
  const searchEntries = buildSearchEntries(notes.filter((note) => note.status === "published"));

  return (
    <SiteShell active="admin" searchEntries={searchEntries}>
      <section className="list-hero">
        <p className="eyebrow">Studio</p>
        <h1>写作后台</h1>
        <p>
          写作入口现在只保留最常用的字段：标题、栏目、正文和摘要。链接、标签、封面、情绪等细节可以在可选设置里补。
        </p>
      </section>
      <AdminEditor initialNotes={notes} defaultSection={defaultSection} />
    </SiteShell>
  );
}
