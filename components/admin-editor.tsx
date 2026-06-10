"use client";

import { Eye, FileText, ImagePlus, Plus, RotateCcw, Save, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import { marked } from "marked";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { moodMonsters } from "@/lib/mood";
import type { AdminIdentity, MoodPrivacy, Note, NoteStatus } from "@/lib/types";

const sectionOptions = [
  ["posts", "随笔"],
  ["diary", "日记"]
];

const privacyOptions: Array<[MoodPrivacy, string]> = [
  ["private", "私密"],
  ["summary", "公开摘要"],
  ["anonymous", "匿名广场"]
];

type EditorDraft = {
  title: string;
  slug: string;
  summary: string;
  section: string;
  content: string;
  tags: string;
  mood: string;
  moodIntensity: string;
  moodPrivacy: MoodPrivacy;
  monsterId: string;
  location: string;
  status: NoteStatus;
  publishedAt: string;
};

type AdminMembersState = {
  admins: AdminIdentity[];
  current: AdminIdentity | null;
};

function toDatetimeLocal(value?: string) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function emptyDraft(section = "posts"): EditorDraft {
  return {
    title: "",
    slug: "",
    summary: "",
    section,
    content: "",
    tags: "",
    mood: "",
    moodIntensity: "",
    moodPrivacy: "private",
    monsterId: "",
    location: "",
    status: "published",
    publishedAt: toDatetimeLocal()
  };
}

function noteToDraft(note: Note): EditorDraft {
  return {
    title: note.title,
    slug: note.slug,
    summary: note.summary || "",
    section: note.section || "posts",
    content: note.content || "",
    tags: note.tags.join(", "),
    mood: note.mood || "",
    moodIntensity: note.moodIntensity?.toString() || "",
    moodPrivacy: note.moodPrivacy || "private",
    monsterId: note.monsterId || "",
    location: note.location || "",
    status: note.status,
    publishedAt: toDatetimeLocal(note.publishedAt)
  };
}

function sortNotes(notes: Note[]) {
  return [...notes].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

function sectionLabel(sectionId: string) {
  return sectionOptions.find(([value]) => value === sectionId)?.[1] || sectionId;
}

function toIsoDate(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  return new Date(raw).toISOString();
}

export function AdminEditor({ initialNotes, defaultSection = "posts" }: { initialNotes: Note[]; defaultSection?: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState(() => sortNotes(initialNotes));
  const [selectedSlug, setSelectedSlug] = useState("");
  const [draft, setDraft] = useState<EditorDraft>(() => emptyDraft(defaultSection === "diary" ? "diary" : "posts"));
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [savedSlug, setSavedSlug] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [adminMembers, setAdminMembers] = useState<AdminMembersState>({ admins: [], current: null });
  const [newAdminEmail, setNewAdminEmail] = useState("");

  const previewHtml = useMemo(
    () =>
      marked.parse(draft.content || "正文会显示在这里。", {
        async: false,
        gfm: true
      }) as string,
    [draft.content]
  );

  function updateDraft<Key extends keyof EditorDraft>(key: Key, value: EditorDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function getSessionToken() {
    const { data: sessionData } = (await getBrowserSupabase()?.auth.getSession()) || {};
    return sessionData?.session?.access_token || "";
  }

  async function loadNotes() {
    setLoadingNotes(true);
    try {
      const sessionToken = await getSessionToken();
      const response = await fetch("/api/posts", {
        headers: {
          authorization: sessionToken ? `Bearer ${sessionToken}` : "",
          "x-admin-token": token
        }
      });
      const result = await response.json();

      if (!response.ok) {
        if (initialNotes.length > 0) setNotes(sortNotes(initialNotes));
        setMessage(result.error || "读取记录失败。请先登录，或填写维护者口令。");
        return;
      }

      setNotes(sortNotes(result.notes || []));
      setAdmin(result.admin || null);
      if (result.admin?.level === "owner") {
        await loadAdminMembers(sessionToken);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "读取记录失败。");
    } finally {
      setLoadingNotes(false);
    }
  }

  async function loadAdminMembers(sessionToken?: string) {
    const tokenValue = sessionToken || (await getSessionToken());
    const response = await fetch("/api/admin/members", {
      headers: {
        authorization: tokenValue ? `Bearer ${tokenValue}` : ""
      }
    });

    if (!response.ok) return;
    setAdminMembers((await response.json()) as AdminMembersState);
  }

  useEffect(() => {
    loadNotes();
    const supabase = getBrowserSupabase();
    const subscription = supabase?.auth.onAuthStateChange(() => {
      loadNotes();
    }).data.subscription;

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  function resetDraft() {
    setSelectedSlug("");
    setDraft(emptyDraft(defaultSection === "diary" ? "diary" : "posts"));
    setCoverUrl("");
    setSavedSlug("");
    setMessage("");
  }

  function selectNote(slug: string) {
    setSelectedSlug(slug);
    setSavedSlug("");
    setMessage("");

    const note = notes.find((item) => item.slug === slug);
    if (!note) {
      setDraft(emptyDraft(defaultSection === "diary" ? "diary" : "posts"));
      setCoverUrl("");
      return;
    }

    setDraft(noteToDraft(note));
    setCoverUrl(note.coverUrl || "");
  }

  async function publish(formData: FormData) {
    setMessage("保存中...");
    setSavedSlug("");

    const payload = {
      sourceSlug: selectedSlug || draft.slug,
      title: formData.get("title"),
      slug: formData.get("slug"),
      summary: formData.get("summary"),
      section: formData.get("section"),
      mood: formData.get("mood"),
      moodIntensity: formData.get("moodIntensity"),
      moodPrivacy: formData.get("moodPrivacy"),
      monsterId: formData.get("monsterId"),
      location: formData.get("location"),
      status: formData.get("status"),
      publishedAt: toIsoDate(formData.get("publishedAt")),
      coverUrl,
      tags: String(formData.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      content: formData.get("content")
    };

    const sessionToken = await getSessionToken();

    const response = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-token": token,
        authorization: sessionToken ? `Bearer ${sessionToken}` : ""
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "保存失败，请检查发布口令和表单内容。");
      return;
    }

    setSavedSlug(result.note.slug);

    if (result.note?.title) {
      const savedNote = result.note as Note;
      setNotes((current) =>
        sortNotes([savedNote, ...current.filter((note) => note.slug !== savedNote.slug && note.slug !== selectedSlug)])
      );
      setSelectedSlug(savedNote.slug);
      setDraft(noteToDraft(savedNote));
      setCoverUrl(savedNote.coverUrl || "");
    }

    setMessage(
      result.storage === "tracked-local"
        ? "已写入 data/notes.json，提交并推送后线上会读取这次修改。"
        : "已发布到 Supabase。"
    );
    router.refresh();
  }

  async function addAdmin() {
    const sessionToken = await getSessionToken();
    const response = await fetch("/api/admin/members", {
      method: "POST",
      headers: {
        authorization: sessionToken ? `Bearer ${sessionToken}` : "",
        "content-type": "application/json"
      },
      body: JSON.stringify({ email: newAdminEmail })
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "添加管理员失败。");
      return;
    }

    setAdminMembers(result);
    setNewAdminEmail("");
    setMessage("管理员邮箱已添加。");
  }

  async function removeAdmin(email: string) {
    const sessionToken = await getSessionToken();
    const response = await fetch(`/api/admin/members?email=${encodeURIComponent(email)}`, {
      method: "DELETE",
      headers: {
        authorization: sessionToken ? `Bearer ${sessionToken}` : ""
      }
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "移除管理员失败。");
      return;
    }

    setAdminMembers(result);
    setMessage("管理员邮箱已移除。");
  }

  async function upload(formData: FormData) {
    setMessage("上传中...");
    const sessionToken = await getSessionToken();

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "x-admin-token": token,
        authorization: sessionToken ? `Bearer ${sessionToken}` : ""
      },
      body: formData
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "上传失败，请检查发布口令和图片文件。");
      return;
    }

    setCoverUrl(result.url);
    setMessage(result.storage === "local" ? "图片已保存到 public/uploads，仅用于本地预览。" : "图片已上传。");
  }

  return (
    <div className="studio-grid studio-grid--editor">
      <section className="studio-panel">
        <div className="studio-panel-header">
          <div>
            <p className="eyebrow">Local Studio</p>
            <h2>内容编辑器</h2>
          </div>
          <button className="secondary-link compact-action" type="button" onClick={resetDraft}>
            <RotateCcw size={17} />
            新建
          </button>
        </div>

        <div className="editor-picker">
          <label>
            <span>{admin ? "编辑站内记录" : "编辑我的记录"}</span>
            <select value={selectedSlug} onChange={(event) => selectNote(event.target.value)}>
              <option value="">{loadingNotes ? "读取中..." : "新记录"}</option>
              {notes.map((note) => (
                <option value={note.slug} key={note.slug}>
                  {note.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <form className="editor-form" action={publish}>
          <div className="form-grid">
            <label>
              <span>标题</span>
              <input
                name="title"
                required
                value={draft.title}
                onChange={(event) => updateDraft("title", event.target.value)}
                placeholder="今天想记录什么？"
              />
            </label>
            <label>
              <span>栏目</span>
              <select name="section" value={draft.section} onChange={(event) => updateDraft("section", event.target.value)}>
                {sectionOptions.map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span>正文</span>
            <textarea
              className="editor-textarea"
              name="content"
              rows={18}
              required
              value={draft.content}
              onChange={(event) => updateDraft("content", event.target.value)}
              placeholder="支持 Markdown，例如 ## 小标题、列表、引用。"
            />
          </label>

          <label>
            <span>一句话摘要</span>
            <input
              name="summary"
              value={draft.summary}
              onChange={(event) => updateDraft("summary", event.target.value)}
              placeholder="可不填，会自动截取正文开头。"
            />
          </label>

          <details className="advanced-fields">
            <summary>可选设置</summary>
            <div className="form-grid">
              <label>
                <span>自定义链接</span>
                <input
                  name="slug"
                  value={draft.slug}
                  onChange={(event) => updateDraft("slug", event.target.value)}
                  placeholder="不填会自动生成。"
                />
              </label>
              <label>
                <span>发布时间</span>
                <input
                  name="publishedAt"
                  type="datetime-local"
                  value={draft.publishedAt}
                  onChange={(event) => updateDraft("publishedAt", event.target.value)}
                />
              </label>
            </div>
            <div className="form-grid">
              <label>
                <span>标签</span>
                <input
                  name="tags"
                  value={draft.tags}
                  onChange={(event) => updateDraft("tags", event.target.value)}
                  placeholder="记录, 个人网站"
                />
              </label>
              <label>
                <span>发布方式</span>
                <select name="status" value={draft.status} onChange={(event) => updateDraft("status", event.target.value as NoteStatus)}>
                  <option value="published">现在发布</option>
                  <option value="draft">先存草稿</option>
                </select>
              </label>
            </div>
            <div className="form-grid">
              <label>
                <span>心情</span>
                <input
                  name="mood"
                  value={draft.mood}
                  onChange={(event) => updateDraft("mood", event.target.value)}
                  placeholder="焦虑、平静、兴奋、专注中..."
                />
              </label>
              <label>
                <span>地点</span>
                <input
                  name="location"
                  value={draft.location}
                  onChange={(event) => updateDraft("location", event.target.value)}
                  placeholder="电脑前"
                />
              </label>
            </div>
            <div className="form-grid">
              <label>
                <span>心情强度</span>
                <input
                  name="moodIntensity"
                  type="number"
                  min="0"
                  max="100"
                  value={draft.moodIntensity}
                  onChange={(event) => updateDraft("moodIntensity", event.target.value)}
                  placeholder="0-100"
                />
              </label>
              <label>
                <span>公开方式</span>
                <select
                  name="moodPrivacy"
                  value={draft.moodPrivacy}
                  onChange={(event) => updateDraft("moodPrivacy", event.target.value as MoodPrivacy)}
                >
                  {privacyOptions.map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              <span>坏心情怪兽</span>
              <select name="monsterId" value={draft.monsterId} onChange={(event) => updateDraft("monsterId", event.target.value)}>
                <option value="">自动匹配</option>
                {moodMonsters.map((monster) => (
                  <option value={monster.id} key={monster.id}>
                    {monster.name}：{monster.source}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>封面 URL</span>
              <input value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} placeholder="上传图片后自动填入。" />
            </label>
          </details>

          <label>
            <span>发布口令</span>
            <input value={token} onChange={(event) => setToken(event.target.value)} placeholder="已登录可不填；维护者口令用于应急发布" type="password" />
          </label>

          <div className="editor-actions">
            <button className="primary-link" type="submit">
              <Save size={18} />
              保存
            </button>
            {savedSlug ? (
              <Link className="secondary-link saved-link" href={`/notes/${savedSlug}`}>
                <Eye size={18} />
                查看
              </Link>
            ) : null}
          </div>
          {message ? <p className="form-message idle">{message}</p> : null}
        </form>
      </section>

      <section className="studio-panel studio-preview-panel">
        <div className="studio-panel-header">
          <div>
            <p className="eyebrow">Preview</p>
            <h2>实时预览</h2>
          </div>
          <FileText size={20} aria-hidden="true" />
        </div>

        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="editor-cover-preview" src={coverUrl} alt="" />
        ) : (
          <div className="editor-cover-placeholder" aria-hidden="true">
            <ImagePlus size={24} />
          </div>
        )}

        <article className="editor-preview">
          <p className="eyebrow">{sectionLabel(draft.section)}</p>
          <h3>{draft.title || "未命名记录"}</h3>
          <div className="preview-meta">
            <span>{draft.status === "draft" ? "草稿" : "发布"}</span>
            {draft.mood ? <span>{draft.mood}</span> : null}
            {draft.location ? <span>{draft.location}</span> : null}
          </div>
          {draft.summary ? <p className="article-summary">{draft.summary}</p> : null}
          <div className="article-content" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          {draft.tags ? (
            <footer className="article-tags">
              {draft.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
                .map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
            </footer>
          ) : null}
        </article>

        <form className="editor-form upload-form" action={upload}>
          <label>
            <span>图片文件</span>
            <input name="file" type="file" accept="image/*" required />
          </label>
          <button className="secondary-link" type="submit">
            <UploadCloud size={18} />
            上传图片
          </button>
        </form>
      </section>

      {admin?.level === "owner" ? (
        <section className="studio-panel">
          <div className="studio-panel-header">
            <div>
              <p className="eyebrow">Access</p>
              <h2>管理员邮箱</h2>
            </div>
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <div className="editor-form">
            <label>
              <span>添加管理员邮箱</span>
              <input value={newAdminEmail} onChange={(event) => setNewAdminEmail(event.target.value)} placeholder="name@example.com" type="email" />
            </label>
            <button className="secondary-link" type="button" onClick={addAdmin}>
              <Plus size={18} />
              添加
            </button>
            <div className="admin-member-list" aria-label="当前管理员邮箱">
              {adminMembers.admins.map((item) => (
                <div className="admin-member-row" key={item.email}>
                  <span>
                    <strong>{item.email}</strong>
                    <small>{item.level === "owner" ? "站点所有者" : item.source === "built-in" ? "内置管理员" : "管理员"}</small>
                  </span>
                  {item.source === "database" ? (
                    <button className="secondary-link danger-link" type="button" onClick={() => removeAdmin(item.email)} aria-label={`移除 ${item.email}`}>
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
