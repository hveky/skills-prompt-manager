const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

const isDev = process.env.NODE_ENV === 'development'
let mainWindow = null
let tray = null
let isQuitting = false

const DATA_HOME = process.env.SKILLS_PROMPT_MANAGER_HOME || os.homedir()
const CLAUDE_SKILLS_DIR = path.join(DATA_HOME, '.claude', 'skills')
const SKILL_FILE = 'SKILL.md'
const DISABLED_SKILL_FILE = 'SKILL.disabled.md'
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

  win.on('close', event => {
    if (isQuitting) return
    event.preventDefault()
    win.hide()
  })

  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow = win
  return win
}

function getAppIconPath() {
  const iconPath = path.join(__dirname, '../build/app-icon.ico')
  if (fs.existsSync(iconPath)) return iconPath
  return path.join(__dirname, '../build/app-icon.png')
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow()
  }

  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function createTray() {
  if (tray) return tray

  tray = new Tray(getAppIconPath())
  tray.setToolTip('Skills Prompt Manager')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '打开', click: showMainWindow },
    { type: 'separator' },
    {
      label: '退出程序',
      click: () => {
        isQuitting = true
        app.quit()
      },
    },
  ]))
  tray.on('click', showMainWindow)
  return tray
}

app.whenReady().then(() => {
  ensureDir(CLAUDE_SKILLS_DIR)
  ensureDir(PROMPTS_DIR)
  createWindow()
  createTray()
  app.on('activate', () => {
    if (mainWindow && !mainWindow.isDestroyed()) showMainWindow()
    else createWindow()
  })
})

app.on('before-quit', () => {
  isQuitting = true
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
  let rel = String(filePath || '')
  if (rel === SKILL_FILE && !fs.existsSync(path.join(skill.dir, SKILL_FILE)) && fs.existsSync(path.join(skill.dir, DISABLED_SKILL_FILE))) {
    rel = DISABLED_SKILL_FILE
  }
  if (path.isAbsolute(rel)) throw new Error('Invalid file path')
  const full = path.resolve(skill.dir, rel)
  if (!isInside(skill.dir, full)) throw new Error('Invalid file path')
  return { ...skill, full }
}

function getSkillMarkerFile(dir) {
  if (fs.existsSync(path.join(dir, SKILL_FILE))) return SKILL_FILE
  if (fs.existsSync(path.join(dir, DISABLED_SKILL_FILE))) return DISABLED_SKILL_FILE
  return SKILL_FILE
}

function isSkillEnabled(dir) {
  return fs.existsSync(path.join(dir, SKILL_FILE))
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

    if (entries.some(e => e.isFile() && (e.name === SKILL_FILE || e.name === DISABLED_SKILL_FILE))) {
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
      const markerFile = getSkillMarkerFile(dir)
      const skillMd = path.join(dir, markerFile)
      const meta = fs.existsSync(skillMd)
        ? parseYamlMeta(fs.readFileSync(skillMd, 'utf-8'))
        : {}
      return {
        id: encodeSkillId(root.key, relDir),
        name: meta.name || path.basename(dir),
        description: meta.description || '',
        enabled: isSkillEnabled(dir),
        source: root.key,
        sourceLabel: root.label,
        relativePath: relDir,
      }
    }))
    .sort((a, b) => `${a.name} ${a.source} ${a.relativePath}`.localeCompare(`${b.name} ${b.source} ${b.relativePath}`))
})

ipcMain.handle('skills:read', (_, id) => {
  const { dir } = resolveSkillDir(id)
  const p = path.join(dir, getSkillMarkerFile(dir))
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : ''
})

ipcMain.handle('skills:write', (_, { id, content }) => {
  const { dir } = resolveSkillDir(id)
  ensureDir(dir)
  fs.writeFileSync(path.join(dir, getSkillMarkerFile(dir)), content, 'utf-8')
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
  const hasEnabledMain = fs.existsSync(path.join(base, SKILL_FILE))

  function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).map(e => {
      const full = path.join(dir, e.name)
      const rel = path.relative(base, full).replace(/\\/g, '/')
      const displayPath = !hasEnabledMain && rel === DISABLED_SKILL_FILE ? SKILL_FILE : rel
      const displayName = !hasEnabledMain && rel === DISABLED_SKILL_FILE ? SKILL_FILE : e.name
      return e.isDirectory()
        ? { name: e.name, type: 'dir', path: rel, children: walk(full) }
        : { name: displayName, type: 'file', path: displayPath }
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

ipcMain.handle('skills:set-enabled', (_, { id, enabled }) => {
  const { dir } = resolveSkillDir(id)
  const skillFile = path.join(dir, SKILL_FILE)
  const disabledFile = path.join(dir, DISABLED_SKILL_FILE)

  if (enabled) {
    if (fs.existsSync(skillFile)) return true
    if (!fs.existsSync(disabledFile)) throw new Error('未找到已关闭的 SKILL.disabled.md')
    fs.renameSync(disabledFile, skillFile)
    return true
  }

  if (fs.existsSync(disabledFile)) {
    if (fs.existsSync(skillFile)) throw new Error('SKILL.disabled.md 已存在，无法覆盖关闭')
    return true
  }
  if (!fs.existsSync(skillFile)) throw new Error('未找到可关闭的 SKILL.md')
  fs.renameSync(skillFile, disabledFile)
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
ipcMain.handle('window:quit', () => {
  isQuitting = true
  app.quit()
})
