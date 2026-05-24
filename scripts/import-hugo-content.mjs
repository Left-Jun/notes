import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import matter from "gray-matter";
import { createClient } from "@supabase/supabase-js";

const contentDir = process.env.HUGO_CONTENT_DIR || "C:/Users/MR/Desktop/LeftJun-Notes/content";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.env.IMPORT_DRY_RUN === "1";
const includedSections = new Set(["posts", "diary", "travel", "ideas", "events"]);

if ((!supabaseUrl || !serviceRoleKey) && !dryRun) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. Set IMPORT_DRY_RUN=1 to preview without writing.");
}

const supabase = dryRun
  ? null
  : createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("_")) {
      files.push(fullPath);
    }
  }

  return files;
}

function toSlug(file, frontMatter) {
  if (frontMatter.slug) return String(frontMatter.slug).trim();
  return path
    .basename(file, ".md")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTags(value) {
  if (Array.isArray(value)) return value.map(String);
  if (!value) return [];
  return [String(value)];
}

function toSummary(frontMatter, content) {
  const summary = String(frontMatter.summary || frontMatter.description || "").trim();
  if (summary) return summary;

  return content
    .replace(/[#>*_`-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

const files = await walk(contentDir);
let imported = 0;
let skipped = 0;

for (const file of files) {
  const relative = path.relative(contentDir, file).replaceAll("\\", "/");
  const section = relative.split("/")[0];

  if (!includedSections.has(section)) {
    skipped += 1;
    console.log(`Skipped: ${relative}`);
    continue;
  }

  const raw = await fs.readFile(file, "utf8");
  const parsed = matter(raw);
  const data = parsed.data;
  const content = parsed.content.trim();
  const row = {
    slug: toSlug(file, data),
    title: String(data.title || path.basename(file, ".md")),
    summary: toSummary(data, content),
    content_md: content,
    section,
    tags: toTags(data.tags),
    mood: data.mood || null,
    location: data.location || null,
    status: "published",
    published_at: data.date ? new Date(data.date).toISOString() : new Date().toISOString()
  };

  if (dryRun) {
    imported += 1;
    console.log(`Dry run: ${relative} -> ${row.slug}`);
    continue;
  }

  const { error } = await supabase.from("notes").upsert(row, { onConflict: "slug" });

  if (error) {
    console.error(`Failed: ${relative}`, error.message);
  } else {
    imported += 1;
    console.log(`Imported: ${relative}`);
  }
}

console.log(`${dryRun ? "Previewed" : "Imported"} ${imported} note(s), skipped ${skipped} file(s).`);
