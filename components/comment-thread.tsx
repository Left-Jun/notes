"use client";

import { MessageCircle, Send } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useCurrentProfile } from "@/components/profile-client";
import { displayProfile } from "@/lib/profile";
import type { NoteComment } from "@/lib/types";

type CommentThreadProps = {
  noteId: string;
  noteSlug: string;
  initialComments: NoteComment[];
};

function formatCommentTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function CommentThread({ noteId, noteSlug, initialComments }: CommentThreadProps) {
  const { signedIn, profile } = useCurrentProfile();
  const display = displayProfile(profile);
  const [comments, setComments] = useState(initialComments);
  const [authorName, setAuthorName] = useState("");
  const [authorUrl, setAuthorUrl] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const suggestedName = useMemo(() => (signedIn ? display.displayName : ""), [display.displayName, signedIn]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("正在发送评论...");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          noteId,
          noteSlug,
          authorName: authorName.trim() || suggestedName || "路过的人",
          authorUrl,
          body
        })
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "评论发送失败。");
        return;
      }

      setComments((current) => [...current, result.comment]);
      setBody("");
      if (!authorName && suggestedName) setAuthorName(suggestedName);
      setMessage("评论已发布。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "评论发送失败。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="comment-panel" aria-label="评论">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Comments</p>
          <h2>评论</h2>
        </div>
        <span>
          <MessageCircle size={16} />
          {comments.length}
        </span>
      </div>

      {comments.length > 0 ? (
        <div className="comment-list">
          {comments.map((comment) => (
            <article className="comment-card" key={comment.id}>
              <header>
                {comment.authorUrl ? (
                  <a href={comment.authorUrl} target="_blank" rel="nofollow noopener noreferrer">
                    {comment.authorName}
                  </a>
                ) : (
                  <strong>{comment.authorName}</strong>
                )}
                <time>{formatCommentTime(comment.createdAt)}</time>
              </header>
              <p>{comment.body}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state compact-empty">还没有评论，可以留下第一句回应。</p>
      )}

      <form className="comment-form" onSubmit={submit}>
        <div className="form-grid">
          <label>
            <span>昵称</span>
            <input value={authorName} onChange={(event) => setAuthorName(event.target.value)} placeholder={suggestedName || "路过的人"} />
          </label>
          <label>
            <span>链接（可选）</span>
            <input value={authorUrl} onChange={(event) => setAuthorUrl(event.target.value)} placeholder="https://example.com" />
          </label>
        </div>
        <label>
          <span>评论内容</span>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} placeholder="写一点回应、补充或问候。" required />
        </label>
        <div className="comment-form__actions">
          <button className="primary-link" type="submit" disabled={busy}>
            <Send size={18} />
            发送评论
          </button>
          {message ? <p className={message.includes("已") ? "form-message sent" : "form-message"}>{message}</p> : null}
        </div>
      </form>
    </section>
  );
}
