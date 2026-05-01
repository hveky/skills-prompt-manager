import { useEffect, useState } from 'react'
import { ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react'

const TEXT_FILE_RE = /\.(md|markdown|txt|json|ya?ml|js|jsx|mjs|cjs|ts|tsx|css|html|htm|py|sh|bash|zsh|ps1|toml|ini|csv|xml)$/i

function isTextFile(path) {
  return TEXT_FILE_RE.test(path) || !path.includes('.')
}

function collectDirectories(nodes, acc = new Set()) {
  nodes.forEach(node => {
    if (node.type === 'dir') {
      acc.add(node.path)
      collectDirectories(node.children || [], acc)
    }
  })
  return acc
}

function TreeNode({ node, depth, selectedPath, expanded, onToggle, onSelect }) {
  const isDir = node.type === 'dir'
  const isOpen = expanded.has(node.path)
  const editable = !isDir && isTextFile(node.path)
  const selected = selectedPath === node.path
  const Icon = isDir ? (isOpen ? FolderOpen : Folder) : FileText

  const handleClick = () => {
    if (isDir) onToggle(node.path)
    else if (editable) onSelect(node.path)
  }

  return (
    <div className="tree-node">
      <button
        className={`tree-row ${selected ? 'selected' : ''} ${!isDir && !editable ? 'disabled' : ''}`}
        style={{ paddingLeft: 8 + depth * 16 }}
        onClick={handleClick}
        title={node.path}
      >
        <span className={`tree-caret ${isDir && isOpen ? 'open' : ''}`}>
          {isDir && <ChevronRight size={13} strokeWidth={2.3} />}
        </span>
        <Icon size={14} strokeWidth={2} />
        <span className="tree-name">{node.name}</span>
      </button>
      {isDir && isOpen && (node.children || []).map(child => (
        <TreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          selectedPath={selectedPath}
          expanded={expanded}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

export default function SkillFileTree({ files, selectedPath, onSelect }) {
  const [expanded, setExpanded] = useState(new Set())

  useEffect(() => {
    setExpanded(collectDirectories(files || []))
  }, [files])

  const toggle = path => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  return (
    <aside className="skill-tree">
      <div className="skill-tree-head">
        <span>Files</span>
      </div>
      <div className="tree-list">
        {(files || []).length === 0 ? (
          <div className="tree-empty">暂无文件</div>
        ) : (
          files.map(node => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              expanded={expanded}
              onToggle={toggle}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </aside>
  )
}
