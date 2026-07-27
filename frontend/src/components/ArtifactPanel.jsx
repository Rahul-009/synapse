import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Editor from '@monaco-editor/react'
import { useArtifactStore } from '../store/artifactStore'

// fence tag -> monaco language id
const MONACO_LANGUAGES = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  rb: 'ruby',
  sh: 'shell',
  bash: 'shell',
  yml: 'yaml',
  md: 'markdown',
  htm: 'html',
}

const useDarkMode = () => {
  const [dark, setDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return dark
}

function PanelContent() {
  const code = useArtifactStore((s) => s.code)
  const language = useArtifactStore((s) => s.language)
  const view = useArtifactStore((s) => s.view)
  const setView = useArtifactStore((s) => s.setView)
  const setCode = useArtifactStore((s) => s.setCode)
  const close = useArtifactStore((s) => s.close)
  const [copied, setCopied] = useState(false)
  const dark = useDarkMode()

  const monacoLanguage = MONACO_LANGUAGES[language] ?? language
  const previewable = monacoLanguage === 'html'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  const tab = (id, label) => {
    const active = view === id
    return (
      <button
        key={id}
        type="button"
        onClick={() => setView(id)}
        className={`relative rounded-full px-3 py-1 text-xs font-medium transition ${
          active
            ? 'text-white'
            : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
        }`}
      >
        {active && (
          <motion.span
            layoutId="artifact-tab"
            className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-from to-brand-to"
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          />
        )}
        <span className="relative z-10">{label}</span>
      </button>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-neutral-900">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
        <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          {language}
        </span>
        <div className="flex items-center gap-1">
          {tab('code', 'Code')}
          {previewable && tab('preview', 'Preview')}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={copy}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-accent dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-accent-dark"
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={close}
            title="Close panel"
            className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-800"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {view === 'preview' && previewable ? (
          <iframe
            title="Website preview"
            sandbox="allow-scripts"
            srcDoc={code}
            className="size-full border-0 bg-white"
          />
        ) : (
          <Editor
            value={code}
            language={monacoLanguage}
            onChange={(value) => setCode(value ?? '')}
            theme={dark ? 'vs-dark' : 'light'}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 12 },
              wordWrap: 'on',
            }}
          />
        )}
      </div>
    </div>
  )
}

export default function ArtifactPanel() {
  const open = useArtifactStore((s) => s.open)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Desktop: inline right panel */}
          <motion.div
            key="artifact-desktop"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'min(45vw, 720px)', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="hidden min-w-0 shrink-0 overflow-hidden border-l border-neutral-200 md:block dark:border-neutral-700"
          >
            <div className="h-full min-w-[400px]">
              <PanelContent />
            </div>
          </motion.div>

          {/* Mobile: full-screen overlay */}
          <motion.div
            key="artifact-mobile"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <PanelContent />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
