import type { Metadata } from "next";
import { siteDescription, siteTitle } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://notes.leftjun.com"),
  title: {
    default: siteTitle,
    template: "%s | limenauts"
  },
  description: siteDescription,
  icons: {
    icon: "/brand/lj-mark.png",
    shortcut: "/brand/lj-mark.png",
    apple: "/brand/lj-mark.png"
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
