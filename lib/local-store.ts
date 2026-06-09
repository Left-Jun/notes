import fs from "node:fs/promises";
import path from "node:path";
import type { MoodEncouragement, MoodEntryRecord, MoodSupportAction, Note, NoteComment } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const trackedNotesPath = path.join(dataDir, "notes.json");
const legacyLocalNotesPath = path.join(dataDir, "notes.local.json");
const commentsPath = path.join(dataDir, "comments.local.json");
const moodSupportsPath = path.join(dataDir, "mood-supports.local.json");
const moodEntriesPath = path.join(dataDir, "mood-entries.local.json");
const moodEncouragementsPath = path.join(dataDir, "mood-encouragements.local.json");

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(filePath: string, data: T) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function getLocalNotes() {
  const [trackedNotes, legacyLocalNotes] = await Promise.all([
    readJson<Note[]>(trackedNotesPath, []),
    readJson<Note[]>(legacyLocalNotesPath, [])
  ]);
  const seen = new Set<string>();

  return [...trackedNotes, ...legacyLocalNotes].filter((note) => {
    if (seen.has(note.slug)) return false;
    seen.add(note.slug);
    return true;
  });
}

export async function getLocalComments() {
  return readJson<NoteComment[]>(commentsPath, []);
}

export async function getLocalMoodSupports() {
  return readJson<MoodSupportAction[]>(moodSupportsPath, []);
}

export async function getLocalMoodEntryRecords() {
  return readJson<MoodEntryRecord[]>(moodEntriesPath, []);
}

export async function getLocalMoodEncouragements() {
  return readJson<MoodEncouragement[]>(moodEncouragementsPath, []);
}

export async function upsertLocalNote(note: Note, previousSlug = note.slug) {
  const notes = await readJson<Note[]>(trackedNotesPath, []);
  const existing = notes.find((item) => item.slug === previousSlug) || notes.find((item) => item.slug === note.slug);
  const nextNote = existing
    ? {
        ...note,
        id: existing.id || note.id,
        createdAt: existing.createdAt || note.createdAt
      }
    : note;
  const nextNotes = [nextNote, ...notes.filter((item) => item.slug !== note.slug && item.slug !== previousSlug)].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  await writeJson(trackedNotesPath, nextNotes);
  return nextNote;
}

export async function insertLocalComment(comment: NoteComment) {
  const comments = await getLocalComments();
  await writeJson(commentsPath, [...comments, comment]);
  return comment;
}

export async function insertLocalMoodSupport(action: MoodSupportAction) {
  const actions = await getLocalMoodSupports();
  await writeJson(moodSupportsPath, [...actions, action]);
  return action;
}

export async function upsertLocalMoodEntryRecord(entry: MoodEntryRecord) {
  const entries = await getLocalMoodEntryRecords();
  const nextEntries = [entry, ...entries.filter((item) => item.id !== entry.id)].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );

  await writeJson(moodEntriesPath, nextEntries);
  return entry;
}

export async function deleteLocalMoodEntryRecord(profileId: string, id: string) {
  const entries = await getLocalMoodEntryRecords();
  const target = entries.find((entry) => entry.id === id && entry.profileId === profileId);
  if (!target) return false;

  await writeJson(
    moodEntriesPath,
    entries.filter((entry) => entry.id !== id)
  );
  return true;
}

export async function insertLocalMoodEncouragement(encouragement: MoodEncouragement) {
  const encouragements = await getLocalMoodEncouragements();
  await writeJson(moodEncouragementsPath, [encouragement, ...encouragements]);
  return encouragement;
}

export async function incrementLocalMoodEntrySupport(id: string) {
  const entries = await getLocalMoodEntryRecords();
  const index = entries.findIndex((entry) => entry.id === id);

  if (index < 0) return null;

  const current = entries[index];
  const supportCount = (current.supportCount || 0) + 1;
  const nextEntries = entries.toSpliced(index, 1, {
    ...current,
    supportCount,
    updatedAt: new Date().toISOString()
  });

  await writeJson(moodEntriesPath, nextEntries);
  return supportCount;
}

export async function incrementLocalNoteSupport(noteId?: string | null, noteSlug?: string | null) {
  if (!noteId && !noteSlug) return null;

  const notes = await getLocalNotes();
  const index = notes.findIndex((item) => item.id === noteId || item.slug === noteSlug);

  if (index < 0) {
    return null;
  }

  const current = notes[index];
  const nextCount = (current.supportCount || 0) + 1;
  const nextNotes = notes.toSpliced(index, 1, {
    ...current,
    supportCount: nextCount,
    updatedAt: new Date().toISOString()
  });

  await writeJson(trackedNotesPath, nextNotes);
  return nextCount;
}

export function canUseLocalWrite() {
  return process.env.NODE_ENV !== "production";
}
