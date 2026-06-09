"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState } from "react";

const storageKey = "limenaut-notes-sidebar-collapsed";
const desktopQuery = "(min-width: 1101px)";
const mobileQuery = "(max-width: 620px)";

export function SidebarCollapseButton() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(desktopQuery);

    function apply(next: boolean) {
      const canCollapse = media.matches;
      if (next && canCollapse) {
        document.documentElement.dataset.sidebarCollapsed = "true";
      } else {
        delete document.documentElement.dataset.sidebarCollapsed;
      }
      setCollapsed(next && canCollapse);
    }

    apply(window.localStorage.getItem(storageKey) === "1");

    function onChange() {
      apply(window.localStorage.getItem(storageKey) === "1");
    }

    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
      delete document.documentElement.dataset.sidebarCollapsed;
    };
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(storageKey, next ? "1" : "0");
      if (next) {
        document.documentElement.dataset.sidebarCollapsed = "true";
      } else {
        delete document.documentElement.dataset.sidebarCollapsed;
      }
      return next;
    });
  }

  return (
    <button
      className="sidebar-collapse-button"
      type="button"
      onClick={toggleCollapsed}
      aria-label={collapsed ? "展开侧栏" : "收起侧栏"}
      aria-pressed={collapsed}
    >
      {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      <span>{collapsed ? "展开" : "收起"}</span>
    </button>
  );
}

export function MobileNavController() {
  useEffect(() => {
    const media = window.matchMedia(mobileQuery);

    function apply() {
      document.body.classList.toggle("notes-mobile-nav-visible", media.matches && window.scrollY > 280);
    }

    apply();
    window.addEventListener("scroll", apply, { passive: true });
    media.addEventListener("change", apply);

    return () => {
      window.removeEventListener("scroll", apply);
      media.removeEventListener("change", apply);
      document.body.classList.remove("notes-mobile-nav-visible");
    };
  }, []);

  return null;
}
