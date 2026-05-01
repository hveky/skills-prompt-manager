import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx'
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup'
import powershell from 'react-syntax-highlighter/dist/esm/languages/prism/powershell'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import toml from 'react-syntax-highlighter/dist/esm/languages/prism/toml'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml'
import ghcolors from 'react-syntax-highlighter/dist/esm/styles/prism/ghcolors'

SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('jsx', jsx)
SyntaxHighlighter.registerLanguage('markup', markup)
SyntaxHighlighter.registerLanguage('powershell', powershell)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('toml', toml)
SyntaxHighlighter.registerLanguage('tsx', tsx)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('yaml', yaml)

const LANGUAGE_BY_EXT = {
  bash: 'bash',
  css: 'css',
  html: 'markup',
  htm: 'markup',
  js: 'javascript',
  json: 'json',
  jsx: 'jsx',
  mjs: 'javascript',
  cjs: 'javascript',
  ps1: 'powershell',
  py: 'python',
  sh: 'bash',
  toml: 'toml',
  ts: 'typescript',
  tsx: 'tsx',
  xml: 'markup',
  yaml: 'yaml',
  yml: 'yaml',
  zsh: 'bash',
}

function extensionOf(filePath = '') {
  const name = filePath.split('/').pop() || ''
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase()
}

export function languageForFile(filePath = '') {
  return LANGUAGE_BY_EXT[extensionOf(filePath)] || 'text'
}

function formatContent(content, language) {
  if (language !== 'json') return content
  try {
    return `${JSON.stringify(JSON.parse(content), null, 2)}\n`
  } catch {
    return content
  }
}

export default function CodePreview({ content, filePath }) {
  const language = languageForFile(filePath)
  const displayLanguage = language === 'markup' ? 'html/xml' : language
  const formatted = formatContent(content || '', language)

  return (
    <section className="body-panel code-panel">
      <div className="body-panel-head">
        <span>Code</span>
        <span className="code-language">{displayLanguage}</span>
      </div>
      <div className="code-preview">
        <SyntaxHighlighter
          language={language === 'text' ? undefined : language}
          style={ghcolors}
          showLineNumbers
          wrapLongLines
          customStyle={{
            margin: 0,
            padding: '24px 0',
            background: 'transparent',
            fontSize: '13px',
            lineHeight: 1.65,
          }}
          lineNumberStyle={{
            minWidth: '3.25em',
            paddingRight: '1.15em',
            color: '#aaa399',
            textAlign: 'right',
            userSelect: 'none',
          }}
        >
          {formatted}
        </SyntaxHighlighter>
      </div>
    </section>
  )
}
