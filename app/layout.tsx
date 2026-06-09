import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { PwaClient } from "@/components/pwa-client";
import { siteDescription, siteTitle } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://notes.leftjun.com"),
  applicationName: "limenauts 手记",
  title: {
    default: siteTitle,
    template: "%s | limenauts"
  },
  description: siteDescription,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/brand/lj-mark.png",
    shortcut: "/brand/lj-mark.png",
    apple: "/brand/lj-mark.png"
  },
  appleWebApp: {
    capable: true,
    title: "limenauts 手记",
    statusBarStyle: "default"
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website"
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f5ee" },
    { media: "(prefers-color-scheme: dark)", color: "#141a19" }
  ]
};

function ThemeBootScript() {
  const script = `
(() => {
  try {
    const themeKey = "limenaut-notes-theme";
    const sidebarKey = "limenaut-notes-sidebar-collapsed";
    const savedTheme = window.localStorage.getItem(themeKey);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = savedTheme || (prefersDark ? "dark" : "light");

    if (window.localStorage.getItem(sidebarKey) === "1" && window.matchMedia("(min-width: 1101px)").matches) {
      document.documentElement.dataset.sidebarCollapsed = "true";
    }
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

  return <Script id="limenauts-theme-boot" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: script }} />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeBootScript />
        {children}
        <PwaClient />
      </body>
    </html>
  );
}
