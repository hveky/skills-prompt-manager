import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Check,
  Clipboard,
  Code2,
  Eye,
  FileText,
  Save,
  Sparkles,
} from 'lucide-react'
import CodePreview from './CodePreview'
import SkillFileTree from './SkillFileTree'

function parseFrontmatter(raw) {
  if (!raw?.trim()) return { data: {}, body: '' }
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { data: {}, body: raw }
  const data = {}
  m[1].split('\n').forEach(line => {
    const kv = line.match(/^([^:]+):\s*(.*)$/)
    if (kv) data[kv[1].trim()] = kv[2].trim()
  })
  return { data, body: m[2] }
}

function splitTags(value) {
  return String(value || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
}

function isMarkdownFile(filePath = '') {
  return /\.(md|markdown)$/i.test(filePath)
}

function FrontmatterPanel({ data }) {
  const entries = Object.entries(data).filter(([, value]) => String(value || '').trim())

  if (entries.length === 0) {
    return (
      <section className="frontmatter-panel empty">
        <div className="fm-label">Frontmatter</div>
        <div className="fm-empty">未检测到 YAML frontmatter</div>
      </section>
    )
  }

  return (
    <section className="frontmatter-panel">
      <div className="fm-label">Frontmatter</div>
      <div className="fm-grid">
        {entries.map(([key, value]) => (
          <div className={`fm-field fm-${key}`} key={key}>
            <div className="fm-key">{key}</div>
            {key === 'tags' ? (
              <div className="fm-tags">
                {splitTags(value).map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            ) : (
              <div className="fm-value">{value}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default function DetailPanel({
  selected,
  skillFiles,
  selectedFile,
  content,
  mode,
  dirty,
  loading,
  onSelectSkillFile,
  onModeChange,
  onContentChange,
  onSave,
  onToggleSkillEnabled,
}) {
  const [copied, setCopied] = useState(false)
  const isSkill = selected?.type === 'skills'
  const isPrompt = selected?.type === 'prompts'
  const fileLabel = selectedFile || `${selected?.id || ''}.md`
  const renderAsMarkdown = isPrompt || isMarkdownFile(fileLabel)
  const { data, body } = useMemo(
    () => renderAsMarkdown ? parseFrontmatter(content) : { data: {}, body: content || '' },
    [content, renderAsMarkdown]
  )

  if (!selected) {
    return (
      <div className="detail empty">
        <div className="placeholder">
          <Sparkles size={34} strokeWidth={1.8} />
          <p>从左侧选择一项开始编辑</p>
        </div>
      </div>
    )
  }

  const title = isSkill && selectedFile !== 'SKILL.md'
    ? fileLabel
    : data.name || selected.id
  const sourceText = isSkill
    ? [selected.sourceLabel, selected.relativePath, fileLabel].filter(Boolean).join(' / ')
    : 'Prompt'

  const copyPromptBody = async () => {
    if (!isPrompt) return
    await window.api.clipboard.writeText(body)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="detail-shell">
      {isSkill && (
        <SkillFileTree
          files={skillFiles}
          selectedPath={selectedFile}
          onSelect={onSelectSkillFile}
        />
      )}

      <section className="detail">
        <div className="detail-bar">
          <div className="detail-bar-left">
            {isSkill ? <FileText size={18} /> : <Clipboard size={18} />}
            <div className="detail-heading">
              <span className="detail-title">{title}</span>
              <span className="detail-subtitle">{sourceText}</span>
            </div>
            {dirty && <span className="unsaved-dot" title="未保存" />}
          </div>
          <div className="detail-bar-right">
            {isPrompt && (
              <button className="icon-btn copy-btn" onClick={copyPromptBody} title="复制正文">
                {copied ? <Check size={17} /> : <Clipboard size={17} />}
                <span>{copied ? '已复制' : '复制正文'}</span>
              </button>
            )}
            {isSkill && (
              <button
                className={`skill-toggle ${selected.enabled ? 'enabled' : 'disabled'}`}
                type="button"
                role="switch"
                aria-checked={selected.enabled}
                title={selected.enabled ? '关闭 Skill' : '启用 Skill'}
                onClick={() => onToggleSkillEnabled(selected, !selected.enabled)}
              >
                <span className="skill-toggle-track">
                  <span className="skill-toggle-thumb" />
                </span>
                <span className="skill-toggle-label">
                  {selected.enabled ? '已启用' : '已关闭'}
                </span>
              </button>
            )}
            <div className="seg" aria-label="内容模式">
              <button
                className={`seg-btn ${mode === 'preview' ? 'active' : ''}`}
                onClick={() => onModeChange('preview')}
                title="预览"
              >
                <Eye size={15} />
                <span>预览</span>
              </button>
              <button
                className={`seg-btn ${mode === 'edit' ? 'active' : ''}`}
                onClick={() => onModeChange('edit')}
                title="源码"
              >
                <Code2 size={15} />
                <span>源码</span>
              </button>
            </div>
            {dirty && (
              <button className="save-btn" onClick={onSave}>
                <Save size={15} />
                <span>保存</span>
              </button>
            )}
          </div>
        </div>

        <div className="detail-content">
          {loading ? (
            <div className="content-loading">加载中...</div>
          ) : mode === 'preview' ? (
            <div className="preview-scroll">
              {renderAsMarkdown ? (
                <>
                  <FrontmatterPanel data={data} />
                  <section className="body-panel">
                    <div className="body-panel-head">
                      <span>Content</span>
                    </div>
                    <div className="md-preview">
                      {body.trim()
                        ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
                        : <p className="md-empty">暂无内容，切换到「源码」模式开始写</p>
                      }
                    </div>
                  </section>
                </>
              ) : (
                <CodePreview content={content} filePath={fileLabel} />
              )}
            </div>
          ) : (
            <textarea
              className="raw-editor"
              value={content}
              onChange={e => onContentChange(e.target.value)}
              spellCheck={false}
              placeholder="在这里写内容（支持 YAML frontmatter + Markdown）"
            />
          )}
        </div>
      </section>
    </div>
  )
}
