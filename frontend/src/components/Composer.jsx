import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../store/chatStore'
import { AGENT_META, AGENT_IDS } from '../lib/agents'
import {
  readImageAttachment,
  readDocumentAttachment,
} from '../lib/readAttachment'

function AgentPills() {
  const selectedAgent = useChatStore((s) => s.selectedAgent)
  const setSelectedAgent = useChatStore((s) => s.setSelectedAgent)

  const pill = (id, label, title) => {
    const active = selectedAgent === id
    return (
      <button
        key={id}
        type="button"
        title={title}
        onClick={() => setSelectedAgent(id)}
        className={`relative shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
          active
            ? 'text-white'
            : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
        }`}
      >
        {active && (
          <motion.span
            layoutId="agent-pill"
            className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-from to-brand-to shadow-md shadow-brand-from/25"
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          />
        )}
        <span className="relative z-10">{label}</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {pill('auto', '✨ Auto', 'Let the supervisor pick the agent')}
      {AGENT_IDS.map((id) =>
        pill(
          id,
          `${AGENT_META[id].emoji} ${AGENT_META[id].label}`,
          `Always use the ${AGENT_META[id].label} agent`
        )
      )}
    </div>
  )
}

const chipTransition = { type: 'spring', stiffness: 400, damping: 28 }
const chipMotion = {
  initial: { opacity: 0, scale: 0.9, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 8 },
}

function IndexingPill({ name }) {
  return (
    <motion.div
      {...chipMotion}
      transition={chipTransition}
      className="mb-2 inline-flex items-center gap-2 self-start rounded-xl border border-accent/30 bg-accent/5 px-2.5 py-1.5 text-sm text-accent dark:border-accent-dark/30 dark:bg-accent-dark/10 dark:text-accent-dark"
    >
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="inline-block"
      >
        ⏳
      </motion.span>
      Indexing {name}…
    </motion.div>
  )
}

function ActiveDocumentPill() {
  const activeId = useChatStore((s) => s.activeId)
  const docConvs = useChatStore((s) => s.docConvs)
  const doc = activeId ? docConvs[activeId] : null
  if (!doc) return null

  return (
    <motion.div
      {...chipMotion}
      transition={chipTransition}
      title="This conversation's questions can use this document"
      className="mb-2 inline-flex items-center gap-1.5 self-start rounded-xl bg-neutral-100 px-2.5 py-1 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
    >
      📄 {doc.name}
    </motion.div>
  )
}

function AttachmentChip() {
  const attachment = useChatStore((s) => s.attachment)
  const clearAttachment = useChatStore((s) => s.clearAttachment)

  return (
    <AnimatePresence>
      {attachment && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="mb-2 inline-flex items-center gap-2 self-start rounded-xl border border-neutral-200 bg-white/80 px-2.5 py-1.5 text-sm text-neutral-700 shadow-sm backdrop-blur dark:border-neutral-600 dark:bg-neutral-800/80 dark:text-neutral-200"
        >
          {attachment.kind === 'image' ? (
            <img
              src={attachment.dataUrl}
              alt=""
              className="size-8 rounded-lg object-cover"
            />
          ) : (
            <span>📄</span>
          )}
          <span className="max-w-48 truncate">{attachment.name}</span>
          <button
            type="button"
            onClick={clearAttachment}
            title="Remove attachment"
            className="rounded-full p-0.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Composer() {
  const [text, setText] = useState('')
  const [attachError, setAttachError] = useState('')
  const imageInputRef = useRef(null)
  const docInputRef = useRef(null)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const indexing = useChatStore((s) => s.indexing)
  const attachment = useChatStore((s) => s.attachment)
  const setAttachment = useChatStore((s) => s.setAttachment)

  const busy = isStreaming || indexing

  const submit = () => {
    if ((!text.trim() && !attachment) || busy) return
    sendMessage(text)
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const handleFile = (reader) => async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAttachError('')
    try {
      setAttachment(await reader(file))
    } catch (err) {
      setAttachError(err.message || 'Could not read file')
    }
  }

  const attachButtonClass =
    'rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-accent dark:hover:bg-neutral-800 dark:hover:text-accent-dark'

  return (
    <div className="px-3 pb-3 sm:px-4 sm:pb-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="mx-auto flex max-w-3xl flex-col rounded-2xl border border-neutral-200/80 bg-white/80 p-2.5 shadow-xl shadow-neutral-900/5 backdrop-blur-xl transition focus-within:border-accent/40 focus-within:shadow-brand-from/10 dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:focus-within:border-accent-dark/40"
      >
        <AnimatePresence mode="popLayout">
          {indexing ? (
            <IndexingPill key="indexing" name={attachment?.name} />
          ) : attachment ? null : (
            <ActiveDocumentPill key="active-doc" />
          )}
        </AnimatePresence>
        {!indexing && <AttachmentChip />}
        <AnimatePresence>
          {attachError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 overflow-hidden text-xs text-red-500"
            >
              {attachError}
            </motion.p>
          )}
        </AnimatePresence>
        <div className="flex items-end gap-1.5">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile(readImageAttachment)}
          />
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.txt,.md,.csv,.json"
            className="hidden"
            onChange={handleFile(readDocumentAttachment)}
          />
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => docInputRef.current?.click()}
            title="Attach a document (.pdf, .txt, .md, .csv, .json)"
            className={attachButtonClass}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => imageInputRef.current?.click()}
            title="Attach an image"
            className={attachButtonClass}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </motion.button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI Chat…"
            rows={Math.min(6, Math.max(1, text.split('\n').length))}
            className="flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100"
          />
          <motion.button
            type="button"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.9 }}
            onClick={submit}
            disabled={busy || (!text.trim() && !attachment)}
            className="rounded-xl bg-gradient-to-br from-brand-from to-brand-to p-2.5 text-white shadow-lg shadow-brand-from/25 transition disabled:cursor-default disabled:opacity-40 disabled:shadow-none"
            title="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </motion.button>
        </div>
        <div className="mt-1.5 border-t border-neutral-100 pt-1.5 dark:border-neutral-800">
          <AgentPills />
        </div>
      </motion.div>
    </div>
  )
}
