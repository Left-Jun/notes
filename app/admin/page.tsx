import { AdminEditor } from "@/components/admin-editor";
import { SiteShell } from "@/components/site-shell";
import { getNotes } from "@/lib/notes";
import { buildSearchEntries } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams?: Promise<{ section?: string }> }) {
  const query = searchParams ? await searchParams : {};
  const defaultSection = query.section === "diary" ? "diary" : "posts";
  const notes = await getNotes({ status: "published" });
  const searchEntries = buildSearchEntries(notes);

  return (
    <SiteShell active="admin" searchEntries={searchEntries}>
      <section className="list-hero">
        <p className="eyebrow">Studio</p>
        <h1>写作后台</h1>
        <p>
          普通账号只能发布和修改自己的记录；管理员账号可以管理站内内容、草稿和管理员邮箱。
        </p>
      </section>
      <AdminEditor initialNotes={[]} defaultSection={defaultSection} />
    </SiteShell>
  );
}
