import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import AuthShell from '../components/AuthShell'
import { authFormVariants, authFieldVariants } from '../lib/motionVariants'

const inputClass =
  'rounded-xl border border-neutral-200 bg-white/60 px-3.5 py-2.5 text-[15px] font-normal text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-accent focus:ring-4 focus:ring-accent/15 dark:border-neutral-600 dark:bg-neutral-800/60 dark:text-neutral-100 dark:focus:border-accent-dark'

export default function Login() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
        Welcome back
      </h1>
      <p className="mb-6 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Sign in to continue chatting
      </p>
      <motion.form
        variants={authFormVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.label
          variants={authFieldVariants}
          className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
            className={inputClass}
          />
        </motion.label>
        <motion.label
          variants={authFieldVariants}
          className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className={inputClass}
          />
        </motion.label>
        <motion.button
          variants={authFieldVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-xl bg-gradient-to-r from-brand-from to-brand-to px-3 py-2.5 text-[15px] font-semibold text-white shadow-lg shadow-brand-from/25 transition hover:shadow-xl hover:shadow-brand-from/30 disabled:cursor-default disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </motion.button>
      </motion.form>
      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-medium text-accent hover:underline dark:text-accent-dark"
        >
          Create one
        </Link>
      </p>
    </AuthShell>
  )
}
