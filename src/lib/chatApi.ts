import type { Role } from '../types'

export const MAX_MESSAGE_CHARS = 8_000

interface StreamOptions {
  messages: { role: Role; content: string }[]
  signal: AbortSignal
  onProvider: (provider: string) => void
  onText: (chunk: string) => void
}

export async function streamChat({ messages, signal, onProvider, onText }: StreamOptions): Promise<void> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  })

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error ?? `Request failed (HTTP ${res.status}).`)
  }

  const provider = res.headers.get('X-Provider')
  if (provider) onProvider(provider)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    onText(decoder.decode(value, { stream: true }))
  }
}

export async function fetchSystemPrompt(): Promise<string> {
  const res = await fetch('/api/chat')
  if (!res.ok) throw new Error(`Could not load the system prompt (HTTP ${res.status}).`)
  return res.text()
}
