// Streams a run of the agent graph over SSE. EventSource can't POST,
// so we parse the event stream from fetch's ReadableStream ourselves.
export async function streamAgent({
  messages,
  agent,
  conversationId,
  hasDocument,
  docName,
  onAgent,
  onToken,
  signal,
}) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/agent/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ messages, agent, conversationId, hasDocument, docName }),
    signal,
  })
  if (!res.ok) throw new Error(`Agent request failed (${res.status})`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result = { agent: null, content: '' }
  let errorMessage = null

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const chunks = buffer.split('\n\n')
    buffer = chunks.pop()

    for (const chunk of chunks) {
      const event = chunk.match(/^event: (.+)$/m)?.[1]
      const data = chunk.match(/^data: (.+)$/m)?.[1]
      if (!event || !data) continue

      const payload = JSON.parse(data)
      if (event === 'agent') {
        result.agent = payload.agent
        onAgent?.(payload.agent)
      } else if (event === 'token') {
        onToken?.(payload.token)
      } else if (event === 'done') {
        result = payload
      } else if (event === 'error') {
        errorMessage = payload.message
      }
    }
  }

  if (errorMessage) throw new Error(errorMessage)
  return result
}
