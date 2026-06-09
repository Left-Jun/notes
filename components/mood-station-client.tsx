"use client";

import { CalendarDays, ChevronDown, HeartPulse, Inbox, Plus, RefreshCw, Send, Sparkles, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useCurrentProfile } from "@/components/profile-client";
import { getMoodMonster } from "@/lib/mood";
import { displayProfile } from "@/lib/profile";
import { getBrowserSupabase, isBrowserSupabaseConfigured } from "@/lib/supabase-browser";
import type { MoodCoreSummary, MoodDailyGroup, MoodEncouragement, MoodEntryRecord, MoodPrivacy } from "@/lib/types";

type MoodBundle = {
  entries: MoodEntryRecord[];
  dailyGroups: MoodDailyGroup[];
  core: MoodCoreSummary;
  encouragements: MoodEncouragement[];
};

type MoodDraft = {
  mood: string;
  intensity: string;
  coreReason: string;
  nextAction: string;
  note: string;
  tags: string;
  privacy: MoodPrivacy;
  recordedAt: string;
};

const pressureMonster = getMoodMonster("pressure-bloom") || {
  id: "pressure-bloom",
  name: "压力苔",
  source: "压力、DDL 和还没说出口的紧张",
  tone: "偏重但可处理",
  hp: 52,
  maxHp: 100,
  supportCount: 0,
  summary: "它不会一下子消失，但可以被拆成一件一件更小的事。",
  encouragements: []
};

const defaultCore: MoodCoreSummary = {
  title: "今天还没有记录",
  mood: "待记录",
  intensity: 0,
  entryCount: 0,
  coreReason: "先写下一条此刻状态，不需要完整解释。",
  nextAction: "用 30 秒记录一个情绪核心。"
};

const defaultBundle: MoodBundle = {
  entries: [],
  dailyGroups: [],
  core: defaultCore,
  encouragements: []
};

function toLocalInputValue(value = new Date().toISOString()) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function createDraft(): MoodDraft {
  return {
    mood: "",
    intensity: "50",
    coreReason: "",
    nextAction: "",
    note: "",
    tags: "",
    privacy: "private",
    recordedAt: toLocalInputValue()
  };
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function privacyLabel(value: MoodPrivacy) {
  if (value === "anonymous") return "匿名公开";
  if (value === "summary") return "摘要公开";
  return "私密";
}

async function getSessionToken() {
  const supabase = getBrowserSupabase();
  const { data } = (await supabase?.auth.getSession()) || {};
  return data?.session?.access_token || "";
}

function StageMonster({
  core,
  entryCount,
  supportCount,
  averageIntensity,
  loading,
  onRefresh
}: {
  core: MoodCoreSummary;
  entryCount: number;
  supportCount: number;
  averageIntensity: number;
  loading: boolean;
  onRefresh?: () => void;
}) {
  return (
    <div className="mood-stage__monster">
      <div className="mood-stage__topline">
        <span>
          <Sparkles size={17} />
          今日情绪核心
        </span>
        {onRefresh ? (
          <button type="button" onClick={onRefresh} disabled={loading} aria-label="刷新情绪小站">
            <RefreshCw size={16} />
          </button>
        ) : null}
      </div>

      <div className="mood-stage__visual" aria-hidden="true">
        <div className="mood-stage__orb">
          <span>苔</span>
        </div>
      </div>

      <div className="mood-stage__copy">
        <p className="eyebrow">Pressure Bloom</p>
        <h2>{pressureMonster.name}</h2>
        <p>{pressureMonster.summary}</p>
      </div>

      <div className="mood-stage__core">
        <div>
          <span>{core.title}</span>
          <strong>{core.mood}</strong>
        </div>
        <div className="mood-stage__meter" aria-label={`情绪强度 ${core.intensity}`}>
          <span style={{ width: `${core.intensity}%` }} />
        </div>
        <p>{core.coreReason}</p>
        <small>{core.nextAction}</small>
      </div>

      <div className="mood-stage__stats" aria-label="情绪小站摘要">
        <span>
          <strong>{entryCount}</strong>
          今日记录
        </span>
        <span>
          <strong>{averageIntensity}</strong>
          平均强度
        </span>
        <span>
          <strong>{supportCount}</strong>
          收到鼓励
        </span>
      </div>
    </div>
  );
}

export function MoodStationClient() {
  const { loading: profileLoading, signedIn, profile } = useCurrentProfile();
  const [bundle, setBundle] = useState<MoodBundle>(defaultBundle);
  const [draft, setDraft] = useState<MoodDraft>(() => createDraft());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const display = displayProfile(profile);
  const supabaseReady = isBrowserSupabaseConfigured();

  const recentEntries = useMemo(() => bundle.entries.slice(0, 6), [bundle.entries]);
  const supportTotal = useMemo(() => bundle.entries.reduce((total, entry) => total + entry.supportCount, 0), [bundle.entries]);
  const averageIntensity = useMemo(() => {
    if (!bundle.entries.length) return 0;
    return Math.round(bundle.entries.reduce((total, entry) => total + entry.intensity, 0) / bundle.entries.length);
  }, [bundle.entries]);
  const encouragementCount = bundle.encouragements.length || supportTotal;

  async function loadBundle() {
    const token = await getSessionToken();
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch("/api/mood/entries", {
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "读取情绪小站失败。");
        return;
      }

      setBundle({
        entries: result.entries || [],
        dailyGroups: result.dailyGroups || [],
        core: result.core || defaultCore,
        encouragements: result.encouragements || []
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "读取情绪小站失败。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!profileLoading && signedIn) {
      loadBundle();
    }
  }, [profileLoading, signedIn]);

  function updateDraft<Key extends keyof MoodDraft>(key: Key, value: MoodDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await getSessionToken();

    if (!token) {
      setMessage("请先登录后再记录。");
      return;
    }

    setBusy(true);
    setMessage("正在保存这条情绪记录...");

    try {
      const response = await fetch("/api/mood/entries", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          ...draft,
          intensity: Number(draft.intensity),
          tags: draft.tags.split(/[,，、\s]+/).filter(Boolean),
          recordedAt: draft.recordedAt ? new Date(draft.recordedAt).toISOString() : new Date().toISOString()
        })
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "保存失败。");
        return;
      }

      setDraft(createDraft());
      setMessage("已保存一条新的情绪记录。");
      await loadBundle();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setBusy(false);
    }
  }

  async function deleteEntry(id: string) {
    if (!window.confirm("删除这条情绪记录？")) return;
    const token = await getSessionToken();
    if (!token) return;

    setBusy(true);
    try {
      const response = await fetch(`/api/mood/entries?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "删除失败。");
        return;
      }

      setMessage("记录已删除。");
      await loadBundle();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败。");
    } finally {
      setBusy(false);
    }
  }

  if (profileLoading) {
    return <p className="empty-state">正在读取情绪小站...</p>;
  }

  return (
    <section className="mood-station" aria-label={`${display.displayName} 的情绪小站`}>
      <section className="mood-stage" aria-label="压力苔与新情绪记录">
        <StageMonster
          core={bundle.core}
          entryCount={bundle.core.entryCount}
          supportCount={encouragementCount}
          averageIntensity={averageIntensity}
          loading={loading}
          onRefresh={signedIn ? loadBundle : undefined}
        />

        {supabaseReady && signedIn ? (
          <form className="mood-entry-form mood-entry-form--stage" id="new-entry" onSubmit={submitEntry}>
            <div className="mood-entry-form__head">
              <p className="eyebrow">New Entry</p>
              <h2>记录新情绪</h2>
              <span>先抓住核心，再慢慢整理细节。</span>
            </div>

            <div className="form-grid">
              <label>
                <span>情绪</span>
                <input value={draft.mood} onChange={(event) => updateDraft("mood", event.target.value)} placeholder="焦虑 / 平静 / 疲惫..." required />
              </label>
              <label>
                <span>强度 {draft.intensity}</span>
                <input type="range" min="0" max="100" value={draft.intensity} onChange={(event) => updateDraft("intensity", event.target.value)} />
              </label>
            </div>

            <label>
              <span>情绪核心</span>
              <input value={draft.coreReason} onChange={(event) => updateDraft("coreReason", event.target.value)} placeholder="这次情绪主要来自什么？" required />
            </label>

            <label>
              <span>下一步修复动作</span>
              <input value={draft.nextAction} onChange={(event) => updateDraft("nextAction", event.target.value)} placeholder="比如：先写 3 行、喝水、睡前停下" />
            </label>

            <details className="mood-more-options">
              <summary>
                <span>更多选项</span>
                <ChevronDown size={16} />
              </summary>
              <div className="mood-advanced-fields">
                <label>
                  <span>记录时间</span>
                  <input type="datetime-local" value={draft.recordedAt} onChange={(event) => updateDraft("recordedAt", event.target.value)} />
                </label>
                <label>
                  <span>备注</span>
                  <textarea
                    value={draft.note}
                    onChange={(event) => updateDraft("note", event.target.value)}
                    rows={4}
                    placeholder="可以写给自己看，也可以只留一句摘要。"
                  />
                </label>
                <div className="form-grid">
                  <label>
                    <span>标签</span>
                    <input value={draft.tags} onChange={(event) => updateDraft("tags", event.target.value)} placeholder="学习, 睡眠, 社交" />
                  </label>
                  <label>
                    <span>公开方式</span>
                    <select value={draft.privacy} onChange={(event) => updateDraft("privacy", event.target.value as MoodPrivacy)}>
                      <option value="private">私密</option>
                      <option value="summary">摘要公开</option>
                      <option value="anonymous">匿名公开</option>
                    </select>
                  </label>
                </div>
              </div>
            </details>

            <button className="primary-link" type="submit" disabled={busy}>
              <Plus size={18} />
              保存记录
            </button>
            {message ? <p className={message.includes("已") ? "form-message sent" : "form-message"}>{message}</p> : null}
          </form>
        ) : (
          <aside className="mood-entry-form mood-entry-form--stage mood-entry-form--guest">
            <div className="mood-entry-form__head">
              <p className="eyebrow">New Entry</p>
              <h2>记录新情绪</h2>
              <span>{supabaseReady ? "登录后可以保存自己的日期情绪、鼓励和趋势。" : "接入 Supabase Auth 后，这里会变成你的个人情绪记录入口。"}</span>
            </div>
            <div className="mood-guest-steps">
              <span>1. 选一个此刻的情绪</span>
              <span>2. 写下真正的压力核心</span>
              <span>3. 给压力苔一个可处理的小动作</span>
            </div>
            {supabaseReady ? (
              <div className="hero-actions">
                <a className="primary-link" href="/login">
                  登录
                </a>
                <a className="secondary-link" href="/register">
                  注册
                </a>
              </div>
            ) : null}
          </aside>
        )}
      </section>

      <section className="mood-secondary" aria-label="情绪小站次级功能">
        <div className="mood-encouragement-rail">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Inbox</p>
              <h2>收到的鼓励</h2>
            </div>
            <span>{bundle.encouragements.length} 条</span>
          </div>
          {bundle.encouragements.length > 0 ? (
            <div className="encouragement-list encouragement-list--rail">
              {bundle.encouragements.slice(0, 8).map((item) => (
                <article className="encouragement-card" key={item.id}>
                  <span>
                    <Send size={15} />
                    {item.action}
                  </span>
                  <p>{item.message}</p>
                  <small>{formatDateTime(item.createdAt)}</small>
                </article>
              ))}
            </div>
          ) : (
            <div className="mood-empty-state mood-empty-state--quiet">
              <Inbox size={20} />
              <p>还没有收到鼓励。公开一条摘要后，广场里的支持会安静地来到这里。</p>
            </div>
          )}
        </div>

        <section className="mood-timeline mood-timeline--light" aria-label="日期情绪时间线">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Timeline</p>
              <h2>按日期回看</h2>
            </div>
            <span>{bundle.entries.length} 条记录</span>
          </div>

          {bundle.dailyGroups.length > 0 ? (
            <div className="mood-day-groups">
              {bundle.dailyGroups.map((group) => (
                <article className="mood-day-group" key={group.date}>
                  <div className="mood-day-group__head">
                    <div>
                      <strong>{group.label}</strong>
                      <span>{group.entries.length} 次记录</span>
                    </div>
                    <div>
                      <span>{group.dominantMood}</span>
                      <small>平均 {group.averageIntensity}</small>
                    </div>
                  </div>
                  <div className="mood-entry-rows">
                    {group.entries.map((entry) => (
                      <div className="mood-entry-row" key={entry.id}>
                        <time>{formatTime(entry.recordedAt)}</time>
                        <div>
                          <strong>{entry.mood}</strong>
                          <p>{entry.coreReason}</p>
                          <small>{entry.nextAction}</small>
                          {entry.tags.length > 0 ? (
                            <div className="mood-entry-tags">
                              {entry.tags.map((tag) => (
                                <span key={tag}>{tag}</span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="mood-entry-row__meta">
                          <span>{entry.intensity}</span>
                          <small>{privacyLabel(entry.privacy)}</small>
                          <button type="button" onClick={() => deleteEntry(entry.id)} disabled={busy} aria-label="删除记录">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mood-empty-state mood-empty-state--wide mood-empty-state--quiet">
              <CalendarDays size={22} />
              <p>还没有情绪记录。先写一条很小的，时间线就会从今天开始长出来。</p>
            </div>
          )}
        </section>

        {recentEntries.length > 0 ? (
          <section className="mood-trend-line" aria-label="最近趋势">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Trend</p>
                <h2>最近趋势</h2>
              </div>
              <span>
                <HeartPulse size={16} />
                {averageIntensity}
              </span>
            </div>
            <div className="mood-trend-line__items">
              {recentEntries.map((entry) => (
                <article key={entry.id}>
                  <span>{formatDateTime(entry.recordedAt)}</span>
                  <strong>{entry.mood}</strong>
                  <div className="mood-intensity-meter">
                    <span style={{ width: `${entry.intensity}%` }} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </section>
  );
}
