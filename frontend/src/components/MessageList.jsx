import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useChatStore } from '../store/chatStore'
import AgentBadge from './AgentBadge'
import CodeBlock from './CodeBlock'

const SUGGESTIONS = [
  { emoji: '⌨️', text: 'Write a binary search in Python' },
  { emoji: '🔍', text: "What's the latest in AI news?" },
  { emoji: '💬', text: 'Help me plan a productive morning routine' },
  { emoji: '📄', text: 'Summarize a document for me' },
]

const markdownComponents = {
  code({ inline, className, children, ...props }) {
    if (inline) {
      return (
        <code
          className="rounded bg-neutral-200 px-1 py-0.5 text-[13px] dark:bg-neutral-700"
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code className={`${className ?? ''} text-[13px]`} {...props}>
        {children}
      </code>
    )
  },
  pre({ children }) {
    return <CodeBlock>{children}</CodeBlock>
  },
  a({ children, ...props }) {
    return (
      <a
        className="text-accent underline dark:text-accent-dark"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </a>
    )
  },
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-neutral-400"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  )
}

function AssistantBubble({ content, agent, thinking = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, x: -8 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="flex max-w-[90%] gap-2.5 self-start sm:max-w-[85%]"
    >
      <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-from to-brand-to text-[11px] font-bold text-white">
        ✦
      </span>
      <div className="flex min-w-0 flex-col items-start gap-1">
        <AgentBadge agent={agent} thinking={thinking} />
        <div
          className={`min-w-0 rounded-2xl rounded-tl-md bg-white px-4 py-2.5 text-[15px] leading-relaxed text-neutral-900 shadow-sm ring-1 ring-neutral-200/80 dark:bg-neutral-800 dark:text-neutral-100 dark:ring-neutral-700 ${
            thinking ? 'ring-accent/30 dark:ring-accent-dark/30' : ''
          } [&>*:first-child]:mt-0 [&>*:last-child]:mb-0`}
        >
          {content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content}
            </ReactMarkdown>
          ) : (
            <TypingDots />
          )}
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState() {
  const sendMessage = useChatStore((s) => s.sendMessage)

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <h2 className="bg-gradient-to-r from-brand-from to-brand-to bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
          What can I help you with?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
          Your message is routed to the right specialist — coding, web search,
          document Q&A, image analysis, or plain conversation.
        </p>
      </motion.div>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } }}
        className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {SUGGESTIONS.map((s) => (
          <motion.button
            key={s.text}
            type="button"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => sendMessage(s.text)}
            className="rounded-2xl border border-neutral-200 bg-white/70 px-4 py-3 text-left text-sm text-neutral-700 shadow-sm backdrop-blur transition hover:border-accent/40 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-200 dark:hover:border-accent-dark/40"
          >
            <span className="mr-2">{s.emoji}</span>
            {s.text}
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}

export default function MessageList() {
  const messages = useChatStore((s) => s.messages)
  const loadingMessages = useChatStore((s) => s.loadingMessages)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const streamingText = useChatStore((s) => s.streamingText)
  const streamingAgent = useChatStore((s) => s.streamingAgent)
  const error = useChatStore((s) => s.error)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingText])

  if (loadingMessages) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
        <TypingDots />
      </div>
    )
  }

  if (messages.length === 0 && !isStreaming) {
    return <EmptyState />
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-6 pt-16">
        {messages.map((m) =>
          m.role === 'user' ? (
            <motion.div
              key={m._id}
              initial={{ opacity: 0, y: 10, x: 8 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="max-w-[90%] self-end whitespace-pre-wrap rounded-2xl rounded-tr-md bg-gradient-to-br from-brand-from to-brand-to px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-lg shadow-brand-from/20 sm:max-w-[85%]"
            >
              {m.content}
            </motion.div>
          ) : (
            <AssistantBubble key={m._id} content={m.content} agent={m.agent} />
          )
        )}

        {isStreaming && (
          <AssistantBubble
            content={streamingText}
            agent={streamingAgent}
            thinking
          />
        )}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="self-center rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
