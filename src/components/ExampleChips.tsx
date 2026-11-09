import { motion } from 'motion/react'
import { EXAMPLES } from '../config/examples'

export function ExampleChips({ onPick, compact }: { onPick: (prompt: string) => void; compact?: boolean }) {
  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'sm:grid-cols-2'}`}>
      {EXAMPLES.map((example, i) => (
        <motion.button
          key={example.id}
          type="button"
          onClick={() => onPick(example.prompt)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 + i * 0.08 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          className={`glass group text-left transition-colors hover:border-sky-400/40 hover:bg-white/[0.07] ${
            compact ? 'px-3 py-2' : 'p-4'
          }`}
        >
          <span className="text-sm font-semibold text-white group-hover:text-sky-200">{example.label}</span>
          {!compact && <span className="mt-1 block text-xs leading-snug text-slate-400">{example.description}</span>}
        </motion.button>
      ))}
    </div>
  )
}
