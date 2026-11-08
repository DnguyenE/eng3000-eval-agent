import { motion } from 'motion/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { splitMessage } from '../lib/parseAssessment'
import type { Message } from '../types'
import { AlertIcon, CheckIcon, RefreshIcon } from './icons'
import { TypingIndicator } from './TypingIndicator'

interface Props {
  message: Message
  onRetry?: () => void
}

export function MessageBubble({ message, onRetry }: Props) {
  const isUser = message.role === 'user'
  const { text, assessment, pending, invalid } = isUser
    ? { text: message.content, assessment: null, pending: false, invalid: false }
    : splitMessage(message.content)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={
          isUser
            ? 'max-w-[85%] rounded-2xl rounded-br-md bg-linear-to-br from-indigo-500 to-sky-500 px-4 py-3 text-white shadow-lg shadow-indigo-500/20'
            : 'glass max-w-[95%] rounded-bl-md px-4 py-3'
        }
      >
        {isUser ? (
          <p className="text-[0.95rem] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            {text && (
              <div className="md">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
              </div>
            )}

            {message.streaming && !text && !pending && <TypingIndicator />}
            {pending && (
              <div className="mt-3">
                <TypingIndicator label="Building the results panel" />
              </div>
            )}

            {assessment && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                Results panel updated
              </motion.div>
            )}
            {invalid && !message.streaming && (
              <p className="mt-3 text-xs text-amber-300">
                The structured report could not be read. Ask the agent to "resend the assessment block".
              </p>
            )}

            {message.error && (
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-rose-300">
                <AlertIcon className="h-4 w-4 shrink-0" />
                <span>{message.error}</span>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-300/30 px-3 py-1 text-xs hover:bg-rose-300/10"
                  >
                    <RefreshIcon className="h-3.5 w-3.5" /> Retry
                  </button>
                )}
              </div>
            )}

            {message.provider && !message.streaming && (
              <p className="mt-2 text-[0.7rem] tracking-wide text-slate-500 uppercase">{message.provider}</p>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
