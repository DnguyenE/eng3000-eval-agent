import register from '../config/citations.json'
import type { Assessment } from '../types'

export type CheckResult = 'correct' | 'partly_correct' | 'wrong' | 'invented' | 'unchecked'

interface Instrument {
  name: string
  url: string
  aliases: string[]
}

interface RegisterCheck {
  instrument: string
  provision: string | null
  claim: string
  sourceSays: string
  result: CheckResult
  checked: string
}

export interface CitationCheck {
  /** The citation as the agent wrote it, narrowed to one instrument and provision. */
  citation: string
  /** What the agent said in this assessment when it relied on the citation. */
  agentClaimed: string
  /** What the official source says, from the register. Empty when nobody has checked it. */
  sourceSays: string
  result: CheckResult
  /** Why the result is what it is, when it is not a plain match against a checked entry. */
  note: string
  instrument: string | null
  sourceUrl: string | null
  checked: string
}

const instruments = register.instruments as Record<string, Instrument>
const checks = register.checks as RegisterCheck[]

const RESULTS: readonly CheckResult[] = ['correct', 'partly_correct', 'wrong', 'invented', 'unchecked']

const aliasPatterns = Object.entries(instruments).flatMap(([id, inst]) =>
  inst.aliases.map((alias) => ({ id, re: new RegExp(alias, 'gi') })),
)

/** Text the agent writes when it found no legal basis; it is not a citation. */
const NO_BASIS = /no (specific )?legal basis|no citation given|^\s*(n\/a|none)\s*$/i

const FIRST_SECTION = String.raw`\d+(?:\.\d+)*(?:\s*\([0-9a-z.]+\))*`
const NEXT_SECTION = String.raw`(?:${FIRST_SECTION}|\([0-9a-z.]+\))`
const SECTION = new RegExp(
  String.raw`\b(?:ss?\.|sections?|subsections?)\s*(${FIRST_SECTION}(?:\s*(?:,|and|&|to)\s*${NEXT_SECTION})*)`,
  'gi',
)
const PART = /\bPart\s+([IVXL]+(?:\.\d+)?|\d+(?:\.\d+)?)\b/gi

function normalizeProvision(p: string): string {
  return p.replace(/\s+/g, '').replace(/^(?:ss?\.|section)/i, '').toLowerCase()
}

function provisionsIn(text: string): string[] {
  const found: string[] = []
  for (const m of text.matchAll(SECTION)) {
    let previous = ''
    for (const part of m[1].split(/\s*(?:,|and|&|to)\s*/)) {
      if (!part.trim()) continue
      // "s. 72(2)(e) and (h)": a bare clause continues the provision before it.
      const full = part.trim().startsWith('(') ? previous.replace(/\([^()]*\)$/, '') + part : part
      previous = normalizeProvision(full)
      found.push(previous)
    }
  }
  for (const m of text.matchAll(PART)) found.push(`part${m[1].toLowerCase()}`)
  return found
}

interface Segment {
  instrument: string
  /** The name the agent used for the instrument, such as "O. Reg. 941". */
  alias: string
  text: string
}

/** Splits a citation string into one segment per instrument it names, in order. */
function segments(citation: string): Segment[] {
  const hits: { id: string; start: number; end: number }[] = []
  for (const { id, re } of aliasPatterns) {
    re.lastIndex = 0
    for (const m of citation.matchAll(re)) {
      // "(under the Occupational Health and Safety Act)" names the parent act, not a separate citation.
      if (/\bunder (?:the )?$/i.test(citation.slice(0, m.index))) continue
      hits.push({ id, start: m.index, end: m.index + m[0].length })
    }
  }
  hits.sort((a, b) => a.start - b.start || b.end - a.end)
  const kept: typeof hits = []
  for (const hit of hits) {
    const last = kept[kept.length - 1]
    if (last && hit.start < last.end) continue
    kept.push(hit)
  }

  const out: Segment[] = []
  kept.forEach((hit, i) => {
    const text = citation.slice(hit.start, kept[i + 1]?.start ?? citation.length)
    const prev = out[out.length - 1]
    // "Ontario Building Code, O. Reg. 332/12, Part 6" names one instrument twice.
    if (prev && prev.instrument === hit.id) prev.text += text
    else out.push({ instrument: hit.id, alias: citation.slice(hit.start, hit.end), text })
  })
  return out
}

function findCheck(instrument: string, provision: string | null): RegisterCheck | undefined {
  return checks.find(
    (c) => c.instrument === instrument && (c.provision === null ? provision === null : normalizeProvision(c.provision) === provision),
  )
}

function tidy(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/(?:[\s,;:(]|\b(?:and|or|read with|see|also)\b)+$/i, '')
    .replace(/^[\s,;:)]+/, '')
}

function provisionLabel(provision: string): string {
  return provision.startsWith('part') ? `Part ${provision.slice(4).toUpperCase()}` : `s. ${provision}`
}

/** The nearest checked provision that contains this one, e.g. s. 7 for s. 7(a). */
function findParent(instrument: string, provision: string): RegisterCheck | undefined {
  for (let p = provision.replace(/\([^()]*\)$/, ''); p && p !== provision; provision = p, p = p.replace(/\([^()]*\)$/, '')) {
    const check = findCheck(instrument, p)
    if (check && resultOf(check) !== 'unchecked') return check
  }
  return undefined
}

function resultOf(c: RegisterCheck | undefined): CheckResult {
  return c && RESULTS.includes(c.result) && (c.result === 'unchecked' || c.checked) ? c.result : 'unchecked'
}

/** Checks one citation string from a finding against the register. Returns one row per instrument and provision. */
export function checkCitation(citation: string, agentClaimed: string): CitationCheck[] {
  if (!citation.trim() || NO_BASIS.test(citation)) return []

  const segs = segments(citation)
  if (segs.length === 0) {
    return [
      {
        citation: tidy(citation),
        agentClaimed,
        sourceSays: '',
        result: 'unchecked',
        note: 'Not in the citation register. Look it up on e-Laws or Justice Laws; if it cannot be found, treat it as invented.',
        instrument: null,
        sourceUrl: null,
        checked: '',
      },
    ]
  }

  return segs.flatMap(({ instrument, alias, text }) => {
    const inst = instruments[instrument]
    // An act enacted by a section of another statute ("S.C. 2019, c. 28, s. 1") has that section in its own name.
    const enactedBy = inst.name.match(/c\. [^,]+, s\. \d+$/)?.[0]
    const provisions = provisionsIn(enactedBy ? text.replace(enactedBy, '') : text)
    const targets = provisions.length > 0 ? provisions : [null]
    const actCheck = findCheck(instrument, null)

    return targets.map((provision): CitationCheck => {
      const check = findCheck(instrument, provision)
      const label = provisions.length > 1 && provision ? `${alias}, ${provisionLabel(provision)}` : tidy(text)
      const base = { citation: label, agentClaimed, instrument: inst.name, sourceUrl: inst.url }

      if (check) {
        const result = resultOf(check)
        return {
          ...base,
          sourceSays: result === 'unchecked' ? '' : check.sourceSays,
          result,
          note: result === 'unchecked' ? 'In the register but not yet checked against the official source.' : '',
          checked: result === 'unchecked' ? '' : check.checked,
        }
      }

      const parent = provision ? findParent(instrument, provision) : undefined
      if (parent?.provision) {
        return {
          ...base,
          sourceSays: parent.sourceSays,
          result: 'unchecked',
          note: `${provisionLabel(normalizeProvision(parent.provision))} was checked (text shown), but this part of it was not. Confirm it before relying on it.`,
          checked: '',
        }
      }

      const actResult = resultOf(actCheck)
      return {
        ...base,
        sourceSays: actResult === 'unchecked' || !actCheck ? '' : actCheck.sourceSays,
        result: 'unchecked',
        note:
          provision === null
            ? 'The instrument is in the register but has not been checked yet.'
            : actResult === 'unchecked'
              ? 'This section has not been checked against the official source.'
              : 'The instrument was checked, but this section was not. Confirm the section number before relying on it.',
        checked: '',
      }
    })
  })
}

/** Every citation in an assessment's findings, checked, with duplicates merged. */
export function checkAssessment(assessment: Assessment): CitationCheck[] {
  const rows = new Map<string, CitationCheck>()
  for (const key of ['q1', 'q2', 'q3'] as const) {
    for (const finding of assessment[key].findings) {
      for (const row of checkCitation(finding.citation, finding.issue)) {
        const id = `${row.instrument ?? ''}|${row.citation.toLowerCase()}`
        const existing = rows.get(id)
        if (existing) {
          if (!existing.agentClaimed.includes(row.agentClaimed)) existing.agentClaimed += ` / ${row.agentClaimed}`
        } else rows.set(id, row)
      }
    }
  }
  return [...rows.values()]
}

/** The worst result among a finding's citations, for the badge next to it. */
export function worstResult(rows: CitationCheck[]): CheckResult | null {
  if (rows.length === 0) return null
  const order: CheckResult[] = ['invented', 'wrong', 'unchecked', 'partly_correct', 'correct']
  return order.find((r) => rows.some((row) => row.result === r)) ?? null
}

export const RESULT_LABEL: Record<CheckResult, string> = {
  correct: 'Correct',
  partly_correct: 'Partly correct',
  wrong: 'Wrong',
  invented: 'Invented',
  unchecked: 'Not checked',
}
