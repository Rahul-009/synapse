import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const conversations = useChatStore((s) => s.conversations)
  const activeId = useChatStore((s) => s.activeId)
  const newChat = useChatStore((s) => s.newChat)
  const selectConversation = useChatStore((s) => s.selectConversation)
  const deleteConversation = useChatStore((s) => s.deleteConversation)

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside className="flex h-full flex-col border-r border-neutral-200/80 bg-white/70 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/70">
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-from to-brand-to text-sm font-bold text-white">
          ✦
        </span>
        <span className="bg-gradient-to-r from-brand-from to-brand-to bg-clip-text text-lg font-bold text-transparent">
          AI Chat
        </span>
      </div>

      <div className="p-3">
        <motion.button
          type="button"
          onClick={newChat}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-xl bg-gradient-to-r from-brand-from to-brand-to px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-from/25 transition hover:shadow-xl hover:shadow-brand-from/30"
        >
          + New chat
        </motion.button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-2">
        {conversations.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
            No conversations yet
          </p>
        )}
        <ul className="flex flex-col gap-0.5">
          <AnimatePresence initial={false}>
            {conversations.map((c) => (
              <motion.li
                key={c._id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.18 }}
                className="group relative overflow-hidden"
              >
                {c._id === activeId && (
                  <motion.span
                    layoutId="active-conversation"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-from/12 to-brand-to/12 dark:from-brand-from/25 dark:to-brand-to/25"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => selectConversation(c._id)}
                  className={`relative z-10 w-full truncate rounded-xl px-3 py-2.5 pr-8 text-left text-sm transition ${
                    c._id === activeId
                      ? 'font-medium text-accent dark:text-accent-dark'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  {c.title}
                </button>
                <button
                  type="button"
                  onClick={() => deleteConversation(c._id)}
                  title="Delete conversation"
                  className="absolute right-1.5 top-1/2 z-10 hidden -translate-y-1/2 rounded-lg p-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-500 group-hover:block dark:hover:bg-red-950"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                  </svg>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </nav>

      <div className="flex items-center gap-3 border-t border-neutral-200/80 p-3 dark:border-neutral-800">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-from to-brand-to text-xs font-bold text-white">
          {initials}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {user?.name}
        </span>
        <motion.button
          type="button"
          onClick={logout}
          whileTap={{ scale: 0.94 }}
          title="Log out"
          className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-800"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </motion.button>
      </div>
    </aside>
  )
}
