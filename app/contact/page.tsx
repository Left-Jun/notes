import { Mail, MessageCircle } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { getNotes } from "@/lib/notes";
import { buildSearchEntries } from "@/lib/search";
import { developerEmail } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const notes = await getNotes({ status: "published" });
  const searchEntries = buildSearchEntries(notes);

  return (
    <SiteShell active="contact" searchEntries={searchEntries}>
      <section className="list-hero contact-hero">
        <p className="eyebrow">Contact</p>
        <h1>联系开发者</h1>
        <p>站点问题、内容建议、账号异常，都可以从这里发邮件给我。</p>
      </section>

      <section className="contact-panel" aria-label="开发者联系方式">
        <div className="contact-panel__icon" aria-hidden="true">
          <Mail size={24} />
        </div>
        <div>
          <p className="eyebrow">Email</p>
          <h2>{developerEmail}</h2>
          <p>请尽量写清楚遇到的页面、账号邮箱、时间和浏览器环境，我会按这里的信息排查。</p>
        </div>
        <a className="primary-link" href={`mailto:${developerEmail}`}>
          <MessageCircle size={18} />
          写邮件
        </a>
      </section>
    </SiteShell>
  );
}
