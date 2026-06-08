import type { MoodPrivacy, Note } from "@/lib/types";

export type MoodMonster = {
  id: string;
  name: string;
  source: string;
  tone: string;
  hp: number;
  maxHp: number;
  supportCount: number;
  summary: string;
  encouragements: string[];
};

export type MoodEntry = {
  id: string;
  noteSlug?: string;
  title: string;
  date: string;
  mood: string;
  intensity: number;
  privacy: MoodPrivacy;
  summary: string;
  tags: string[];
  monsterId: string;
  supportCount: number;
};

export type MoodTrendPoint = {
  label: string;
  intensity: number;
  mood: string;
  title: string;
};

export type MoodDistributionItem = {
  label: string;
  count: number;
  percent: number;
};

export type MonsterStatusItem = {
  id: string;
  name: string;
  count: number;
  supportCount: number;
  averageIntensity: number;
  tone: string;
};

export const moodMonsters: MoodMonster[] = [
  {
    id: "pressure-bloom",
    name: "压力苔",
    source: "复习、DDL 和没有完全说出口的紧张",
    tone: "偏重但可处理",
    hp: 52,
    maxHp: 100,
    supportCount: 7,
    summary: "它不会一下子消失，但可以被拆成一件一件更小的事。",
    encouragements: ["先把最小的一步写下来。", "今天不用解决全部，只要让事情松动一点。", "有人看见这份压力，也愿意陪你一起削弱它。"]
  },
  {
    id: "late-night-cloud",
    name: "夜晚云团",
    source: "睡前反复回放的小念头",
    tone: "轻微低落",
    hp: 36,
    maxHp: 80,
    supportCount: 4,
    summary: "适合用很轻的方式安放：一句记录、一杯水、一个提前结束的页面。",
    encouragements: ["今晚先到这里。", "不用把所有感受都解释清楚。", "把明天的第一件小事留出来就好。"]
  },
  {
    id: "delay-spark",
    name: "拖延火花",
    source: "想做很多，但启动很慢",
    tone: "焦躁但有能量",
    hp: 44,
    maxHp: 90,
    supportCount: 5,
    summary: "它怕的不是宏大计划，而是一个已经开始计时的十分钟。",
    encouragements: ["先做十分钟。", "完成一个粗糙版本也算赢。", "你不需要等状态完美才开始。"]
  }
];

export const moodEntries: MoodEntry[] = [
  {
    id: "mood-finals-week",
    title: "期末周的脑内噪音",
    date: "2026-06-05T20:34:00+08:00",
    mood: "焦虑",
    intensity: 76,
    privacy: "anonymous",
    summary: "事情很多，感觉每个任务都在同时敲门。想先把最大的一团压力拆开。",
    tags: ["期末", "大作业", "复习"],
    monsterId: "pressure-bloom",
    supportCount: 7
  },
  {
    id: "mood-quiet-walk",
    title: "晚饭后绕远了一点",
    date: "2026-06-03T21:10:00+08:00",
    mood: "平静",
    intensity: 42,
    privacy: "summary",
    summary: "路上风不大，脑子慢慢安静下来。今天适合只留一小段记录。",
    tags: ["散步", "生活"],
    monsterId: "late-night-cloud",
    supportCount: 4
  },
  {
    id: "mood-project-start",
    title: "想做 MoodQuest 的第一晚",
    date: "2026-06-01T23:18:00+08:00",
    mood: "兴奋",
    intensity: 68,
    privacy: "private",
    summary: "心情日记、小游戏和匿名互助能连成一个闭环，但要先让最小版本跑起来。",
    tags: ["灵感", "Qt", "MoodQuest"],
    monsterId: "delay-spark",
    supportCount: 0
  }
];

export const moodOverview = [
  {
    label: "本周记录",
    value: "3",
    note: "先用少量记录观察状态，不追求打卡压力。"
  },
  {
    label: "收到支持",
    value: "11",
    note: "匿名广场里的轻互动，用来回应坏心情怪兽。"
  },
  {
    label: "修复进行中",
    value: "2",
    note: "把复杂情绪拆成可处理的小动作。"
  }
];

export const moodRoadmap = [
  {
    title: "个人心情日记",
    status: "原型可见",
    body: "从随笔和日记里延伸，记录心情、强度、标签和一句短说明。"
  },
  {
    title: "匿名心情广场",
    status: "原型可见",
    body: "只公开用户主动选择的摘要，不默认公开完整日记。"
  },
  {
    title: "坏心情怪兽",
    status: "原型可见",
    body: "把压力、低落、拖延转换成轻量互动对象，降低直接表达的负担。"
  },
  {
    title: "AI 情绪建议",
    status: "预留接口",
    body: "未来可接图片识别，但只作为建议，不影响核心记录和互助流程。"
  }
];

export function getMoodMonster(id: string) {
  return moodMonsters.find((monster) => monster.id === id);
}

export function getMoodEntry(id: string) {
  return moodEntries.find((entry) => entry.id === id);
}

function normalizePrivacy(value: Note["moodPrivacy"]): MoodPrivacy {
  return value === "anonymous" || value === "summary" || value === "private" ? value : "private";
}

function clampIntensity(value: Note["moodIntensity"], fallbackMood: string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  if (/焦虑|压力|紧张|烦|累|疲|低落|难过/.test(fallbackMood)) return 70;
  if (/开心|兴奋|期待|冒泡/.test(fallbackMood)) return 62;
  return 48;
}

function inferMonsterId(note: Note) {
  if (note.monsterId && getMoodMonster(note.monsterId)) return note.monsterId;

  const text = `${note.title} ${note.summary} ${note.mood || ""} ${note.tags.join(" ")}`;
  if (/焦虑|压力|紧张|期末|复习|DDL|ddl/.test(text)) return "pressure-bloom";
  if (/低落|平静|夜|睡|累|疲/.test(text)) return "late-night-cloud";
  return "delay-spark";
}

export function buildMoodEntriesFromNotes(notes: Note[]) {
  return notes
    .filter((note) => Boolean(note.mood))
    .map<MoodEntry>((note) => ({
      id: note.id,
      noteSlug: note.slug,
      title: note.title,
      date: note.publishedAt,
      mood: note.mood || "记录中",
      intensity: clampIntensity(note.moodIntensity, note.mood || ""),
      privacy: normalizePrivacy(note.moodPrivacy),
      summary: note.summary,
      tags: note.tags,
      monsterId: inferMonsterId(note),
      supportCount: note.supportCount || 0
    }));
}

export function getMoodEntries(notes?: Note[]) {
  const fromNotes = notes ? buildMoodEntriesFromNotes(notes) : [];
  return fromNotes.length > 0 ? fromNotes : moodEntries;
}

export function getPublicMoodEntries(notes?: Note[]) {
  const publicEntries = getMoodEntries(notes).filter((entry) => entry.privacy !== "private");
  return publicEntries.length > 0 ? publicEntries : moodEntries.filter((entry) => entry.privacy !== "private");
}

export function buildMoodOverview(entries: MoodEntry[]) {
  const repairingCount = entries.filter((entry) => getMoodMonster(entry.monsterId)?.hp).length;
  const supportCount = entries.reduce((total, entry) => total + entry.supportCount, 0);

  return [
    {
      label: "本周记录",
      value: String(entries.length),
      note: "先用少量记录观察状态，不追求打卡压力。"
    },
    {
      label: "收到支持",
      value: String(supportCount),
      note: "匿名广场里的轻互动，用来回应坏心情怪兽。"
    },
    {
      label: "修复进行中",
      value: String(repairingCount),
      note: "把复杂情绪拆成可处理的小动作。"
    }
  ];
}

export function buildMoodTrend(entries: MoodEntry[], limit = 8): MoodTrendPoint[] {
  return [...entries]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-limit)
    .map((entry) => ({
      label: new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(new Date(entry.date)),
      intensity: entry.intensity,
      mood: entry.mood,
      title: entry.title
    }));
}

export function buildMoodDistribution(entries: MoodEntry[]): MoodDistributionItem[] {
  const total = Math.max(entries.length, 1);
  const counts = entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({
      label,
      count,
      percent: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "zh-CN"));
}

export function buildMonsterStatus(entries: MoodEntry[]): MonsterStatusItem[] {
  const groups = entries.reduce<Record<string, MoodEntry[]>>((acc, entry) => {
    acc[entry.monsterId] = [...(acc[entry.monsterId] || []), entry];
    return acc;
  }, {});

  return Object.entries(groups)
    .map(([id, group]) => {
      const monster = getMoodMonster(id);
      const supportCount = group.reduce((total, entry) => total + entry.supportCount, 0);
      const averageIntensity = Math.round(group.reduce((total, entry) => total + entry.intensity, 0) / Math.max(group.length, 1));

      return {
        id,
        name: monster?.name || id,
        count: group.length,
        supportCount,
        averageIntensity,
        tone: monster?.tone || "记录中"
      };
    })
    .sort((a, b) => b.count - a.count || b.supportCount - a.supportCount);
}

export function buildMoodInsight(entries: MoodEntry[]) {
  if (entries.length === 0) {
    return {
      title: "还没有足够的心情记录",
      body: "先写几条带心情的日记，再让这里慢慢长出趋势。"
    };
  }

  const average = Math.round(entries.reduce((total, entry) => total + entry.intensity, 0) / entries.length);
  const topMood = buildMoodDistribution(entries)[0];
  const mostSupported = [...entries].sort((a, b) => b.supportCount - a.supportCount)[0];

  if (average >= 70) {
    return {
      title: "最近的情绪强度偏高",
      body: `最常出现的是“${topMood.label}”。可以先把记录拆小，给高强度状态留一点缓冲。`
    };
  }

  if (mostSupported?.supportCount > 0) {
    return {
      title: "互助已经开始产生回声",
      body: `“${mostSupported.title}”收到了 ${mostSupported.supportCount} 次支持，这条线可以继续观察。`
    };
  }

  return {
    title: "状态还在缓慢成形",
    body: `平均强度是 ${average}。现在更适合继续记录，而不是急着给自己下结论。`
  };
}
