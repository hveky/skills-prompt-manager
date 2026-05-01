import { useState, useEffect, useRef } from 'react'

export default function NewItemModal({ type, onConfirm, onCancel }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const nameRef = useRef(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  const isPrompt = type === 'prompt'
  const label = isPrompt ? 'Prompt' : 'Skill'

  const handleSubmit = e => {
    e.preventDefault()
    if (!name.trim()) return
    onConfirm({ name: name.trim(), description: description.trim(), tags: tags.trim() })
  }

  const handleKey = e => {
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="overlay" onClick={onCancel} onKeyDown={handleKey}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>新建 {label}</h2>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>名称 *</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={isPrompt ? '例：代码审查模板' : '例：my-skill'}
            />
            {name && (
              <div className="field-hint">
                ID: {name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
              </div>
            )}
          </div>

          <div className="field">
            <label>描述</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="一句话说明用途"
            />
          </div>

          {isPrompt && (
            <div className="field">
              <label>标签</label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="用逗号分隔，例：code, review"
              />
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onCancel}>取消</button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
