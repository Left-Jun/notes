"use client";

import { LogIn, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { SocialIcon } from "@/components/social-icon";
import { defaultProfile, displayProfile, visibleSocialLinks } from "@/lib/profile";
import { getBrowserSupabase, isBrowserSupabaseConfigured } from "@/lib/supabase-browser";
import type { UserProfile } from "@/lib/types";

export const profileChangedEvent = "limenauts-notes-profile-changed";

type ProfileState = {
  loading: boolean;
  signedIn: boolean;
  profile: UserProfile;
};

async function fetchCurrentProfile() {
  const supabase = getBrowserSupabase();
  if (!supabase) return { signedIn: false, profile: defaultProfile };

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { signedIn: false, profile: defaultProfile };

  const response = await fetch("/api/profile/me", {
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    await supabase.auth.signOut();
    return { signedIn: false, profile: defaultProfile };
  }

  const result = (await response.json()) as { profile?: UserProfile };
  return {
    signedIn: Boolean(result.profile),
    profile: result.profile || defaultProfile
  };
}

export function useCurrentProfile() {
  const [state, setState] = useState<ProfileState>({
    loading: true,
    signedIn: false,
    profile: defaultProfile
  });

  useEffect(() => {
    let mounted = true;

    async function syncProfile() {
      const next = await fetchCurrentProfile();
      if (mounted) setState({ loading: false, ...next });
    }

    syncProfile();

    const supabase = getBrowserSupabase();
    const subscription = supabase?.auth.onAuthStateChange(() => {
      syncProfile();
    }).data.subscription;

    window.addEventListener(profileChangedEvent, syncProfile);
    return () => {
      mounted = false;
      subscription?.unsubscribe();
      window.removeEventListener(profileChangedEvent, syncProfile);
    };
  }, []);

  return state;
}

export function SidebarProfile() {
  const { loading, signedIn, profile } = useCurrentProfile();

  if (loading) {
    return (
      <div className="profile-card profile-card--guest">
        <div className="profile">
          <div className="profile-head">
            <span className="avatar-wrap avatar-wrap--placeholder" aria-hidden="true">
              <UserRound size={22} />
            </span>
          </div>
          <div className="profile-copy">
            <p className="profile-name">读取中</p>
            <p className="profile-subtitle">正在确认登录状态。</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isBrowserSupabaseConfigured() || !signedIn) {
    return (
      <div className="profile-card profile-card--guest">
        <div className="profile">
          <div className="profile-head">
            <a className="avatar-wrap avatar-wrap--placeholder" href="/login" aria-label="登录账号">
              <UserRound size={22} />
            </a>
          </div>
          <div className="profile-copy">
            <p className="profile-name">未登录</p>
            <p className="profile-subtitle">登录后这里会显示你的头像、昵称和状态。</p>
          </div>
          <div className="profile-guest-actions">
            <a href="/login">登录</a>
            <a href="/register">注册</a>
          </div>
        </div>
      </div>
    );
  }

  const display = displayProfile(profile);
  const links = visibleSocialLinks(display.socialLinks);
  const profileHref = display.id === defaultProfile.id ? `/u/${defaultProfile.id}` : "/me";

  return (
    <div className="profile-card">
      <div className="profile">
        <div className="profile-head">
          <a className="avatar-wrap" href={profileHref} aria-label="打开个人主页">
            <img className={display.deletedAt ? "avatar is-deleted" : "avatar"} src={display.avatarUrl || "/img/avatar.jpg"} alt="" />
            <span className="avatar-status" tabIndex={0} aria-label={display.statusText || "个人状态"}>
              <span aria-hidden="true">{display.statusEmoji || "✦"}</span>
              <span className="status-popover" role="tooltip">
                <strong>{display.statusText || defaultProfile.statusText}</strong>
              </span>
            </span>
          </a>
        </div>
        <div className="profile-copy">
          <p className="profile-name">{display.displayName}</p>
          <p className="profile-subtitle">{display.bio || defaultProfile.bio}</p>
        </div>
        {links.length > 0 ? (
          <div className="profile-social" aria-label="社交链接">
            {links.map((item) => (
              <a href={item.href} target="_blank" rel="me noopener noreferrer" aria-label={item.label} title={item.label} key={item.id}>
                <SocialIcon id={item.id} />
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AuthQuickEntry() {
  const { signedIn, profile } = useCurrentProfile();
  const display = displayProfile(profile);

  if (!isBrowserSupabaseConfigured() || !signedIn) {
    return (
      <a className="toolbar-login-link" href="/login" aria-label="登录">
        <LogIn size={17} />
        <span>登录</span>
      </a>
    );
  }

  return (
    <a className="toolbar-avatar-link" href="/me" aria-label="打开个人主页" title="打开个人主页">
      <img className={display.deletedAt ? "is-deleted" : ""} src={display.avatarUrl || "/img/avatar.jpg"} alt={display.displayName} />
    </a>
  );
}

export function MobileProfileNavItem({ active = false }: { active?: boolean }) {
  const { signedIn, profile } = useCurrentProfile();
  const display = displayProfile(profile);

  if (!isBrowserSupabaseConfigured() || !signedIn) {
    return (
      <a className={active ? "is-active" : ""} href="/login" aria-current={active ? "page" : undefined}>
        <LogIn size={17} />
        <span>登录</span>
      </a>
    );
  }

  return (
    <a className={active ? "is-active" : ""} href="/me" aria-current={active ? "page" : undefined}>
      {display.avatarUrl ? <img src={display.avatarUrl} alt="" aria-hidden="true" /> : <UserRound size={17} />}
      <span>我的</span>
    </a>
  );
}
