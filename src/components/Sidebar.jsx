import { FileText, ListFilter, Plus, Power, Sparkles, Trash2 } from 'lucide-react'

const skillSourceOptions = [
  { value: 'all', label: 'All' },
  { value: 'claude', label: 'Claude Code' },
  { value: 'codex', label: 'Codex' },
  { value: 'agents', label: 'Agents' },
]

const skillStatusOptions = [
  { value: 'all', label: '全部' },
  { value: 'enabled', label: '已启用' },
  { value: 'disabled', label: '已关闭' },
]

export default function Sidebar({
  tab,
  items,
  selectedId,
  skillSourceFilter,
  skillStatusFilter,
  onTabChange,
  onSkillSourceFilterChange,
  onSkillStatusFilterChange,
  onSelect,
  onNew,
  onDelete,
}) {
  return (
    <aside className="sidebar">
      <div className="tab-row">
        <button
          className={`tab-btn ${tab === 'skills' ? 'active' : ''}`}
          onClick={() => onTabChange('skills')}
        >
          <Sparkles size={15} /> Skills
        </button>
        <button
          className={`tab-btn ${tab === 'prompts' ? 'active' : ''}`}
          onClick={() => onTabChange('prompts')}
        >
          <FileText size={15} /> Prompts
        </button>
      </div>

      <div className="list-header">
        <span>{tab === 'skills' ? 'Skills' : 'Prompts'}</span>
        <button
          className="new-btn"
          title={`新建 ${tab === 'skills' ? 'Skill' : 'Prompt'}`}
          onClick={() => onNew(tab === 'skills' ? 'skill' : 'prompt')}
        >
          <Plus size={15} strokeWidth={2.4} />
        </button>
      </div>

      {tab === 'skills' && (
        <div className="skill-filter-stack">
          <div className="source-filter-wrap">
            <div className="source-filter-label">
              <ListFilter size={13} />
              <span>来源</span>
            </div>
            <div className="source-filter" aria-label="Skill 来源筛选">
              {skillSourceOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`source-filter-btn ${skillSourceFilter === option.value ? 'active' : ''}`}
                  onClick={() => onSkillSourceFilterChange(option.value)}
                  title={option.label}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="source-filter-wrap status-filter-wrap">
            <div className="source-filter-label">
              <Power size={13} />
              <span>状态</span>
            </div>
            <div className="source-filter status-filter" aria-label="Skill 状态筛选">
              {skillStatusOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`source-filter-btn ${skillStatusFilter === option.value ? 'active' : ''}`}
                  onClick={() => onSkillStatusFilterChange(option.value)}
                  title={option.label}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="item-list">
        {items.length === 0 && (
          <div className="list-empty">
            暂无内容，点击 + 新建
          </div>
        )}
        {items.map(item => (
          <div
            key={item.id}
            className={`item-row ${selectedId === item.id ? 'selected' : ''}`}
            onClick={() => onSelect(item)}
          >
            <div className="item-body">
              <div className="item-title-row">
                <div className="item-name">{item.name || item.id}</div>
                {item.sourceLabel && <span className={`source-badge source-${item.source}`}>{item.sourceLabel}</span>}
              </div>
              {item.relativePath && (
                <div className="item-path">{item.relativePath}</div>
              )}
              {item.description && (
                <div className="item-desc">{item.description}</div>
              )}
              {item.tags && tab === 'prompts' && (
                <div className="item-tags">
                  {String(item.tags).split(',').map(t => t.trim()).filter(Boolean).map(t => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
              )}
            </div>
            <button
              className="del-btn"
              title="删除"
              onClick={e => { e.stopPropagation(); onDelete(item) }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  )
}
