import { RESULT_LABEL, type CheckResult, type CitationCheck } from './citationCheck'

export interface CitationExport {
  projectName: string
  verdictLabel: string
  rows: CitationCheck[]
  date?: Date
}

const ABOUT =
  "Every citation in the assessment, compared with the official source as recorded in the project's citation register. Citations the agent gave that are not in the register are listed too, so they can be checked by hand. The result rates the citation (that the provision exists and says what the source column shows), not the agent's reasoning about the project."

function counts(rows: CitationCheck[]): string {
  const order = Object.keys(RESULT_LABEL) as CheckResult[]
  return order
    .map((result) => [RESULT_LABEL[result], rows.filter((r) => r.result === result).length] as const)
    .filter(([, n]) => n > 0)
    .map(([label, n]) => `${label}: ${n}`)
    .join(' · ')
}

function warning(rows: CitationCheck[]): string {
  const unconfirmed = rows.filter((r) => r.result !== 'correct').length
  return unconfirmed > 0
    ? `${unconfirmed} of ${rows.length} are not confirmed correct: check them at the linked source before relying on them.`
    : ''
}

function savedAt(date: Date): string {
  return `${date.toISOString()} (${date.toLocaleString()})`
}

function resultText(r: CitationCheck): string {
  return r.checked ? `${RESULT_LABEL[r.result]} (checked ${r.checked})` : RESULT_LABEL[r.result]
}

const mdCell = (text: string) => text.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()

export function citationMarkdown({ projectName, verdictLabel, rows, date = new Date() }: CitationExport): string {
  const lines = [
    `# Citation check: ${projectName || 'Untitled project'}`,
    '',
    `- Saved: ${savedAt(date)}`,
    `- Verdict: ${verdictLabel}`,
    `- Results: ${counts(rows)}`,
    '',
    ABOUT,
  ]
  const warn = warning(rows)
  if (warn) lines.push('', `**${warn}**`)
  lines.push('', '| Citation | What the agent claimed | What the source says | Result |', '| --- | --- | --- | --- |')
  for (const r of rows) {
    const label = r.citation.replace(/([[\]])/g, '\\$1')
    const citation = r.sourceUrl ? `[${label}](${r.sourceUrl})` : label
    const source = [r.sourceSays || '_Not yet checked._', r.note].filter(Boolean).join(' ')
    lines.push(`| ${[citation, r.agentClaimed, source, resultText(r)].map(mdCell).join(' | ')} |`)
  }
  return lines.join('\n') + '\n'
}

// A leading =, +, - or @ makes spreadsheet apps treat agent text as a formula.
function csvCell(text: string): string {
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

export function citationCsv({ projectName, verdictLabel, rows, date = new Date() }: CitationExport): string {
  const records: string[][] = [
    ['Project', projectName || 'Untitled project'],
    ['Saved', savedAt(date)],
    ['Verdict', verdictLabel],
    ['Results', counts(rows)],
  ]
  const warn = warning(rows)
  if (warn) records.push(['Warning', warn])
  records.push(
    [],
    ['Citation', 'Source link', 'What the agent claimed', 'What the source says', 'Note', 'Result', 'Checked'],
    ...rows.map((r) => [
      r.citation,
      r.sourceUrl ?? '',
      r.agentClaimed,
      r.sourceSays || 'Not yet checked.',
      r.note,
      RESULT_LABEL[r.result],
      r.checked,
    ]),
  )
  // The byte order mark makes Excel read the file as UTF-8 (section signs, accents and curly quotes).
  return '\uFEFF' + records.map((cells) => cells.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

export function citationFilename(projectName: string, extension: 'md' | 'csv', date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const slug =
    projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50)
      .replace(/-+$/, '') || 'assessment'
  return `citation-check-${slug}-${day}-${pad(date.getHours())}${pad(date.getMinutes())}.${extension}`
}
