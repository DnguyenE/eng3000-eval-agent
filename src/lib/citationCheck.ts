import register from '../../prompts/citations.json'
import type { Assessment } from '../types'

export type CheckResult = 'correct' | 'partly_correct' | 'wrong' | 'invented' | 'unchecked'

interface Instrument {
  name: string
  url: string
}

interface RegisterCheck {
  id: string
  instrument: string
  provision: string | null
  claim: string
  sourceSays: string
  result: CheckResult
  checked: string
}

export interface CitationCheck {
  /** The register ID, or the agent's own text for a citation that is not in the register. */
  key: string
  /** The citation as shown to the reader: the register's wording, or the agent's own text. */
  citation: string
  /** True when the citation is a register entry. */
  inRegister: boolean
  /** What the agent said in this assessment when it relied on the citation. */
  agentClaimed: string
  /** What the official source says, from the register. Empty when nobody has checked it. */
  sourceSays: string
  result: CheckResult
  /** Why the result is what it is, when it is not a plain lookup of a checked entry. */
  note: string
  sourceUrl: string | null
  checked: string
}

const instruments = register.instruments as Record<string, Instrument>
const registerChecks = register.checks as RegisterCheck[]

const RESULTS: readonly CheckResult[] = ['correct', 'partly_correct', 'wrong', 'invented', 'unchecked']

/** The whole citation is the agent saying it found no legal basis, so it is not a citation. */
// It must start the text, so "No specific legal basis found (a by-law may apply)" counts but
// "Planning Act (no specific legal basis for the setback)" is still a citation.
const NO_BASIS = /^\s*(?:no (?:specific )?legal basis|no citation given)\b|^\s*(?:n\/a|none)\.?\s*$/i

/** A register ID is written in lower case, e.g. "reg941-72-2-b"; "NPC-300" or "EPA" are citations, not IDs. */
const ID_SHAPE = /^[a-z][a-z0-9_]*(?:-[a-z0-9.]+)*$/

export function isNoLegalBasis(text: string): boolean {
  return !text.trim() || NO_BASIS.test(text)
}

function provisionLabel(provision: string): string {
  return /^part\b/i.test(provision) ? provision : `s. ${provision}`
}

/** The register's wording for a check, e.g. "Professional Engineers Act, R.S.O. 1990, c. P.28, s. 12". */
export function registerCitation(check: { instrument: string; provision: string | null }): string {
  const name = instruments[check.instrument]?.name ?? check.instrument
  if (!check.provision) return name
  // "Impact Assessment Act, S.C. 2019, c. 28, s. 1" already ends in the section that enacted it.
  const enacted = name.match(/^([^,]+), (.*, s\. [\d.]+)$/)
  return enacted
    ? `${enacted[1]} (${enacted[2]}), ${provisionLabel(check.provision)}`
    : `${name}, ${provisionLabel(check.provision)}`
}

/** Case, spacing, dashes and a trailing full stop do not change which citation a text names. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[‐-―]/g, '-').replace(/\s+/g, ' ').replace(/\.$/, '').trim()
}

const byId = new Map(registerChecks.map((c) => [c.id.toLowerCase(), c]))
// Exact wording only: a written-out citation matches an entry when it is word for word the register's citation.
const byWording = new Map(registerChecks.map((c) => [normalize(registerCitation(c)), c]))

/**
 * The result as the reader should see it. A result only counts once someone has recorded the date
 * they checked it. A partly correct entry is sent to the agent as what the source actually says
 * (see registerSection in api/chat.ts), so what the agent was given is correct.
 */
function liveResult(c: RegisterCheck): { result: CheckResult; note: string } {
  if (!RESULTS.includes(c.result) || c.result === 'unchecked' || !c.checked) {
    return { result: 'unchecked', note: 'In the register but not yet checked against the official source.' }
  }
  if (c.result === 'partly_correct') {
    return {
      result: 'correct',
      note: 'The wording this project first used was only partly correct, so the agent is now given what the source says.',
    }
  }
  return { result: c.result, note: '' }
}

function registerRow(check: RegisterCheck, agentClaimed: string, note = ''): CitationCheck {
  const live = liveResult(check)
  const confirmed = live.result !== 'unchecked'
  return {
    key: check.id,
    citation: registerCitation(check),
    inRegister: true,
    agentClaimed,
    sourceSays: confirmed ? check.sourceSays : '',
    result: live.result,
    note: [note, live.note].filter(Boolean).join(' '),
    sourceUrl: instruments[check.instrument]?.url ?? null,
    checked: confirmed ? check.checked : '',
  }
}

/** For an ID such as "sor2022_110-2-1-a", the nearest register entry for a section that contains it ("sor2022_110-2-1"). */
function sectionParent(id: string): RegisterCheck | undefined {
  for (let parts = id.split('-').slice(0, -1); parts.length > 1; parts = parts.slice(0, -1)) {
    const check = byId.get(parts.join('-'))
    if (check?.provision) return check
  }
  return undefined
}

/** Looks up one entry of a finding's `citations` list. Returns null when it says no legal basis was found. */
export function checkCitation(raw: string, agentClaimed: string): CitationCheck | null {
  const text = raw.trim().replace(/^[`'"]+|[`'"]+$/g, '').replace(/[.,;:]+$/, '')
  if (isNoLegalBasis(text)) return null

  // IDs are lower case, so "ESA" (the Electrical Safety Authority) never resolves to the `esa` entry.
  // A section ID such as "CA1982-35" is still recognised in capitals: abbreviations have no dash.
  // "reg941-72(2)(b)" is the ID reg941-72-2-b written with the section's brackets.
  const idText = /\s/.test(text) ? text : text.replace(/\(([^()\s]+)\)/g, '-$1')
  const isId = ID_SHAPE.test(idText) || (idText.includes('-') && ID_SHAPE.test(idText.toLowerCase()))
  const id = isId ? idText.toLowerCase() : ''
  const byIdMatch = isId ? byId.get(id) : undefined
  if (byIdMatch) return registerRow(byIdMatch, agentClaimed)

  const byWordingMatch = byWording.get(normalize(text))
  if (byWordingMatch) return registerRow(byWordingMatch, agentClaimed)

  // Text rows get their own key space, so a text "esa" never merges with the `esa` register row.
  const base = { key: `text:${normalize(text)}`, citation: text, inRegister: false, agentClaimed, checked: '' }

  if (isId && Object.hasOwn(instruments, id.split('-')[0])) {
    const parent = sectionParent(id)
    if (parent) {
      const confirmed = liveResult(parent).result !== 'unchecked'
      return {
        ...base,
        sourceSays: confirmed ? parent.sourceSays : '',
        result: 'unchecked',
        note: confirmed
          ? `${registerCitation(parent)} was checked (text shown), but this part of it was not. Confirm it before relying on it.`
          : `Not in the register. The nearest entry, ${registerCitation(parent)}, has not been checked yet either.`,
        sourceUrl: instruments[parent.instrument]?.url ?? null,
      }
    }
    // The act is real but this part of it has no entry. The app cannot tell an unlisted section from a
    // made-up one, so it is shown as not checked, never as invented: only a person checking the source decides that.
    const key = id.split('-')[0]
    const inst = instruments[key]
    const wholeAct = id === key
    return {
      ...base,
      citation: wholeAct ? inst.name : text,
      sourceSays: '',
      result: 'unchecked',
      note: wholeAct
        ? `${inst.name} is in the register, but only specific sections of it are listed, so the act as a whole has not been checked.`
        : `${inst.name} is in the register, but this section is not, so it has not been checked. Confirm the section exists and says what the agent claims before relying on it.`,
      sourceUrl: inst.url,
    }
  }

  return {
    ...base,
    sourceSays: '',
    result: 'unchecked',
    note: 'Not in the citation register, so it has not been checked. Look it up on e-Laws, Justice Laws or the body that publishes it before relying on it.',
    sourceUrl: null,
  }
}

/** A finding's citations, checked, with repeats removed. */
export function checkCitations(citations: string[], agentClaimed: string): CitationCheck[] {
  const rows = new Map<string, CitationCheck>()
  for (const c of citations) {
    const row = checkCitation(c, agentClaimed)
    if (row && !rows.has(row.key)) rows.set(row.key, row)
  }
  return [...rows.values()]
}

/** Every citation in an assessment's findings, checked, with repeats merged. */
export function checkAssessment(assessment: Assessment): CitationCheck[] {
  const rows = new Map<string, { row: CitationCheck; claims: Set<string> }>()
  for (const key of ['q1', 'q2', 'q3'] as const) {
    for (const finding of assessment[key].findings) {
      for (const row of checkCitations(finding.citations, finding.issue)) {
        const existing = rows.get(row.key)
        if (existing) existing.claims.add(row.agentClaimed)
        else rows.set(row.key, { row, claims: new Set([row.agentClaimed]) })
      }
    }
  }
  return [...rows.values()].map(({ row, claims }) => ({ ...row, agentClaimed: [...claims].filter(Boolean).join(' / ') }))
}

export const RESULT_LABEL: Record<CheckResult, string> = {
  correct: 'Correct',
  partly_correct: 'Partly correct',
  wrong: 'Wrong',
  invented: 'Invented',
  unchecked: 'Not checked',
}
