# 阈限手记 | Limenaut Notes

这是 Left-Jun 的生活记录型 Hugo 小站，和作品集站分开维护。

## 内容目录

- `content/posts/`：随笔和长一点的观察
- `content/diary/`：日记、短记、近况
- `content/travel/`：旅行和城市记录
- `content/ideas/`：小巧思、灵感、待办点子
- `content/events/`：活动、比赛、展览、聚会经历

## 常用命令

```powershell
.\scripts\serve.ps1
```

```powershell
.\scripts\build.ps1
```

如果你的系统已经安装了 Hugo，也可以直接运行：

```powershell
hugo server --disableFastRender
hugo --gc --minify
```

## Vercel

Vercel 构建会运行 `scripts/vercel-build.sh`，先下载指定版本的 Hugo，再生成 `public/`。

默认 Hugo 版本是 `0.155.2`。需要调整时，可以在 Vercel 项目环境变量里设置：

```text
HUGO_VERSION=0.155.2
```
