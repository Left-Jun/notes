# limenauts / 阈限手记

这是 `notes.leftjun.com` 的动态随笔站。旧 Hugo 站 `C:\Users\MR\Desktop\LeftJun-Notes` 暂时保留为备份和内容来源。

## 技术栈

- Next.js App Router
- Supabase Postgres
- Supabase Storage
- 轻量后台写入接口
- v1 评论入口关闭，评论表保留给后续审核后台

## 本地运行

```powershell
npm install
npm run dev
```

如果没有 Supabase 环境变量，网站会自动使用 `lib/seed-notes.ts` 里的旧站种子内容，方便先调 UI。

开发模式下，后台发布会写入 `data/notes.local.json`，图片上传会写入 `public/uploads/`。这两个路径默认不进 Git，只用于本地演示。接入 Supabase 后，线上发布会改为写数据库和 Storage。

## Supabase 环境变量

复制 `.env.example` 为 `.env.local`，填入：

```text
NEXT_PUBLIC_SITE_URL=https://notes.leftjun.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_WRITE_TOKEN=
SUPABASE_STORAGE_BUCKET=note-images
```

`ADMIN_WRITE_TOKEN` 用于保护后台写入和图片上传接口。不要提交真实值。

本地开发未配置 Supabase 时可以不填发布口令；生产环境必须配置 Supabase 和写入口令。

## 数据库

在 Supabase SQL Editor 里执行：

```text
supabase/schema.sql
```

脚本会创建 `notes`、`comments` 表和 `note-images` 公开读取 bucket。`notes` 公开只读已发布内容；评论表第一版不开放游客写入。

## 导入旧 Hugo 内容

先配置 `.env.local`，然后运行：

```powershell
$env:HUGO_CONTENT_DIR="C:\Users\MR\Desktop\LeftJun-Notes\content"
npm run import:hugo
```

导入脚本会读取旧站 Markdown front matter，并写入 Supabase `notes` 表。默认写成 `published`，按 `slug` upsert，可重复运行。

当前导入范围只包含：

- `posts`
- `diary`
- `travel`
- `ideas`
- `events`

`_index.md`、`about.md` 和 `all/_index.md` 不会作为文章导入。没有 Supabase 密钥时可以先 dry run：

```powershell
$env:IMPORT_DRY_RUN="1"
npm run import:hugo
```
