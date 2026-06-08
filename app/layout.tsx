import type { Metadata, Viewport } from "next";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        {children}
        <PwaClient />
      </body>
    </html>
  );
}
