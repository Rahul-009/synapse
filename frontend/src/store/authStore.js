import { create } from 'zustand'
import api from '../api/client'

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  fetchUser: async () => {
    try {
      const res = await api.get('/me')
      set({ user: res.data.user, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    set({ user: res.data.user })
    return res.data.user
  },

  register: async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    set({ user: res.data.user })
    return res.data.user
  },

  logout: async () => {
    await api.post('/auth/logout')
    set({ user: null })
  },
}))
