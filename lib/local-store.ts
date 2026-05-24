import fs from "node:fs/promises";
import path from "node:path";
import type { Note, NoteComment } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const notesPath = path.join(dataDir, "notes.local.json");
const commentsPath = path.join(dataDir, "comments.local.json");

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
  return readJson<Note[]>(notesPath, []);
}

export async function getLocalComments() {
  return readJson<NoteComment[]>(commentsPath, []);
}

export async function upsertLocalNote(note: Note) {
  const notes = await getLocalNotes();
  const index = notes.findIndex((item) => item.slug === note.slug);
  const nextNotes = index >= 0 ? notes.toSpliced(index, 1, note) : [note, ...notes];
  await writeJson(notesPath, nextNotes);
  return note;
}

export async function insertLocalComment(comment: NoteComment) {
  const comments = await getLocalComments();
  await writeJson(commentsPath, [...comments, comment]);
  return comment;
}

export function canUseLocalWrite() {
  return process.env.NODE_ENV !== "production";
}
