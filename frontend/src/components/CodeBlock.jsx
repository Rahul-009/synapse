import { useState } from 'react'
import { useArtifactStore } from '../store/artifactStore'

// Pulls the raw text out of react-markdown's <code> children
const extractText = (children) => {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (children?.props?.children) return extractText(children.props.children)
  return ''
}

export default function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false)
  const openArtifact = useArtifactStore((s) => s.openArtifact)

  const codeElement = Array.isArray(children) ? children[0] : children
  const language =
    codeElement?.props?.className?.match(/language-([\w-]+)/)?.[1] ?? 'text'
  const code = extractText(children).replace(/\n$/, '')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  const toolbarButton =
    'rounded-md px-2 py-1 text-[11px] font-medium text-neutral-400 transition hover:bg-white/10 hover:text-white'

  return (
    <div className="my-2 overflow-hidden rounded-xl bg-neutral-900 ring-1 ring-neutral-700/60 dark:bg-black/50">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
          {language}
        </span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={copy} className={toolbarButton}>
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={() => openArtifact({ code, language })}
            className={toolbarButton}
          >
            Open in editor
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto p-3 text-neutral-100">{children}</pre>
    </div>
  )
}
