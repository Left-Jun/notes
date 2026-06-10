"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const dismissedKey = "limenauts-notes-install-dismissed";

function isStandaloneDisplay() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
}

export function PwaClient() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          registration.update().catch(() => undefined);
        })
        .catch(() => undefined);
    }

    if (isStandaloneDisplay() || window.localStorage.getItem(dismissedKey) === "1") return;

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice.catch(() => undefined);
    setVisible(false);
    setPromptEvent(null);
  }

  function dismiss() {
    window.localStorage.setItem(dismissedKey, "1");
    setVisible(false);
  }

  if (!visible || !promptEvent) return null;

  return (
    <div className="install-toast" role="status" aria-live="polite">
      <div>
        <strong>安装手记</strong>
        <span>以应用方式打开</span>
      </div>
      <button type="button" onClick={install}>
        <Download size={16} />
        安装
      </button>
      <button className="install-toast__close" type="button" onClick={dismiss} aria-label="关闭安装提示">
        <X size={16} />
      </button>
    </div>
  );
}
