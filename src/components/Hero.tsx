import { motion } from 'motion/react'
import { LeafIcon, ScaleIcon, ShieldIcon } from './icons'

const QUESTIONS = [
  { id: 'Q1', title: 'Professional obligations', body: 'Professional Engineers Act, O. Reg. 941, Code of Ethics', Icon: ShieldIcon },
  { id: 'Q2', title: 'Law of the land', body: 'Building Code, AODA, OHSA, environmental and constitutional law', Icon: ScaleIcon },
  { id: 'Q3', title: 'Benefit to the land', body: 'Sustainability, Indigenous rights, equity and accessibility', Icon: LeafIcon },
]

export function Hero() {
  return (
    <div className="text-center">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        Free to use · No sign-in
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="text-4xl font-semibold tracking-tight text-white sm:text-5xl"
      >
        Should this project <span className="text-gradient">go ahead?</span>
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-auto mt-4 max-w-xl text-base text-slate-300"
      >
        Describe an engineering project. The agent checks it against three questions, shows the results side by side,
        and gives a verdict: proceed, proceed with conditions, or do not proceed.
      </motion.p>

      <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
        {QUESTIONS.map(({ id, title, body, Icon }, i) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07 }}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Icon className="h-4 w-4 text-sky-300" />
              <span className="text-sky-300">{id}</span> {title}
            </div>
            <p className="mt-1 text-xs leading-snug text-slate-400">{body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
