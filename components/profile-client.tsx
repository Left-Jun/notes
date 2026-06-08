"use client";

import { LogIn } from "lucide-react";
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
    return { signedIn: true, profile: defaultProfile };
  }

  const result = (await response.json()) as { profile?: UserProfile };
  return {
    signedIn: true,
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
  const { profile } = useCurrentProfile();
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
                <small>{display.bio || defaultProfile.bio}</small>
              </span>
            </span>
          </a>
        </div>
        <div className="profile-copy">
          <p className="profile-name">{display.displayName}</p>
          {display.statusText ? <p className="profile-role">{display.statusText}</p> : null}
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
      <img className={display.deletedAt ? "is-deleted" : ""} src={display.avatarUrl || "/img/avatar.jpg"} alt="" aria-hidden="true" />
      <span>{display.displayName}</span>
    </a>
  );
}
