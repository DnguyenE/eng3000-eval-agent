import { motion } from 'motion/react'
import { useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { MAX_MESSAGE_CHARS } from '../lib/chatApi'
import { SendIcon, StopIcon } from './icons'

interface Props {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  streaming: boolean
  autoFocus?: boolean
}

export function Composer({ value, onChange, onSend, onStop, streaming, autoFocus }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const tooLong = value.length > MAX_MESSAGE_CHARS
  const canSend = value.trim().length > 0 && !tooLong && !streaming

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
  }, [value])

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus, value])

  function submit(e?: FormEvent) {
    e?.preventDefault()
    if (canSend) onSend()
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <form onSubmit={submit} className="glass flex items-end gap-2 p-2 focus-within:border-sky-400/40">
      <label htmlFor="composer" className="sr-only">
        Describe your project
      </label>
      <textarea
        id="composer"
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Describe the project: what, where, who decides, who is affected..."
        className="scroll-thin max-h-60 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[0.95rem] text-slate-100 placeholder:text-slate-500 focus:outline-none"
      />
      <div className="flex flex-col items-end gap-1">
        {value.length > MAX_MESSAGE_CHARS * 0.8 && (
          <span className={`text-[0.7rem] ${tooLong ? 'text-rose-300' : 'text-slate-500'}`}>
            {value.length.toLocaleString()} / {MAX_MESSAGE_CHARS.toLocaleString()}
          </span>
        )}
        {streaming ? (
          <motion.button
            type="button"
            onClick={onStop}
            whileTap={{ scale: 0.92 }}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-slate-200 hover:bg-white/15"
            aria-label="Stop generating"
          >
            <StopIcon className="h-5 w-5" />
          </motion.button>
        ) : (
          <motion.button
            type="submit"
            disabled={!canSend}
            whileHover={canSend ? { scale: 1.05 } : undefined}
            whileTap={canSend ? { scale: 0.92 } : undefined}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-sky-500 text-white shadow-lg shadow-sky-500/25 transition-opacity disabled:opacity-30 disabled:shadow-none"
            aria-label="Send"
          >
            <SendIcon className="h-5 w-5" />
          </motion.button>
        )}
      </div>
    </form>
  )
}
