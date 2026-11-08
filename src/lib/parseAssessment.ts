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
    rating: oneOf<Rating>(o.rating, ['pass', 'conditional', 'fail', 'unknown'], 'unknown'),
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

export function normalizeAssessment(raw: unknown): Assessment | null {
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

export function splitMessage(content: string): SplitMessage {
  for (const match of content.matchAll(CLOSED_BLOCK)) {
    const [block, lang, body] = match
    let parsed: unknown
    try {
      parsed = JSON.parse(body)
    } catch {
      if (lang === 'assessment') {
        return { text: content.replace(block, '').trim(), assessment: null, pending: false, invalid: true }
      }
      continue
    }
    const assessment = normalizeAssessment(parsed)
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
