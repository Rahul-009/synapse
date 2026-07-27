import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../store/chatStore'
import Sidebar from '../components/Sidebar'
import MessageList from '../components/MessageList'
import Composer from '../components/Composer'
import ArtifactPanel from '../components/ArtifactPanel'

export default function Chat() {
  const fetchConversations = useChatStore((s) => s.fetchConversations)
  const sidebarOpen = useChatStore((s) => s.sidebarOpen)
  const toggleSidebar = useChatStore((s) => s.toggleSidebar)

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return (
    <div className="flex h-svh overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Desktop: inline animated sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 288 : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="hidden shrink-0 overflow-hidden md:block"
      >
        <div className="h-full w-72">
          <Sidebar />
        </div>
      </motion.div>

      {/* Mobile: overlay drawer with backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden"
            />
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-30 w-72 md:hidden"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="relative flex min-w-0 flex-1 flex-col">
        <motion.button
          type="button"
          onClick={toggleSidebar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          className="absolute left-3 top-3 z-10 rounded-xl border border-neutral-200/80 bg-white/80 p-2 text-neutral-500 shadow-sm backdrop-blur transition hover:text-accent dark:border-neutral-700/80 dark:bg-neutral-800/80 dark:text-neutral-400 dark:hover:text-accent-dark"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </motion.button>
        <MessageList />
        <Composer />
      </main>

      <ArtifactPanel />
    </div>
  )
}
