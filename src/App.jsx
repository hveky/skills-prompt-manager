import { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from './components/Sidebar'
import DetailPanel from './components/DetailPanel'
import NewItemModal from './components/NewItemModal'
import './App.css'

function toId(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function App() {
  const [tab, setTab] = useState('skills')
  const [items, setItems] = useState({ skills: [], prompts: [] })
  const [selected, setSelected] = useState(null) // { type, id }
  const [skillFiles, setSkillFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [content, setContent] = useState('')
  const [mode, setMode] = useState('preview')
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null) // null | { type: 'skill' | 'prompt' }
  const dirtyRef = useRef(false)
  const saveRef = useRef(null)

  const loadAll = useCallback(async () => {
    const [skills, prompts] = await Promise.all([
      window.api.skills.list(),
      window.api.prompts.list(),
    ])
    setItems({ skills, prompts })
  }, [])

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => { dirtyRef.current = dirty }, [dirty])

  const confirmDiscard = () =>
    !dirtyRef.current || confirm('有未保存的修改，是否丢弃？')

  const selectItem = useCallback(async (type, itemOrId) => {
    const item = typeof itemOrId === 'string' ? { id: itemOrId } : itemOrId
    const id = item.id
    if (!confirmDiscard()) return
    setLoading(true)
    setSelected({ type, ...item })
    setSelectedFile(type === 'skills' ? 'SKILL.md' : null)
    setSkillFiles([])
    setDirty(false)
    try {
      const c = type === 'skills'
        ? await window.api.skills.readFile(id, 'SKILL.md')
        : await window.api.prompts.read(id)
      if (type === 'skills') {
        const files = await window.api.skills.listFiles(id)
        setSkillFiles(files)
      }
      setContent(c || '')
      setMode('preview')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleTabChange = useCallback((t) => {
    if (!confirmDiscard()) return
    setTab(t)
    setSelected(null)
    setSelectedFile(null)
    setSkillFiles([])
    setContent('')
    setDirty(false)
    setMode('preview')
  }, [])

  const selectSkillFile = useCallback(async (filePath) => {
    if (!selected || selected.type !== 'skills') return
    if (filePath === selectedFile) return
    if (!confirmDiscard()) return
    setLoading(true)
    setSelectedFile(filePath)
    setDirty(false)
    try {
      const c = await window.api.skills.readFile(selected.id, filePath)
      setContent(c || '')
      setMode('preview')
    } finally {
      setLoading(false)
    }
  }, [selected, selectedFile])

  const save = useCallback(async () => {
    if (!selected) return
    try {
      if (selected.type === 'skills') {
        await window.api.skills.writeFile(selected.id, selectedFile || 'SKILL.md', content)
      } else {
        await window.api.prompts.write(selected.id, content)
      }
      setDirty(false)
      if (selected.type === 'skills') {
        const [files] = await Promise.all([
          window.api.skills.listFiles(selected.id),
          loadAll(),
        ])
        setSkillFiles(files)
      } else {
        await loadAll()
      }
    } catch (err) {
      alert('保存失败: ' + err.message)
    }
  }, [selected, selectedFile, content, loadAll])

  // store latest save in ref so keydown handler always has the current version
  useEffect(() => { saveRef.current = save }, [save])

  const deleteItem = useCallback(async (type, itemOrId) => {
    const item = typeof itemOrId === 'string' ? { id: itemOrId } : itemOrId
    const id = item.id
    const label = item.name || item.relativePath || id
    if (!confirm(`确认删除 "${label}"？此操作不可撤销。`)) return
    try {
      if (type === 'skills') await window.api.skills.delete(id)
      else await window.api.prompts.delete(id)
      if (selected?.id === id) {
        setSelected(null)
        setSelectedFile(null)
        setSkillFiles([])
        setContent('')
        setDirty(false)
      }
      await loadAll()
    } catch (err) {
      alert('删除失败: ' + err.message)
    }
  }, [selected, loadAll])

  const createItem = useCallback(async ({ name, description }) => {
    const type = modal.type
    const id = toId(name)
    const initial = type === 'skill'
      ? `---\nname: ${id}\ndescription: ${description || 'A new skill'}\n---\n\n# ${name}\n\n`
      : `---\nname: ${name}\ndescription: ${description || 'A new prompt'}\ntags: general\n---\n\n`
    try {
      if (type === 'skill') await window.api.skills.write(id, initial)
      else await window.api.prompts.write(id, initial)
      await loadAll()
      const tabName = type === 'skill' ? 'skills' : 'prompts'
      const selectedId = type === 'skill' ? `claude:${id}` : id
      setModal(null)
      setTab(tabName)
      setSelected({ type: tabName, id: selectedId, name, source: 'claude', sourceLabel: 'Claude', relativePath: id })
      setSelectedFile(type === 'skill' ? 'SKILL.md' : null)
      setSkillFiles(type === 'skill' ? [{ name: 'SKILL.md', type: 'file', path: 'SKILL.md' }] : [])
      setContent(initial)
      setMode('edit')
      setDirty(false)
    } catch (err) {
      alert('创建失败: ' + err.message)
    }
  }, [modal, loadAll])

  // Ctrl+S / Cmd+S
  useEffect(() => {
    const handler = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (dirtyRef.current) saveRef.current?.()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const currentItems = tab === 'skills' ? items.skills : items.prompts

  return (
    <div className="app">
      <div className="titlebar">
        <div className="titlebar-left">
          <span className="app-logo">◆</span>
          <span className="app-name">Skills Prompt Manager</span>
        </div>
        <div className="win-btns">
          <button className="wb wb-min" onClick={() => window.api.window.minimize()}>─</button>
          <button className="wb wb-max" onClick={() => window.api.window.maximize()}>□</button>
          <button className="wb wb-cls" onClick={() => window.api.window.close()}>✕</button>
        </div>
      </div>

      <div className="layout">
        <Sidebar
          tab={tab}
          items={currentItems}
          selectedId={selected?.id}
          onTabChange={handleTabChange}
          onSelect={item => selectItem(tab, item)}
          onNew={type => setModal({ type })}
          onDelete={item => deleteItem(tab, item)}
        />
        <DetailPanel
          selected={selected}
          skillFiles={skillFiles}
          selectedFile={selectedFile}
          content={content}
          mode={mode}
          dirty={dirty}
          loading={loading}
          onSelectSkillFile={selectSkillFile}
          onModeChange={setMode}
          onContentChange={c => { setContent(c); setDirty(true) }}
          onSave={save}
        />
      </div>

      {modal && (
        <NewItemModal
          type={modal.type}
          onConfirm={createItem}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}
