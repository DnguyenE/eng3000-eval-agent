import { useEffect, useRef } from 'react'
import type { Message } from '../types'
import { MessageBubble } from './MessageBubble'

interface Props {
  messages: Message[]
  onRetry: () => void
}

export function Chat({ messages, onRetry }: Props) {
  const endRef = useRef<HTMLDivElement>(null)
  const last = messages[messages.length - 1]

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, last?.content.length])

  return (
    <div className="space-y-4" aria-live="polite">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onRetry={message.error && message === last ? onRetry : undefined}
        />
      ))}
      <div ref={endRef} />
    </div>
  )
}
