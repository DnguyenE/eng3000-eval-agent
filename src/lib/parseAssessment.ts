import type { Assessment, Finding, Level, Rating, SectionResult, Severity, Verdict } from '../types'

export interface SplitMessage {
  text: string
  assessment: Assessment | null
  /** The assessment block has started streaming but is not finished yet. */
  pending: boolean
  /** A complete block was found but could not be parsed. */
  invalid: boolean
}

const CLOSED_BLOCK = /```(assessment|json)[^\n]*\n([\s\S]*?)```/g
const OPEN_BLOCK = /```assessment/

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : fallback

const strList = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : [])

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  const s = str(v).toLowerCase().replace(/\s+/g, '_') as T
  return allowed.includes(s) ? s : fallback
}

const objList = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object') : []

const LEVELS = ['low', 'medium', 'high'] as const
const VERDICTS = ['proceed', 'proceed_with_conditions', 'do_not_proceed'] as const

function section(v: unknown): SectionResult {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
  const rawScore = typeof o.score === 'number' ? o.score : Number.parseFloat(str(o.score))
  const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(3, Math.round(rawScore))) : null
  return {
    score,
    // 'conditional' was the old name for 'concern'; keep reading it from earlier replies.
    rating: oneOf<Rating>(str(o.rating).toLowerCase() === 'conditional' ? 'concern' : o.rating, ['pass', 'concern', 'fail', 'unknown'], 'unknown'),
    summary: str(o.summary),
    findings: objList(o.findings).map(
      (f): Finding => ({
        issue: str(f.issue),
        citation: str(f.citation, 'No citation given'),
        severity: oneOf<Severity>(f.severity, ['critical', 'major', 'minor', 'positive'], 'minor'),
        confidence: oneOf<Level>(f.confidence, LEVELS, 'medium'),
      }),
    ),
  }
}

/**
 * Fixes the JSON mistakes models commonly make: comments, trailing commas, and raw
 * line breaks or tabs inside strings. Valid JSON passes through unchanged.
 */
export function repairJson(input: string): string {
  let out = ''
  let inString = false
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (inString) {
      if (ch === '\\') {
        out += ch + (input[++i] ?? '')
      } else if (ch === '"') {
        inString = false
        out += ch
      } else if (ch === '\n') out += '\\n'
      else if (ch === '\r') out += '\\r'
      else if (ch === '\t') out += '\\t'
      else out += ch
      continue
    }
    if (ch === '"') {
      inString = true
      out += ch
    } else if (ch === '/' && input[i + 1] === '/') {
      while (i < input.length && input[i] !== '\n') i++
      out += '\n'
    } else if (ch === '/' && input[i + 1] === '*') {
      const end = input.indexOf('*/', i + 2)
      i = end === -1 ? input.length : end + 1
    } else if (ch === '}' || ch === ']') {
      out = out.replace(/,\s*$/, '') + ch
    } else out += ch
  }
  return out
}

function parseLenient(body: string): unknown {
  try {
    return JSON.parse(body)
  } catch (strictError) {
    try {
      return JSON.parse(repairJson(body))
    } catch {
      throw strictError
    }
  }
}

/** Accepts the report itself, or the report wrapped in one outer key such as { "assessment": {...} }. */
function unwrap(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || 'verdict' in raw) return raw
  const values = Object.values(raw)
  return values.length === 1 ? values[0] : raw
}

export function normalizeAssessment(raw: unknown): Assessment | null {
  raw = unwrap(raw)
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (!('verdict' in o) || !('q1' in o || 'q2' in o || 'q3' in o)) return null
  const profile = (o.project_profile && typeof o.project_profile === 'object' ? o.project_profile : {}) as Record<
    string,
    unknown
  >

  return {
    project_profile: {
      name: str(profile.name, 'Untitled project'),
      summary: str(profile.summary),
      location: str(profile.location),
      disciplines: strList(profile.disciplines),
      phase: str(profile.phase),
      decision_makers: strList(profile.decision_makers),
    },
    stakeholders: objList(o.stakeholders).map((s) => ({
      group: str(s.group),
      interest: str(s.interest),
      at_the_table: s.at_the_table !== false,
    })),
    q1: section(o.q1),
    q2: section(o.q2),
    q3: section(o.q3),
    risks: objList(o.risks).map((r) => ({
      risk: str(r.risk),
      likelihood: oneOf<Level>(r.likelihood, LEVELS, 'medium'),
      severity: oneOf<Level | 'critical'>(r.severity, [...LEVELS, 'critical'], 'medium'),
      unknowns: str(r.unknowns),
    })),
    ethics: objList(o.ethics).map((e) => ({
      framework: str(e.framework),
      analysis: str(e.analysis),
      leans: oneOf<Verdict>(e.leans, VERDICTS, 'proceed_with_conditions'),
    })),
    conflicts: objList(o.conflicts).map((c) => ({ between: str(c.between), description: str(c.description) })),
    decision_rule_applied: str(o.decision_rule_applied),
    verdict: oneOf<Verdict>(o.verdict, VERDICTS, 'proceed_with_conditions'),
    conditions: strList(o.conditions),
    uncertainties: strList(o.uncertainties),
    missing_information: strList(o.missing_information),
  }
}

const warned = new Set<string>()
function warnOnce(body: string, ...args: unknown[]): void {
  if (warned.has(body)) return
  warned.add(body)
  console.warn('[assessment]', ...args)
}

export function splitMessage(content: string): SplitMessage {
  for (const match of content.matchAll(CLOSED_BLOCK)) {
    const [block, lang, body] = match
    let parsed: unknown
    try {
      parsed = parseLenient(body)
    } catch (err) {
      if (lang === 'assessment') {
        warnOnce(body, 'Could not parse the report block:', (err as Error).message, '\n', body)
        return { text: content.replace(block, '').trim(), assessment: null, pending: false, invalid: true }
      }
      continue
    }
    const assessment = normalizeAssessment(parsed)
    if (!assessment && lang === 'assessment') {
      warnOnce(body, 'Report block is valid JSON but missing "verdict" or q1-q3:', parsed)
    }
    if (assessment || lang === 'assessment') {
      return { text: content.replace(block, '').trim(), assessment, pending: false, invalid: !assessment }
    }
  }

  const open = content.search(OPEN_BLOCK)
  if (open !== -1) {
    return { text: content.slice(0, open).trim(), assessment: null, pending: true, invalid: false }
  }
  return { text: content, assessment: null, pending: false, invalid: false }
}
