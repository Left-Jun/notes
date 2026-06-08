"use client";

import { KeyRound, LogIn, Mail, UserRound, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { authChangedEvent, authStorageKey } from "@/components/auth-quick-entry";

type AuthPanelProps = {
  mode: "login" | "register";
};

export function AuthPanel({ mode }: AuthPanelProps) {
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [knownUser, setKnownUser] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(authStorageKey);
      if (raw) {
        const user = JSON.parse(raw) as { name?: string; email?: string };
        setKnownUser(user.name || user.email || null);
        setName(user.name || "");
        setEmail(user.email || "");
      }
    } catch {
      setKnownUser(null);
    }
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      setMessage("密码至少需要 4 位，用于本地演示状态。");
      return;
    }

    const user = {
      name: isRegister ? trimmedName : trimmedName || knownUser || "limenaut",
      email: trimmedEmail,
      signedAt: new Date().toISOString()
    };

    window.localStorage.setItem(authStorageKey, JSON.stringify(user));
    window.dispatchEvent(new Event(authChangedEvent));
    setKnownUser(user.name);
    setMessage(isRegister ? "注册完成，正在进入手记主页。" : "登录成功，正在回到手记主页。");
    window.setTimeout(() => {
      window.location.href = "/";
    }, 650);
  }

  function logout() {
    window.localStorage.removeItem(authStorageKey);
    window.dispatchEvent(new Event(authChangedEvent));
    setKnownUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setMessage("已退出本地登录状态。");
  }

  return (
    <section className="auth-panel">
      <div className="auth-panel__intro">
        <p className="eyebrow">{isRegister ? "Register" : "Login"}</p>
        <h1>{isRegister ? "创建一个手记身份。" : "回到你的手记身份。"}</h1>
        <p>
          这里先保留轻量本地状态，用来驱动右上角头像入口和后续个人区；真正的线上账号、权限和私密同步可以等 Supabase Auth
          接入时再升级。
        </p>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {isRegister ? (
          <label>
            <span>
              <UserRound size={16} />
              昵称
            </span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如 Left Jun" autoComplete="name" />
          </label>
        ) : null}
        <label>
          <span>
            <Mail size={16} />
            邮箱
          </span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" autoComplete="email" />
        </label>
        <label>
          <span>
            <KeyRound size={16} />
            密码
          </span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="本地演示密码"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
        </label>

        <div className="auth-form__actions">
          <button className="primary-link" type="submit">
            {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
            {isRegister ? "注册并进入" : "登录"}
          </button>
          <a className="secondary-link" href={isRegister ? "/login" : "/register"}>
            {isRegister ? "已有账号" : "注册"}
          </a>
          {knownUser ? (
            <button className="secondary-link" type="button" onClick={logout}>
              退出本地状态
            </button>
          ) : null}
        </div>

        {message ? <p className={message.includes("成功") || message.includes("完成") ? "form-message sent" : "form-message"}>{message}</p> : null}
      </form>
    </section>
  );
}
