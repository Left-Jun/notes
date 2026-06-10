"use client";

import { KeyRound, LogIn, Mail, ShieldCheck, UserRound, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { profileChangedEvent } from "@/components/profile-client";
import { getBrowserSupabase, isBrowserSupabaseConfigured } from "@/lib/supabase-browser";

type AuthPanelProps = {
  mode: "login" | "register";
};

export function AuthPanel({ mode }: AuthPanelProps) {
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function syncProfile() {
    const supabase = getBrowserSupabase();
    const { data } = (await supabase?.auth.getSession()) || {};
    const token = data?.session?.access_token;
    if (!token) return null;

    const response = await fetch("/api/profile/me", {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "个人资料同步失败。");
    }
    return result.profile;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const supabase = getBrowserSupabase();
    if (!supabase || !isBrowserSupabaseConfigured()) {
      setMessage("Supabase Auth 尚未配置，暂时无法登录或注册。");
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (isRegister && trimmedName.length < 2) {
      setMessage("昵称至少需要 2 个字符。");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setMessage("请输入一个可识别的邮箱。");
      return;
    }

    if (password.length < 4) {
      setMessage("密码至少需要 4 位。");
      return;
    }

    setBusy(true);
    try {
      const authResult = isRegister
        ? await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              data: {
                display_name: trimmedName
              }
            }
          })
        : await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password
          });

      if (authResult.error) {
        setMessage(authResult.error.message);
        return;
      }

      if (!authResult.data.session) {
        setMessage("注册信息已提交，请按 Supabase 邮件确认后再登录。");
        return;
      }

      const profile = await syncProfile();
      if (profile?.deletedAt) {
        await supabase.auth.signOut();
        setMessage("这个账号已经注销，不能继续登录。");
        return;
      }

      window.dispatchEvent(new Event(profileChangedEvent));
      setMessage(isRegister ? "注册完成，正在进入个人主页。" : "登录成功，正在进入个人主页。");
      window.setTimeout(() => {
        window.location.href = "/me";
      }, 650);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败，请稍后再试。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-panel">
      <div className="auth-panel__intro">
        <p className="eyebrow">{isRegister ? "Register" : "Login"}</p>
        <h1>{isRegister ? "创建你的记录账号。" : "登录后继续记录。"}</h1>
        <p>
          账号用于保存你的个人资料、文章、情绪记录和评论身份。未登录时，站点不会再默认显示开发者的个人资料。
        </p>
        <div className="auth-benefits" aria-label="账号能力">
          <span>
            <ShieldCheck size={16} />
            资料独立保存
          </span>
          <span>
            <UserRound size={16} />
            左栏同步头像
          </span>
          <span>
            <Mail size={16} />
            邮箱密码登录
          </span>
        </div>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {isRegister ? (
          <label>
            <span>
              <UserRound size={16} />
              昵称
            </span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="你的昵称" autoComplete="name" />
          </label>
        ) : null}
        <label>
          <span>
            <Mail size={16} />
            邮箱
          </span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="你的邮箱地址" type="email" autoComplete="email" />
        </label>
        <label>
          <span>
            <KeyRound size={16} />
            密码
          </span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={isRegister ? "设置登录密码" : "输入登录密码"}
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
        </label>

        <div className="auth-form__actions">
          <button className="primary-link" type="submit" disabled={busy}>
            {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
            {busy ? "处理中..." : isRegister ? "注册账号" : "登录"}
          </button>
          <a className="secondary-link" href={isRegister ? "/login" : "/register"}>
            {isRegister ? "已有账号" : "注册"}
          </a>
        </div>

        {message ? <p className={message.includes("成功") || message.includes("完成") ? "form-message sent" : "form-message"}>{message}</p> : null}
      </form>
    </section>
  );
}
