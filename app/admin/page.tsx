import { AdminEditor } from "@/components/admin-editor";
import { SiteShell } from "@/components/site-shell";
import { getNotes } from "@/lib/notes";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const notes = await getNotes();

  return (
    <SiteShell active="admin">
      <section className="list-hero">
        <p className="eyebrow">Studio</p>
        <h1>写作后台</h1>
        <p>
          这个入口面向个人写作：标题、栏目、正文，然后保存。未配置 Supabase 时，文章会写入可提交的
          `data/notes.json`；图片会写入本地预览目录 `public/uploads/`，默认不进 Git。
        </p>
      </section>
      <AdminEditor initialNotes={notes} />
    </SiteShell>
  );
}
