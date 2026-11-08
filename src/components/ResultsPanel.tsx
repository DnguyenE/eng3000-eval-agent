import { motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'
import type { Assessment, Finding, Level, Rating, SectionResult, Severity, Verdict } from '../types'
import { AlertIcon, LeafIcon, PrintIcon, ScaleIcon, ShieldIcon } from './icons'

const VERDICT_STYLE: Record<Verdict, { label: string; ring: string; text: string; bg: string; glow: string }> = {
  proceed: {
    label: 'Proceed',
    ring: 'border-emerald-400/50',
    text: 'text-emerald-300',
    bg: 'bg-emerald-400/10',
    glow: 'shadow-emerald-500/30',
  },
  proceed_with_conditions: {
    label: 'Proceed with conditions',
    ring: 'border-amber-400/50',
    text: 'text-amber-300',
    bg: 'bg-amber-400/10',
    glow: 'shadow-amber-500/30',
  },
  do_not_proceed: {
    label: 'Do not proceed',
    ring: 'border-rose-400/50',
    text: 'text-rose-300',
    bg: 'bg-rose-400/10',
    glow: 'shadow-rose-500/30',
  },
}

const RATING_STYLE: Record<Rating, string> = {
  pass: 'bg-emerald-400/15 text-emerald-300',
  conditional: 'bg-amber-400/15 text-amber-300',
  fail: 'bg-rose-400/15 text-rose-300',
  unknown: 'bg-slate-400/15 text-slate-300',
}

const SEVERITY_DOT: Record<Severity, string> = {
  critical: 'bg-rose-400',
  major: 'bg-orange-400',
  minor: 'bg-amber-300',
  positive: 'bg-emerald-400',
}

const LEVEL_STYLE: Record<Level | 'critical', string> = {
  low: 'text-emerald-300',
  medium: 'text-amber-300',
  high: 'text-orange-300',
  critical: 'text-rose-300',
}

const SECTIONS = [
  { key: 'q1', id: 'Q1', title: 'Professional obligations', Icon: ShieldIcon },
  { key: 'q2', id: 'Q2', title: 'Law of the land', Icon: ScaleIcon },
  { key: 'q3', id: 'Q3', title: 'Benefit to the land', Icon: LeafIcon },
] as const

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
}

function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <motion.section variants={item} className={`glass p-5 ${className}`}>
      {title && <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-300 uppercase">{title}</h3>}
      {children}
    </motion.section>
  )
}

function ScoreBar({ score, delay = 0 }: { score: number | null; delay?: number }) {
  const pct = score === null ? 0 : (score / 3) * 100
  const color = score === null ? 'bg-slate-500' : score === 0 ? 'bg-rose-400' : score < 3 ? 'bg-amber-400' : 'bg-emerald-400'
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}

function FindingItem({ finding }: { finding: Finding }) {
  return (
    <li className="flex gap-2.5">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[finding.severity]}`} title={finding.severity} />
      <div className="min-w-0">
        <p className="text-sm leading-snug text-slate-200">{finding.issue}</p>
        <p className="mt-1 font-mono text-[0.7rem] leading-snug break-words text-sky-300/90">{finding.citation}</p>
        <p className="mt-0.5 text-[0.65rem] tracking-wide text-slate-500 uppercase">
          {finding.severity} · {finding.confidence} confidence
        </p>
      </div>
    </li>
  )
}

function SectionColumn({
  id,
  title,
  Icon,
  result,
  index,
}: {
  id: string
  title: string
  Icon: (p: { className?: string }) => ReactNode
  result: SectionResult
  index: number
}) {
  return (
    <motion.section variants={item} className="glass flex flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
            <Icon className="h-4 w-4 text-sky-300" />
          </span>
          <div>
            <p className="text-[0.65rem] font-semibold tracking-widest text-sky-300">{id}</p>
            <h3 className="text-sm leading-tight font-semibold text-white">{title}</h3>
          </div>
        </div>
        <span className="text-lg font-semibold text-white tabular-nums">
          {result.score ?? '?'}
          <span className="text-xs text-slate-500">/3</span>
        </span>
      </div>
      <div className="mt-3">
        <ScoreBar score={result.score} delay={0.2 + index * 0.1} />
      </div>
      <span className={`mt-3 self-start rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${RATING_STYLE[result.rating]}`}>
        {result.rating}
      </span>
      {result.summary && <p className="mt-2 text-sm leading-snug text-slate-300">{result.summary}</p>}
      {result.findings.length > 0 && (
        <ul className="mt-4 space-y-3 border-t border-white/10 pt-4">
          {result.findings.map((finding, i) => (
            <FindingItem key={i} finding={finding} />
          ))}
        </ul>
      )}
    </motion.section>
  )
}

function List({ items, tone = 'text-slate-300' }: { items: string[]; tone?: string }) {
  return (
    <ul className={`list-disc space-y-1.5 pl-5 text-sm leading-snug ${tone}`}>
      {items.map((text, i) => (
        <li key={i}>{text}</li>
      ))}
    </ul>
  )
}

export function ResultsPanel({ assessment }: { assessment: Assessment }) {
  const verdict = VERDICT_STYLE[assessment.verdict]
  const scores = [assessment.q1.score, assessment.q2.score, assessment.q3.score]
  const total = scores.every((s) => s !== null) ? scores.reduce<number>((a, b) => a + (b ?? 0), 0) : null
  const profile = assessment.project_profile
  const profileRows = [
    ['Location', profile.location],
    ['Phase', profile.phase],
    ['Disciplines', profile.disciplines.join(', ')],
    ['Decision makers', profile.decision_makers.join(', ')],
  ].filter(([, v]) => v)

  return (
    <motion.div
      key={JSON.stringify(scores) + assessment.verdict + profile.name}
      variants={container}
      initial="hidden"
      animate="show"
      className="@container space-y-4"
    >
      <motion.section variants={item} className={`glass relative overflow-hidden border ${verdict.ring} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs tracking-widest text-slate-400 uppercase">Recommendation</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{profile.name}</h2>
            {profile.summary && <p className="mt-1 text-sm text-slate-300">{profile.summary}</p>}
          </div>
          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.25 }}
            className={`relative rounded-2xl border ${verdict.ring} ${verdict.bg} px-4 py-3 shadow-lg ${verdict.glow}`}
          >
            <motion.span
              className={`absolute inset-0 rounded-2xl border ${verdict.ring} print:hidden`}
              animate={{ scale: [1, 1.12], opacity: [0.7, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            />
            <p className={`text-lg font-bold ${verdict.text}`}>{verdict.label}</p>
            {total !== null && <p className="text-xs text-slate-300">Total score {total}/9</p>}
          </motion.div>
        </div>
        {assessment.decision_rule_applied && (
          <p className="mt-4 rounded-xl bg-black/20 px-3 py-2 text-sm text-slate-300">
            <span className="font-medium text-slate-200">Decision rule: </span>
            {assessment.decision_rule_applied}
          </p>
        )}
      </motion.section>

      <div className="grid gap-4 @2xl:grid-cols-3">
        {SECTIONS.map(({ key, id, title, Icon }, i) => (
          <SectionColumn key={key} id={id} title={title} Icon={Icon} result={assessment[key]} index={i} />
        ))}
      </div>

      {assessment.conflicts.length > 0 && (
        <Card title="Where Q1, Q2 and Q3 conflict" className="border-amber-400/20">
          <ul className="space-y-3">
            {assessment.conflicts.map((c, i) => (
              <li key={i} className="flex gap-3">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <div>
                  <p className="text-sm font-medium text-amber-200">{c.between}</p>
                  <p className="text-sm text-slate-300">{c.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {assessment.conditions.length > 0 && (
        <Card title="Conditions">
          <List items={assessment.conditions} />
        </Card>
      )}

      <div className="grid gap-4 @xl:grid-cols-2">
        {profileRows.length > 0 && (
          <Card title="Project profile">
            <dl className="space-y-2 text-sm">
              {profileRows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[8rem_1fr] gap-2">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-slate-200">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}

        {assessment.stakeholders.length > 0 && (
          <Card title="Stakeholder map">
            <ul className="space-y-2">
              {assessment.stakeholders.map((s, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium text-slate-100">{s.group}</span>
                  {!s.at_the_table && (
                    <span className="ml-2 rounded-full bg-rose-400/15 px-2 py-0.5 text-[0.65rem] text-rose-300">
                      not at the table
                    </span>
                  )}
                  {s.interest && <p className="text-slate-400">{s.interest}</p>}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {assessment.risks.length > 0 && (
        <Card title="Risk and uncertainty">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 uppercase">
                <tr>
                  <th className="pr-3 pb-2 font-medium">Risk</th>
                  <th className="pr-3 pb-2 font-medium">Likelihood</th>
                  <th className="pr-3 pb-2 font-medium">Severity</th>
                  <th className="pb-2 font-medium">Unknowns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {assessment.risks.map((r, i) => (
                  <tr key={i} className="align-top">
                    <td className="py-2 pr-3 text-slate-200">{r.risk}</td>
                    <td className={`py-2 pr-3 capitalize ${LEVEL_STYLE[r.likelihood]}`}>{r.likelihood}</td>
                    <td className={`py-2 pr-3 capitalize ${LEVEL_STYLE[r.severity]}`}>{r.severity}</td>
                    <td className="py-2 text-slate-400">{r.unknowns || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {assessment.ethics.length > 0 && (
        <Card title="Ethical reasoning">
          <div className="grid gap-3 @xl:grid-cols-2">
            {assessment.ethics.map((e, i) => (
              <div key={i} className="rounded-xl bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{e.framework}</p>
                  <span className={`text-[0.65rem] ${VERDICT_STYLE[e.leans].text}`}>
                    leans: {VERDICT_STYLE[e.leans].label.toLowerCase()}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-snug text-slate-300">{e.analysis}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(assessment.uncertainties.length > 0 || assessment.missing_information.length > 0) && (
        <div className="grid gap-4 @xl:grid-cols-2">
          {assessment.uncertainties.length > 0 && (
            <Card title="Uncertainties">
              <List items={assessment.uncertainties} />
            </Card>
          )}
          {assessment.missing_information.length > 0 && (
            <Card title="Missing information">
              <List items={assessment.missing_information} tone="text-amber-200/90" />
            </Card>
          )}
        </div>
      )}

      <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-3 pb-2 print:hidden">
        <p className="text-xs text-slate-500">
          This tool supports, and does not replace, a licensed engineer, legal advice and meaningful consultation.
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
        >
          <PrintIcon className="h-4 w-4" /> Print / Save as PDF
        </button>
      </motion.div>
    </motion.div>
  )
}

export function ResultsPlaceholder({ waiting }: { waiting: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="@container space-y-4">
      <div className="glass p-5">
        <p className="text-xs tracking-widest text-slate-400 uppercase">Recommendation</p>
        <p className="mt-2 text-sm text-slate-400">
          {waiting
            ? 'The agent is working. The side-by-side results appear here when the assessment is ready.'
            : 'Answer any questions the agent asks. Once it has enough information, the Q1, Q2 and Q3 results and the verdict appear here.'}
        </p>
      </div>
      <div className="grid gap-4 @2xl:grid-cols-3">
        {SECTIONS.map(({ key, id, title }) => (
          <div key={key} className="glass p-4">
            <p className="text-[0.65rem] font-semibold tracking-widest text-sky-300">{id}</p>
            <p className="text-sm font-semibold text-white">{title}</p>
            <div className={`mt-4 h-1.5 rounded-full ${waiting ? 'shimmer' : 'bg-white/5'}`} />
            <div className="mt-4 space-y-2">
              {[80, 95, 60].map((w) => (
                <div
                  key={w}
                  className={`h-3 rounded ${waiting ? 'shimmer' : 'bg-white/5'}`}
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
