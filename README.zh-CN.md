# Skills Prompt Manager

[English](README.md)

![Skills Prompt Manager 主图](docs/images/hero.png)

Skills Prompt Manager 是一个用于管理 AI Skills 和可复用 Prompts 的桌面应用。它为 skill 作者提供一个干净的本地工作台：浏览 bundled files、编辑 `SKILL.md`、预览 Markdown 指令、查看代码资源，并一键复制不含 frontmatter 的 prompt 正文。

## 亮点

- **多来源 Skills 索引**：扫描 `~/.claude/skills`、`~/.codex/skills`、`~/.agents/skills`。
- **来源感知浏览**：同名 skill 会通过 Claude、Codex、Agents 标识区分。
- **文件树编辑**：在同一个界面中打开并编辑 `SKILL.md`、references、scripts、JSON、CSS 等文本资源。
- **清晰预览**：Markdown 文件分离展示 frontmatter 和正文；代码文件使用语法高亮预览。
- **Prompt 剪切板流程**：一键复制 prompt 正文，自动排除 YAML frontmatter。
- **本地优先**：通过 Electron IPC 直接读写本地文件，不把个人内容纳入仓库。

## 截图

![Skills 浏览器](docs/images/skills-browser.png)

![代码预览](docs/images/code-preview.png)

![Prompt 复制流程](docs/images/prompt-copy.png)

## 支持的内容

Skills 通过递归查找以下目录中的 `SKILL.md` 发现：

- `~/.claude/skills`
- `~/.codex/skills`
- `~/.agents/skills`

Prompts 以 Markdown 文件形式存放在：

- `~/.claude/prompts`

Markdown 文件会以结构化文档方式展示，并单独显示 frontmatter 信息区。常见源码文件如 `.py`、`.json`、`.js`、`.jsx`、`.ts`、`.tsx`、`.css`、`.html`、`.yaml`、`.toml`、`.sh`、`.ps1` 会进入代码预览。

## 安装

从最新 GitHub Release 下载 Windows 安装包。

首版 Windows 构建未进行代码签名。在项目配置代码签名证书前，Windows 可能显示 SmartScreen 提示。

## 开发

```bash
npm install
npm run dev
```

构建前端：

```bash
npm run build
```

构建桌面安装包：

```bash
npm run dist
```

## 技术栈

- Electron
- React
- Vite
- React Markdown
- React Syntax Highlighter
- Lucide icons
