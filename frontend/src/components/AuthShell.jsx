import { motion } from 'framer-motion'

export default function AuthShell({ children }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-neutral-50 p-6 dark:bg-neutral-950">
      {/* floating gradient blobs */}
      <motion.div
        aria-hidden
        className="absolute -left-32 -top-32 size-96 rounded-full bg-gradient-to-br from-brand-from/40 to-brand-to/30 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-40 -right-32 size-[28rem] rounded-full bg-gradient-to-tr from-brand-to/30 to-brand-from/40 blur-3xl"
        animate={{ x: [0, -35, 0], y: [0, -25, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative w-full max-w-sm rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl shadow-brand-from/10 backdrop-blur-xl dark:border-neutral-700/60 dark:bg-neutral-900/80"
      >
        <div className="mb-6 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-from to-brand-to text-sm font-bold text-white">
            ✦
          </span>
          <span className="bg-gradient-to-r from-brand-from to-brand-to bg-clip-text text-lg font-bold text-transparent">
            AI Chat
          </span>
        </div>
        {children}
      </motion.div>
    </div>
  )
}
