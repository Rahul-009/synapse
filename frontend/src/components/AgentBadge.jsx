import { motion } from 'framer-motion'
import { AGENT_META } from '../lib/agents'

export default function AgentBadge({ agent, thinking = false }) {
  const meta = AGENT_META[agent]
  if (!meta) return null

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-from/12 to-brand-to/12 px-2 py-0.5 text-[11px] font-semibold text-accent dark:from-brand-from/25 dark:to-brand-to/25 dark:text-accent-dark"
    >
      <span>{meta.emoji}</span>
      {meta.label}
      {thinking && <span className="animate-pulse">…</span>}
    </motion.span>
  )
}
