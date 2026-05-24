import { AdminEditor } from "@/components/admin-editor";
import { SiteShell } from "@/components/site-shell";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <SiteShell active="admin">
      <section className="list-hero">
        <p className="eyebrow">Studio</p>
        <h1>写作后台</h1>
        <p>
          这个入口面向个人写作：标题、栏目、正文，然后发布。本地演示会保存到项目里的本地 JSON；
          线上会通过 Supabase 和发布口令写入正式数据库。
        </p>
      </section>
      <AdminEditor />
    </SiteShell>
  );
}
