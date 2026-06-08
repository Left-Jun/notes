"use client";

import { Heart, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { MoodMonster } from "@/lib/mood";

type MoodRepairGameProps = {
  monster: MoodMonster;
  entryId?: string | null;
  noteSlug?: string | null;
  initialSupportCount?: number;
};

const actions = [
  { label: "送一句支持", power: 10 },
  { label: "拆成小任务", power: 14 },
  { label: "陪 TA 呼吸一下", power: 12 }
];

export function MoodRepairGame({ monster, entryId, noteSlug, initialSupportCount = monster.supportCount }: MoodRepairGameProps) {
  const [hits, setHits] = useState(0);
  const [lastAction, setLastAction] = useState(actions[0].label);
  const [supportCount, setSupportCount] = useState(initialSupportCount);
  const [syncMessage, setSyncMessage] = useState("");

  const damage = hits * 12;
  const remaining = Math.max(0, monster.hp - damage);
  const progress = Math.round(((monster.maxHp - remaining) / monster.maxHp) * 100);
  const finished = remaining === 0;
  const encouragement = useMemo(() => monster.encouragements[hits % monster.encouragements.length], [hits, monster.encouragements]);

  async function support(action: (typeof actions)[number]) {
    setLastAction(action.label);
    setHits((value) => value + Math.ceil(action.power / 12));
    setSupportCount((value) => value + 1);
    setSyncMessage("正在记录这次支持...");

    try {
      const response = await fetch("/api/mood/support", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          monsterId: monster.id,
          entryId,
          noteSlug,
          action: action.label
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "保存失败");
      }

      if (typeof result.supportCount === "number") {
        setSupportCount(result.supportCount);
      }

      setSyncMessage(result.storage === "local" ? "已保存到本地演示支持记录。" : "已记录一次匿名支持。");
    } catch {
      setSyncMessage("这次互动已在页面内完成，但支持记录没有写入。");
    }
  }

  function reset() {
    setHits(0);
    setLastAction(actions[0].label);
    setSyncMessage("");
  }

  return (
    <div className="repair-game" aria-live="polite">
      <div className="repair-stage">
        <div className={finished ? "monster-core is-calm" : "monster-core"} aria-hidden="true">
          <span>{finished ? "已安静" : monster.name}</span>
        </div>
        <div className="monster-meter" aria-label={`${monster.name} 剩余状态`}>
          <span style={{ width: `${Math.max(0, 100 - progress)}%` }} />
        </div>
        <p>{finished ? "这只坏心情怪兽已经被暂时安放好了。" : encouragement}</p>
      </div>

      <div className="repair-actions">
        {actions.map((action) => (
          <button type="button" onClick={() => support(action)} key={action.label}>
            <Heart size={16} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      <div className="repair-result">
        <div>
          <Sparkles size={16} />
          <span>{finished ? "修复完成" : lastAction}</span>
        </div>
        <strong>{remaining} / {monster.maxHp}</strong>
        <span>{supportCount} 次支持</span>
        <button type="button" onClick={reset} aria-label="重置这次小游戏">
          <RotateCcw size={15} />
        </button>
      </div>
      {syncMessage ? <p className="repair-sync">{syncMessage}</p> : null}
    </div>
  );
}
