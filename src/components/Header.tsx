import { motion } from 'motion/react'
import { DocIcon, RefreshIcon, ShieldIcon } from './icons'

interface Props {
  onShowPrompt: () => void
  onReset?: () => void
}

export function Header({ onShowPrompt, onReset }: Props) {
  return (
    <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 print:hidden">
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ rotate: -20, scale: 0.6, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 via-sky-500 to-emerald-400 shadow-lg shadow-sky-500/30"
        >
          <ShieldIcon className="h-5 w-5 text-white" />
        </motion.div>
        <div>
          <h1 className="text-base leading-tight font-semibold text-white">Project Evaluation Agent</h1>
          <p className="text-xs text-slate-400">ENG 3000 · Ontario ethics, law &amp; land</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-white/25 hover:text-white"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New evaluation</span>
          </button>
        )}
        <button
          type="button"
          onClick={onShowPrompt}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-white/25 hover:text-white"
        >
          <DocIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">System prompt</span>
        </button>
      </div>
    </header>
  )
}
