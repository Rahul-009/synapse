import { create } from 'zustand'
import api from '../api/client'
import { streamAgent } from '../api/streamAgent'

const isDesktop = () =>
  typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches

// conversationId -> { name } for indexed documents; persisted so the doc
// indicator and router hint survive reloads (vectors live in Qdrant anyway)
const DOC_CONVS_KEY = 'ai-chat:docConvs'
const loadDocConvs = () => {
  try {
    return JSON.parse(localStorage.getItem(DOC_CONVS_KEY)) ?? {}
  } catch {
    return {}
  }
}
const saveDocConvs = (map) => {
  try {
    localStorage.setItem(DOC_CONVS_KEY, JSON.stringify(map))
  } catch {
    /* storage unavailable */
  }
  return map
}

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeId: null,
  messages: [],
  loadingMessages: false,
  isStreaming: false,
  streamingText: '',
  streamingAgent: null,
  error: null,
  sidebarOpen: isDesktop(),
  selectedAgent: 'auto',
  // { kind: 'image', dataUrl, name } | { kind: 'document', name, file } | null
  attachment: null,
  // true while a document is being uploaded/chunked/embedded
  indexing: false,
  docConvs: loadDocConvs(),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSelectedAgent: (selectedAgent) => set({ selectedAgent }),
  setAttachment: (attachment) => set({ attachment }),
  clearAttachment: () => set({ attachment: null }),

  fetchConversations: async () => {
    try {
      const res = await api.get('/chat/conversations')
      set({ conversations: res.data.conversations })
    } catch {
      set({ error: 'Failed to load conversations' })
    }
  },

  newChat: () =>
    set({
      activeId: null,
      messages: [],
      error: null,
      ...(isDesktop() ? {} : { sidebarOpen: false }),
    }),

  selectConversation: async (id) => {
    if (get().isStreaming) return
    set({
      activeId: id,
      messages: [],
      loadingMessages: true,
      error: null,
      // on mobile the sidebar is an overlay drawer — close it after picking
      ...(isDesktop() ? {} : { sidebarOpen: false }),
    })
    try {
      const res = await api.get(`/chat/conversations/${id}/messages`)
      if (get().activeId === id) {
        set({ messages: res.data.messages, loadingMessages: false })
      }
    } catch {
      set({ loadingMessages: false, error: 'Failed to load messages' })
    }
  },

  deleteConversation: async (id) => {
    try {
      await api.delete(`/chat/conversations/${id}`)
      set((s) => {
        const docConvs = { ...s.docConvs }
        delete docConvs[id]
        return {
          conversations: s.conversations.filter((c) => c._id !== id),
          docConvs: saveDocConvs(docConvs),
          ...(s.activeId === id ? { activeId: null, messages: [] } : {}),
        }
      })
    } catch {
      set({ error: 'Failed to delete conversation' })
    }
  },

  sendMessage: async (content) => {
    const trimmed = content.trim()
    const { attachment, selectedAgent } = get()
    if ((!trimmed && !attachment) || get().isStreaming || get().indexing) return
    set({ error: null })

    let convId = get().activeId
    try {
      if (!convId) {
        const res = await api.post('/chat/conversations', {})
        convId = res.data.conversation._id
        set({ activeId: convId })
      }
    } catch {
      set({ error: 'Something went wrong. Please try again.' })
      return
    }

    // Index the document first — if it fails, nothing is persisted and the
    // attachment stays staged so the user can retry or remove it
    if (attachment?.kind === 'document') {
      set({ indexing: true })
      try {
        const form = new FormData()
        form.append('file', attachment.file)
        form.append('conversationId', convId)
        await api.post('/agent/upload', form)
        set((s) => ({
          indexing: false,
          docConvs: saveDocConvs({
            ...s.docConvs,
            [convId]: { name: attachment.name },
          }),
        }))
      } catch (err) {
        set({
          indexing: false,
          error: err.response?.data?.message || 'Failed to index document',
        })
        return
      }
    }

    try {
      // Chat service stores plain text — attachments show as a marker line
      const persistedContent = attachment
        ? `${trimmed}${trimmed ? '\n\n' : ''}📎 ${attachment.name}`
        : trimmed

      set((s) => ({
        messages: [
          ...s.messages,
          { _id: `local-${Date.now()}`, role: 'user', content: persistedContent },
        ],
        isStreaming: true,
        streamingText: '',
        streamingAgent: null,
        attachment: null,
      }))
      await api.post(`/chat/conversations/${convId}/messages`, {
        role: 'user',
        content: persistedContent,
      })

      // Build agent request: replay history as text, attach extras to this turn
      const history = get().messages.map(({ role, content }) => ({ role, content }))
      if (attachment?.kind === 'image') {
        history[history.length - 1] = {
          role: 'user',
          content: [
            { type: 'text', text: trimmed || 'Describe this image.' },
            { type: 'image_url', image_url: { url: attachment.dataUrl } },
          ],
        }
      }

      let agent
      if (selectedAgent !== 'auto') agent = selectedAgent
      else if (attachment?.kind === 'image') agent = 'image'
      else if (attachment?.kind === 'document') agent = 'pdf'

      const result = await streamAgent({
        messages: history,
        agent,
        conversationId: convId,
        hasDocument: Boolean(get().docConvs[convId]),
        docName: get().docConvs[convId]?.name,
        onAgent: (a) => set({ streamingAgent: a }),
        onToken: (token) =>
          set((s) => ({ streamingText: s.streamingText + token })),
      })

      set((s) => ({
        messages: [
          ...s.messages,
          {
            _id: `local-${Date.now()}-assistant`,
            role: 'assistant',
            content: result.content,
            agent: result.agent,
          },
        ],
        isStreaming: false,
        streamingText: '',
        streamingAgent: null,
      }))

      await api.post(`/chat/conversations/${convId}/messages`, {
        role: 'assistant',
        content: result.content,
        agent: result.agent,
      })
      get().fetchConversations()
    } catch {
      set({
        isStreaming: false,
        streamingText: '',
        streamingAgent: null,
        error: 'Something went wrong. Please try again.',
      })
    }
  },
}))
