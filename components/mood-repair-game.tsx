"use client";

import { HeartHandshake, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { MoodMonster } from "@/lib/mood";

type MoodRepairGameProps = {
  monster: MoodMonster;
  moodEntryId?: string | null;
  entryId?: string | null;
  noteSlug?: string | null;
  initialSupportCount?: number;
};

const actions = ["送一句支持", "拆成小任务", "陪 TA 呼吸一下"];

export function MoodRepairGame({ monster, moodEntryId, entryId, noteSlug, initialSupportCount = monster.supportCount }: MoodRepairGameProps) {
  const [hp, setHp] = useState(monster.hp);
  const [supportCount, setSupportCount] = useState(initialSupportCount);
  const [selectedAction, setSelectedAction] = useState(actions[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(monster.encouragements[0]);
  const [busy, setBusy] = useState(false);
  const progress = useMemo(() => Math.max(0, Math.min(100, Math.round((hp / monster.maxHp) * 100))), [hp, monster.maxHp]);

  async function support(action = selectedAction) {
    if (busy) return;
    setBusy(true);

    try {
      const response = await fetch("/api/mood/support", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          monsterId: monster.id,
          moodEntryId,
          entryId,
          noteSlug,
          action,
          message
        })
      });
      const result = await response.json();

      if (!response.ok) {
        setStatus(result.error || "支持发送失败。");
        return;
      }

      setHp((current) => Math.max(0, current - 12));
      setSupportCount(typeof result.supportCount === "number" ? result.supportCount : supportCount + 1);
      setStatus(message.trim() ? "这句鼓励已经送到对方的小站。" : monster.encouragements[supportCount % monster.encouragements.length]);
      setMessage("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "支持发送失败。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="monster-game" aria-label="击败坏心情怪兽">
      <div className="monster-orb" aria-hidden="true">
        <span>{monster.name.slice(0, 1)}</span>
      </div>
      <div className="monster-game__body">
        <p className="eyebrow">Repair Game</p>
        <h2>{monster.name}</h2>
        <p>{monster.source}</p>

        <div className="monster-hp" aria-label={`怪兽剩余 ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="monster-actions">
          {actions.map((action) => (
            <button
              type="button"
              className={selectedAction === action ? "is-active" : ""}
              onClick={() => setSelectedAction(action)}
              disabled={busy}
              key={action}
            >
              <HeartHandshake size={16} />
              {action}
            </button>
          ))}
        </div>

        {moodEntryId ? (
          <label className="monster-message-field">
            <span>留一句短鼓励</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 140))}
              rows={3}
              placeholder="比如：先让今天变轻一点点，也算赢。"
            />
          </label>
        ) : null}

        <button className="primary-link monster-send-button" type="button" onClick={() => support(selectedAction)} disabled={busy}>
          <Send size={18} />
          {moodEntryId ? "送出鼓励" : "再支持一次"}
        </button>

        <div className="monster-game__result">
          <Sparkles size={18} />
          <p>{status}</p>
          <span>{supportCount} 次支持</span>
        </div>
      </div>
    </section>
  );
}
