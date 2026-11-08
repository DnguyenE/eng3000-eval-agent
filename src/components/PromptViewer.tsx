import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { fetchSystemPrompt } from '../lib/chatApi'
import { CheckIcon, CloseIcon, CopyIcon, DownloadIcon } from './icons'

export function PromptViewer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [prompt, setPrompt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open || prompt) return
    fetchSystemPrompt()
      .then(setPrompt)
      .catch((err: Error) => setError(err.message))
  }, [open, prompt])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function copy() {
    if (!prompt) return
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function download() {
    if (!prompt) return
    const url = URL.createObjectURL(new Blob([prompt], { type: 'text/markdown' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'project-evaluation-agent-system-prompt.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div>
                <h2 id="prompt-title" className="text-lg font-semibold text-white">
                  Full system prompt
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Paste this into any free chatbot (ChatGPT, Gemini, Claude, Copilot) to get roughly the same agent.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="scroll-thin flex-1 overflow-y-auto p-5">
              {error && <p className="text-sm text-rose-300">{error}</p>}
              {!error && !prompt && <div className="shimmer h-64 rounded-xl" />}
              {prompt && (
                <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-300">{prompt}</pre>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 p-4">
              <button
                type="button"
                onClick={download}
                disabled={!prompt}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-40"
              >
                <DownloadIcon className="h-4 w-4" /> Download .md
              </button>
              <button
                type="button"
                onClick={copy}
                disabled={!prompt}
                className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-indigo-500 to-sky-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy full system prompt'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
