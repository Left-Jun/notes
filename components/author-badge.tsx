import { displayProfile } from "@/lib/profile";
import type { UserProfile } from "@/lib/types";

type AuthorBadgeProps = {
  profile?: UserProfile | null;
  compact?: boolean;
  linked?: boolean;
};

export function AuthorBadge({ profile, compact = false, linked = true }: AuthorBadgeProps) {
  const display = displayProfile(profile);
  const href = !linked || display.deletedAt ? undefined : `/u/${display.id}`;
  const className = ["author-badge", compact ? "author-badge--compact" : "", display.deletedAt ? "is-deleted" : ""]
    .filter(Boolean)
    .join(" ");
  const content = (
    <>
      <img src={display.avatarUrl || "/img/avatar.jpg"} alt="" aria-hidden="true" />
      <span>{display.displayName}</span>
    </>
  );

  if (!href) {
    return <span className={className}>{content}</span>;
  }

  return (
    <a className={className} href={href}>
      {content}
    </a>
  );
}
