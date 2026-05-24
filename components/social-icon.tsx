import { BookText, GitFork, Play, Tv } from "lucide-react";

export function SocialIcon({ id }: { id: string }) {
  if (id === "github") return <GitFork size={18} />;
  if (id === "youtube") return <Play size={18} />;
  if (id === "bilibili") return <Tv size={18} />;
  if (id === "xiaohongshu") return <BookText size={18} />;
  return <BookText size={18} />;
}
