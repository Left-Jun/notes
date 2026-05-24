"use client";

import { Eye, Save, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const sectionOptions = [
  ["posts", "随笔"],
  ["diary", "日记"],
  ["travel", "旅行"],
  ["ideas", "小巧思"],
  ["events", "活动"]
];

export function AdminEditor() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [savedSlug, setSavedSlug] = useState("");

  async function publish(formData: FormData) {
    setMessage("保存中...");
    setSavedSlug("");

    const payload = {
      title: formData.get("title"),
      slug: formData.get("slug"),
      summary: formData.get("summary"),
      section: formData.get("section"),
      mood: formData.get("mood"),
      location: formData.get("location"),
      status: formData.get("status"),
      coverUrl,
      tags: String(formData.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      content: formData.get("content")
    };

    const response = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-token": token
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "保存失败，请检查发布口令和表单内容。");
      return;
    }

    setSavedSlug(result.note.slug);
    setMessage(result.storage === "local" ? "已保存到本地演示内容，刷新首页就能看到。" : "已发布到 Supabase。");
    router.refresh();
  }

  async function upload(formData: FormData) {
    setMessage("上传中...");

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "x-admin-token": token
      },
      body: formData
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "上传失败，请检查发布口令和图片文件。");
      return;
    }

    setCoverUrl(result.url);
    setMessage("图片已上传，封面地址已自动填入。");
  }

  return (
    <div className="studio-grid">
      <section className="studio-panel">
        <h2>发布记录</h2>
        <form className="editor-form" action={publish}>
          <p className="studio-hint">先写标题、栏目和正文。本地演示可以直接发布；线上发布需要填写口令。</p>
          <label>
            <span>标题</span>
            <input name="title" required placeholder="今天想记录什么？" />
          </label>
          <label>
            <span>栏目</span>
            <select name="section" defaultValue="posts">
              {sectionOptions.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>正文</span>
            <textarea name="content" rows={18} required placeholder="直接写正文就好。支持 Markdown，例如 ## 小标题、列表、引用。" />
          </label>
          <label>
            <span>一句话摘要</span>
            <input name="summary" placeholder="可不填，会自动截取正文开头。" />
          </label>
          <label>
            <span>发布口令</span>
            <input value={token} onChange={(event) => setToken(event.target.value)} placeholder="线上发布时填写 ADMIN_WRITE_TOKEN" type="password" />
          </label>

          <details className="advanced-fields">
            <summary>可选设置</summary>
            <div className="form-grid">
              <label>
                <span>自定义链接</span>
                <input name="slug" placeholder="不填会自动生成。" />
              </label>
              <label>
                <span>标签</span>
                <input name="tags" placeholder="记录, 个人网站" />
              </label>
            </div>
            <div className="form-grid">
              <label>
                <span>心情</span>
                <input name="mood" placeholder="专注中" />
              </label>
              <label>
                <span>地点</span>
                <input name="location" placeholder="电脑前" />
              </label>
            </div>
            <div className="form-grid">
              <label>
                <span>封面 URL</span>
                <input value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} placeholder="上传图片后自动填入，也可以手动粘贴。" />
              </label>
              <label>
                <span>发布方式</span>
                <select name="status" defaultValue="published">
                  <option value="published">现在发布</option>
                  <option value="draft">先存草稿</option>
                </select>
              </label>
            </div>
          </details>

          <button className="primary-link" type="submit">
            <Save size={18} />
            发布
          </button>
          {savedSlug ? (
            <Link className="secondary-link saved-link" href={`/notes/${savedSlug}`}>
              <Eye size={18} />
              查看刚发布的文章
            </Link>
          ) : null}
        </form>
      </section>

      <section className="studio-panel" id="upload">
        <h2>图片上传</h2>
        <form className="editor-form" action={upload}>
          <label>
            <span>图片文件</span>
            <input name="file" type="file" accept="image/*" required />
          </label>
          <button className="secondary-link" type="submit">
            <UploadCloud size={18} />
            上传图片
          </button>
        </form>
        <div className="studio-note">
          <strong>当前版本</strong>
          <p>评论入口先关闭；文章和图片先用发布口令保护。后续做手机应用时，再把这里升级成登录后的正式创作台。</p>
        </div>
        {message ? <p className="form-message idle">{message}</p> : null}
      </section>
    </div>
  );
}
