import type { Message } from '../types'

const KEY = 'eval-agent:conversation:v1'

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') return false
  const m = value as Record<string, unknown>
  return typeof m.id === 'string' && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
}

export function loadMessages(): Message[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    if (!Array.isArray(parsed) || !parsed.every(isMessage)) return []
    // A reply cannot still be streaming after a reload; the request died with the old page.
    return parsed.map((m) => (m.streaming ? { ...m, streaming: false, stopped: true } : m))
  } catch {
    return []
  }
}

export function saveMessages(messages: Message[]): void {
  try {
    if (messages.length === 0) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, JSON.stringify(messages))
  } catch {
    // Storage can be full or blocked (e.g. private browsing); the conversation still works in memory.
  }
}
