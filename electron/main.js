const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

const isDev = process.env.NODE_ENV === 'development'

const DATA_HOME = process.env.SKILLS_PROMPT_MANAGER_HOME || os.homedir()
const CLAUDE_SKILLS_DIR = path.join(DATA_HOME, '.claude', 'skills')
const SKILL_ROOTS = [
  { key: 'claude', label: 'Claude Code', dir: CLAUDE_SKILLS_DIR },
  { key: 'codex', label: 'Codex', dir: path.join(DATA_HOME, '.codex', 'skills') },
  { key: 'agents', label: 'Agents', dir: path.join(DATA_HOME, '.agents', 'skills') },
]
const PROMPTS_DIR = path.join(DATA_HOME, '.claude', 'prompts')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 820,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  ensureDir(CLAUDE_SKILLS_DIR)
  ensureDir(PROMPTS_DIR)
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── Skills ────────────────────────────────────────────────────────────────────

function parseYamlMeta(content) {
  const meta = { name: '', description: '' }
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return meta
  m[1].split('\n').forEach(line => {
    const kv = line.match(/^([^:]+):\s*(.*)$/)
    if (kv) meta[kv[1].trim()] = kv[2].trim()
  })
  return meta
}

function toPosixPath(p) {
  return p.replace(/\\/g, '/')
}

function isInside(base, target) {
  const rel = path.relative(base, target)
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
}

function encodeSkillId(rootKey, relDir) {
  return `${rootKey}:${toPosixPath(relDir)}`
}

function decodeSkillId(id) {
  const raw = String(id || '')
  const sep = raw.indexOf(':')
  if (sep === -1) return { rootKey: 'claude', relDir: raw }
  return { rootKey: raw.slice(0, sep), relDir: raw.slice(sep + 1) }
}

function resolveSkillDir(id) {
  const { rootKey, relDir } = decodeSkillId(id)
  const root = SKILL_ROOTS.find(r => r.key === rootKey)
  if (!root) throw new Error(`Unknown skill source: ${rootKey}`)
  if (path.isAbsolute(relDir)) throw new Error('Invalid skill path')
  const full = path.resolve(root.dir, relDir || '.')
  if (!isInside(root.dir, full)) throw new Error('Invalid skill path')
  return { root, dir: full, relDir: toPosixPath(path.relative(root.dir, full)) || path.basename(full) }
}

function resolveSkillFile(id, filePath) {
  const skill = resolveSkillDir(id)
  const rel = String(filePath || '')
  if (path.isAbsolute(rel)) throw new Error('Invalid file path')
  const full = path.resolve(skill.dir, rel)
  if (!isInside(skill.dir, full)) throw new Error('Invalid file path')
  return { ...skill, full }
}

function findSkillDirs(root) {
  if (!fs.existsSync(root.dir)) return []
  const found = []

  function walk(dir) {
    let entries = []
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }

    if (entries.some(e => e.isFile() && e.name === 'SKILL.md')) {
      found.push(dir)
    }

    entries
      .filter(e => e.isDirectory())
      .forEach(e => walk(path.join(dir, e.name)))
  }

  walk(root.dir)
  return found
}

ipcMain.handle('skills:list', () => {
  ensureDir(CLAUDE_SKILLS_DIR)
  return SKILL_ROOTS.flatMap(root => findSkillDirs(root)
    .map(dir => {
      const relDir = toPosixPath(path.relative(root.dir, dir))
      const skillMd = path.join(dir, 'SKILL.md')
      const meta = fs.existsSync(skillMd)
        ? parseYamlMeta(fs.readFileSync(skillMd, 'utf-8'))
        : {}
      return {
        id: encodeSkillId(root.key, relDir),
        name: meta.name || path.basename(dir),
        description: meta.description || '',
        source: root.key,
        sourceLabel: root.label,
        relativePath: relDir,
      }
    }))
    .sort((a, b) => `${a.name} ${a.source} ${a.relativePath}`.localeCompare(`${b.name} ${b.source} ${b.relativePath}`))
})

ipcMain.handle('skills:read', (_, id) => {
  const { dir } = resolveSkillDir(id)
  const p = path.join(dir, 'SKILL.md')
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : ''
})

ipcMain.handle('skills:write', (_, { id, content }) => {
  const { dir } = resolveSkillDir(id)
  ensureDir(dir)
  fs.writeFileSync(path.join(dir, 'SKILL.md'), content, 'utf-8')
  return true
})

ipcMain.handle('skills:delete', (_, id) => {
  const { dir } = resolveSkillDir(id)
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
  return true
})

ipcMain.handle('skills:list-files', (_, id) => {
  const { dir: base } = resolveSkillDir(id)
  if (!fs.existsSync(base)) return []

  function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).map(e => {
      const full = path.join(dir, e.name)
      const rel = path.relative(base, full).replace(/\\/g, '/')
      return e.isDirectory()
        ? { name: e.name, type: 'dir', path: rel, children: walk(full) }
        : { name: e.name, type: 'file', path: rel }
    })
  }
  return walk(base)
})

ipcMain.handle('skills:read-file', (_, { id, filePath }) => {
  const { full } = resolveSkillFile(id, filePath)
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf-8') : ''
})

ipcMain.handle('skills:write-file', (_, { id, filePath, content }) => {
  const { full } = resolveSkillFile(id, filePath)
  ensureDir(path.dirname(full))
  fs.writeFileSync(full, content, 'utf-8')
  return true
})

// ── Prompts ───────────────────────────────────────────────────────────────────

ipcMain.handle('prompts:list', () => {
  ensureDir(PROMPTS_DIR)
  return fs.readdirSync(PROMPTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const content = fs.readFileSync(path.join(PROMPTS_DIR, f), 'utf-8')
      const meta = parseYamlMeta(content)
      const id = f.slice(0, -3)
      return { id, name: meta.name || id, description: meta.description || '', tags: meta.tags || '' }
    })
})

ipcMain.handle('prompts:read', (_, id) => {
  const p = path.join(PROMPTS_DIR, `${id}.md`)
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : ''
})

ipcMain.handle('prompts:write', (_, { id, content }) => {
  ensureDir(PROMPTS_DIR)
  fs.writeFileSync(path.join(PROMPTS_DIR, `${id}.md`), content, 'utf-8')
  return true
})

ipcMain.handle('prompts:delete', (_, id) => {
  const p = path.join(PROMPTS_DIR, `${id}.md`)
  if (fs.existsSync(p)) fs.unlinkSync(p)
  return true
})

ipcMain.handle('prompts:rename', (_, { oldId, newId, content }) => {
  const oldPath = path.join(PROMPTS_DIR, `${oldId}.md`)
  const newPath = path.join(PROMPTS_DIR, `${newId}.md`)
  if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
  fs.writeFileSync(newPath, content, 'utf-8')
  return true
})

// ── Window controls ───────────────────────────────────────────────────────────

ipcMain.handle('window:minimize', e => BrowserWindow.fromWebContents(e.sender).minimize())
ipcMain.handle('window:maximize', e => {
  const win = BrowserWindow.fromWebContents(e.sender)
  win.isMaximized() ? win.unmaximize() : win.maximize()
})
ipcMain.handle('window:close', e => BrowserWindow.fromWebContents(e.sender).close())
