"use client";

import { LogOut, Save, Trash2, UploadCloud } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { profileChangedEvent, useCurrentProfile } from "@/components/profile-client";
import { defaultProfile, displayProfile, socialPlatforms } from "@/lib/profile";
import { getBrowserSupabase, isBrowserSupabaseConfigured } from "@/lib/supabase-browser";
import type { ProfileSocialLinks } from "@/lib/types";

type ProfileDraft = {
  displayName: string;
  avatarUrl: string;
  statusEmoji: string;
  statusText: string;
  bio: string;
  socialLinks: ProfileSocialLinks;
};

function draftFromProfile(profile = defaultProfile): ProfileDraft {
  const display = displayProfile(profile);
  return {
    displayName: display.displayName,
    avatarUrl: display.avatarUrl || "",
    statusEmoji: display.statusEmoji || "✦",
    statusText: display.statusText || "",
    bio: display.bio || "",
    socialLinks: display.socialLinks || {}
  };
}

async function sessionToken() {
  const supabase = getBrowserSupabase();
  const { data } = (await supabase?.auth.getSession()) || {};
  return data?.session?.access_token || "";
}

export function ProfileEditor() {
  const { loading, signedIn, profile } = useCurrentProfile();
  const [draft, setDraft] = useState<ProfileDraft>(() => draftFromProfile());
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (signedIn) setDraft(draftFromProfile(profile));
  }, [profile, signedIn]);

  function updateDraft<Key extends keyof ProfileDraft>(key: Key, value: ProfileDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateSocialLink(id: keyof ProfileSocialLinks, value: string) {
    setDraft((current) => ({
      ...current,
      socialLinks: {
        ...current.socialLinks,
        [id]: value
      }
    }));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("保存中...");

    try {
      const token = await sessionToken();
      const response = await fetch("/api/profile/me", {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify(draft)
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "保存失败。");
        return;
      }

      window.dispatchEvent(new Event(profileChangedEvent));
      setMessage("个人主页已更新。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(formData: FormData) {
    setBusy(true);
    setMessage("头像上传中...");

    try {
      const token = await sessionToken();
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`
        },
        body: formData
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "头像上传失败。");
        return;
      }

      updateDraft("avatarUrl", result.avatarUrl);
      window.dispatchEvent(new Event(profileChangedEvent));
      setMessage("头像已上传。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "头像上传失败。");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await getBrowserSupabase()?.auth.signOut();
    window.dispatchEvent(new Event(profileChangedEvent));
    window.location.href = "/";
  }

  async function deleteAccount() {
    if (!window.confirm("确认注销账号？注销后历史文章作者会显示为“已注销账号”。")) return;
    setBusy(true);
    setMessage("正在注销账号...");

    try {
      const token = await sessionToken();
      const response = await fetch("/api/profile/me", {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "注销失败。");
        return;
      }

      await getBrowserSupabase()?.auth.signOut();
      window.dispatchEvent(new Event(profileChangedEvent));
      window.location.href = "/";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "注销失败。");
    } finally {
      setBusy(false);
    }
  }

  if (!isBrowserSupabaseConfigured()) {
    return (
      <section className="auth-panel">
        <div className="auth-panel__intro">
          <p className="eyebrow">Profile</p>
          <h1>账号系统尚未配置。</h1>
          <p>需要配置 Supabase URL、Anon Key 和 Service Role Key 后，才能使用真实登录和个人主页编辑。</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return <p className="empty-state">正在读取个人主页...</p>;
  }

  if (!signedIn) {
    return (
      <section className="auth-panel">
        <div className="auth-panel__intro">
          <p className="eyebrow">Profile</p>
          <h1>登录后编辑个人主页。</h1>
          <p>头像、昵称、状态和社交链接会同步到左侧栏与右上角头像入口。</p>
          <div className="hero-actions">
            <a className="primary-link" href="/login">
              登录
            </a>
            <a className="secondary-link" href="/register">
              注册
            </a>
          </div>
        </div>
      </section>
    );
  }

  const display = displayProfile(profile);

  return (
    <section className="profile-editor">
      <div className="profile-editor__preview">
        <p className="eyebrow">Profile</p>
        <img className={display.deletedAt ? "profile-editor__avatar is-deleted" : "profile-editor__avatar"} src={draft.avatarUrl || "/img/avatar.jpg"} alt="" />
        <h1>{draft.displayName || display.displayName}</h1>
        <p className="profile-editor__status">
          <span>{draft.statusEmoji || "✦"}</span>
          {draft.statusText || "写下一点状态"}
        </p>
        <p>{draft.bio || "一句话介绍会显示在这里。"}</p>
      </div>

      <div className="profile-editor__forms">
        <form className="profile-avatar-form" action={uploadAvatar}>
          <label>
            <span>头像</span>
            <input name="avatar" type="file" accept="image/*" />
          </label>
          <button className="secondary-link" type="submit" disabled={busy}>
            <UploadCloud size={18} />
            上传头像
          </button>
        </form>

        <form className="profile-form" onSubmit={saveProfile}>
          <label>
            <span>昵称</span>
            <input value={draft.displayName} onChange={(event) => updateDraft("displayName", event.target.value)} />
          </label>
          <div className="form-grid">
            <label>
              <span>小图标表情</span>
              <input value={draft.statusEmoji} onChange={(event) => updateDraft("statusEmoji", event.target.value)} maxLength={8} />
            </label>
            <label>
              <span>状态</span>
              <input value={draft.statusText} onChange={(event) => updateDraft("statusText", event.target.value)} />
            </label>
          </div>
          <label>
            <span>一句话介绍</span>
            <textarea value={draft.bio} onChange={(event) => updateDraft("bio", event.target.value)} rows={3} />
          </label>
          <div className="profile-social-fields">
            {socialPlatforms.map((platform) => (
              <label key={platform.id}>
                <span>{platform.label}</span>
                <input
                  value={draft.socialLinks[platform.id] || ""}
                  onChange={(event) => updateSocialLink(platform.id, event.target.value)}
                  placeholder={platform.placeholder}
                />
              </label>
            ))}
          </div>
          <div className="profile-editor__actions">
            <button className="primary-link" type="submit" disabled={busy}>
              <Save size={18} />
              保存资料
            </button>
            <button className="secondary-link" type="button" onClick={signOut}>
              <LogOut size={18} />
              登出
            </button>
            <button className="secondary-link danger-link" type="button" onClick={deleteAccount} disabled={busy}>
              <Trash2 size={18} />
              注销账号
            </button>
          </div>
          {message ? <p className={message.includes("已") ? "form-message sent" : "form-message"}>{message}</p> : null}
        </form>
      </div>
    </section>
  );
}
