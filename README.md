# limenauts / 阈限手记

这是 `notes.leftjun.com` 的动态随笔站。旧 Hugo 站 `C:\Users\MR\Desktop\LeftJun-Notes` 暂时保留为备份和内容来源。

## 技术栈

- Next.js App Router
- Supabase Postgres
- Supabase Storage
- Supabase Auth 个人资料
- PWA 安装壳（Android/iOS 初版）
- 轻量后台写入接口
- v1 评论入口关闭，评论表保留给后续审核后台

## 本地运行

```powershell
npm install
npm run dev
```

如果没有 Supabase 环境变量，网站会自动读取 `data/notes.json` 和 `lib/seed-notes.ts` 里的旧站种子内容，方便先调 UI。

开发模式下，打开 `http://localhost:1315/admin` 可以使用图形化内容编辑器。未配置 Supabase 时，保存文章会写入可提交的 `data/notes.json`；图片上传会写入本地预览目录 `public/uploads/`，该目录默认不进 Git。匿名心情支持仍写入 `data/mood-supports.local.json`，这个演示用 `.local.json` 默认不进 Git。

常用本地写作流程：

```powershell
npm run dev
# 打开 http://localhost:1315/admin 编辑内容
git add data/notes.json
git commit -m "Update notes content"
git push
```

接入 Supabase 后，线上发布会改为写数据库和 Storage。

`/login`、`/register` 和 `/me` 使用 Supabase Auth。登录用户可以编辑昵称、头像、状态、一句话介绍和社交链接；左侧栏、右上角头像和文章作者信息会读取同一套 profile 数据。

## 移动端 App 初版

当前先以 PWA 方式做 Android/iOS 初版，不新增原生工程：

- `public/manifest.webmanifest` 使用现有真实品牌图片。
- `public/sw.js` 缓存站点外壳、品牌图和头像，用于基础离线回退。
- `components/pwa-client.tsx` 注册 Service Worker，并在浏览器支持时显示安装入口。
- `app/layout.tsx` 已加入 manifest、apple web app 和移动端 viewport 元信息。

后续如果要上应用商店，可以在这个基础上接 Capacitor，把同一套 Next.js 站点封装成 Android/iOS 原生壳。

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

脚本会创建 `profiles`、`notes`、`comments`、`mood_supports` 表，以及 `note-images`、`profile-avatars` 公开读取 bucket。`profiles` 公开可读，用户只能更新自己的资料；`notes` 公开只读已发布内容；评论表第一版不开放游客写入。

当前 `notes` 表也预留了作者和心情记录字段：

- `author_profile_id`
- `mood`
- `mood_intensity`
- `mood_privacy`
- `monster_id`
- `support_count`

这些字段用于 `/mood` 心情小径、`/square` 匿名心情广场、`/monster/[id]` 坏心情怪兽原型和 `/stats` 状态回顾。已有旧表时可以重新执行 `supabase/schema.sql`，脚本会用 `alter table ... add column if not exists` 补齐字段。

匿名支持动作写入 `mood_supports` 表，并通过 `increment_note_support()` 递增对应心情记录的 `support_count`。这个动作由 `/api/mood/support` 服务端接口完成，不直接开放前端匿名写数据库。

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
