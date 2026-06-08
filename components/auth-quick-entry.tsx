"use client";

import { LogIn } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export const authStorageKey = "limenauts-notes-user";
export const authChangedEvent = "limenauts-notes-auth-changed";

type LocalUser = {
  name: string;
  email: string;
};

function readUser() {
  try {
    const raw = window.localStorage.getItem(authStorageKey);
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
}

export function AuthQuickEntry() {
  const [user, setUser] = useState<LocalUser | null>(null);

  useEffect(() => {
    setUser(readUser());

    function syncUser() {
      setUser(readUser());
    }

    window.addEventListener("storage", syncUser);
    window.addEventListener(authChangedEvent, syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener(authChangedEvent, syncUser);
    };
  }, []);

  if (!user) {
    return (
      <a className="toolbar-login-link" href="/login" aria-label="登录">
        <LogIn size={17} />
        <span>登录</span>
      </a>
    );
  }

  return (
    <a className="toolbar-avatar-link" href="/" aria-label={`${user.name} · 回到主页`} title={`${user.name} · 回到主页`}>
      <Image src="/img/avatar.jpg" alt="" width={36} height={36} aria-hidden="true" />
      <span>{user.name}</span>
    </a>
  );
}
