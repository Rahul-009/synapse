import { create } from 'zustand'

export const useArtifactStore = create((set) => ({
  open: false,
  code: '',
  language: 'plaintext',
  view: 'code', // 'code' | 'preview'

  openArtifact: ({ code, language }) =>
    set({ open: true, code, language: language || 'plaintext', view: 'code' }),
  close: () => set({ open: false }),
  setView: (view) => set({ view }),
  setCode: (code) => set({ code }),
}))
