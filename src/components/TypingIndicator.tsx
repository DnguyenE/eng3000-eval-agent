import { motion } from 'motion/react'

export function TypingIndicator({ label = 'Thinking' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-400" role="status">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-sky-300"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <span>{label}</span>
    </div>
  )
}
