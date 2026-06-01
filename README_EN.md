<div align="center">

# 🗂️ Skills Prompt Manager

### One workspace for all your AI skills and reusable prompts

**Stop hunting through `~/.claude`, `~/.codex`, and `~/.agents` folders.**
Browse, edit, preview, and copy — local-first, what-you-see-is-what-you-get.

English · [中文](README.md)

[![Platform](https://img.shields.io/badge/platform-Windows-0078D6?logo=windows)](#-install)
[![Built with Electron](https://img.shields.io/badge/built%20with-Electron-47848F?logo=electron&logoColor=white)](#-tech-stack)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=white)](#-tech-stack)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

![Main interface](docs/images/skipro.png)
<sub>👆 Replace with a full main-window screenshot (skill index tree on the left + preview panel on the right) — it explains the product at a glance.</sub>

</div>

---

## Why this exists

When you author skills across **Claude, Codex, and Agents**, your files scatter across three trees: `~/.claude/skills`, `~/.codex/skills`, `~/.agents/skills`. Duplicate skill names blur together, editing a single `SKILL.md` means bouncing between a file explorer and an editor, and copying a prompt forces you to strip the YAML frontmatter by hand.

**Skills Prompt Manager pulls all of it into one clean desktop workspace** — built for skill authors and prompt engineers who'd rather work on content than chase files.

## ✨ Features

- 🔍 **Multi-source index** — auto-scans `~/.claude/skills`, `~/.codex/skills`, and `~/.agents/skills` into a single view.
- 🏷️ **Source-aware browsing** — duplicate skill names stay distinct with Claude / Codex / Agents badges, so you never edit the wrong platform.
- 📝 **In-tree editing** — open and edit `SKILL.md`, references, scripts, JSON, CSS, and other text assets from one place.
- 👁️ **Readable previews** — Markdown splits frontmatter and body into separate panels; code files render with syntax highlighting.
- 📋 **Clean prompt copy** — copy the prompt body in one click, YAML frontmatter automatically excluded.
- 💻 **Local-first** — reads and writes local files directly via Electron IPC. No uploads, no network, your data stays on your machine.

## 📸 Screenshots

| View | Image |
| --- | --- |
| Skills management | `docs/images/skipro.png` |
| Prompt editing | `docs/images/skipro2.png` |
| Skills browser | `docs/images/skills-browser.png` |
| Code preview | `docs/images/code-preview.png` |
| Prompt copy flow | `docs/images/prompt-copy.png` |

> 💡 Promotion tip: record a 10–15s GIF (open skill → edit → preview → copy prompt) for the hero section — it converts far better than static images.

## 🚀 Install

Download the Windows installer from the latest [GitHub Release](../../releases) and run it.

> ⚠️ The first Windows build is unsigned, so SmartScreen may warn you — click **More info → Run anyway**. The warning disappears once code signing is in place.

## 🧩 Supported content

**Skills** are discovered by recursively finding `SKILL.md` under:

- `~/.claude/skills`
- `~/.codex/skills`
- `~/.agents/skills`

**Prompts** are read from Markdown files under `~/.claude/prompts`.

Markdown renders as a structured document with a dedicated frontmatter panel. Common source files — `.py`, `.json`, `.js`, `.jsx`, `.ts`, `.tsx`, `.css`, `.html`, `.yaml`, `.toml`, and more — display with syntax highlighting.

## 🛠️ Development

```bash
npm install      # install dependencies
npm run dev      # local development
npm run build    # build the renderer
npm run dist     # build the desktop installer
```

## 🧱 Tech stack

`Electron` · `React` · `Vite` · `React Markdown` · `React Syntax Highlighter` · `Lucide icons`

## 🗺️ Roadmap

- [ ] macOS / Linux builds
- [ ] Code signing to remove the SmartScreen warning
- [ ] Full-text skill search
- [ ] Dark theme

## 🤝 Contributing

Issues and PRs welcome. If this saves you time, a ⭐ is the best thanks.

## 📄 License

[MIT](LICENSE)
