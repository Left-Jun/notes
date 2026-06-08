import { BookText, Camera, GitFork, Globe2, Play, Radio, Tv } from "lucide-react";

export function SocialIcon({ id }: { id: string }) {
  if (id === "website") return <Globe2 size={18} />;
  if (id === "github") return <GitFork size={18} />;
  if (id === "youtube") return <Play size={18} />;
  if (id === "bilibili") return <Tv size={18} />;
  if (id === "xiaohongshu") return <BookText size={18} />;
  if (id === "instagram") return <Camera size={18} />;
  if (id === "weibo") return <Radio size={18} />;
  return <BookText size={18} />;
}
