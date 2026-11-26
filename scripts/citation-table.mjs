// Prints the citation register (prompts/citations.json) as a Markdown citation check table.
// Usage: npm run citations:table > docs/citation-check.md
import { readFileSync } from 'node:fs'

const register = JSON.parse(readFileSync(new URL('../prompts/citations.json', import.meta.url), 'utf8'))

const LABEL = {
  correct: 'Correct',
  partly_correct: 'Partly correct',
  wrong: 'Wrong',
  invented: 'Invented',
  unchecked: 'Not checked yet',
}

const cell = (text) => String(text || '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()

const rows = register.checks.map((c) => {
  const inst = register.instruments[c.instrument]
  const section = c.provision ? (/^part\b/i.test(c.provision) ? c.provision : `s. ${c.provision}`) : ''
  // Same as registerCitation in src/lib/citationCheck.ts: a name ending in its enacting section gets it in brackets.
  const enacted = section && inst.name.match(/^([^,]+), (.*, s\. [\d.]+)$/)
  const label = !section ? inst.name : enacted ? `${enacted[1]} (${enacted[2]}), ${section}` : `${inst.name}, ${section}`
  // Same rule as the app: a result counts only if it is a known one and has a checked date.
  const confirmed = c.result in LABEL && c.result !== 'unchecked' && Boolean(c.checked)
  return {
    citation: `[${label}](${inst.url})`,
    claim: c.claim,
    source: confirmed ? c.sourceSays : `_Not yet checked against the official source._${c.note ? ` To check: ${c.note}` : ''}`,
    result: confirmed ? `${LABEL[c.result]} (${c.checked})` : LABEL.unchecked,
    unchecked: !confirmed,
  }
})

const counts = rows.reduce((acc, r) => {
  const key = r.result.replace(/ \(.*\)$/, '')
  acc[key] = (acc[key] || 0) + 1
  return acc
}, {})

console.log('# Citation check table\n')
console.log(
  'Each act, regulation, section and case in the agent\'s citation register, with the result of checking it against Ontario e-Laws, the federal Justice Laws Website, the Supreme Court of Canada, PEO or Engineers Canada. The result rates the citation as the agent was told it, not the agent\'s reasoning about a project. This table records each original check. For a partly correct row, the claim column is the wording first used; the agent is now given what the source says instead, so the app shows citations of that entry as correct. Rows marked "Not checked yet" have not been confirmed and must not be presented as correct. Generated from `prompts/citations.json` by `npm run citations:table`; edit the register, not this file.\n',
)
console.log(Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(' · ') + '\n')
console.log('| Citation | What the agent claims | What the source actually says | Result |')
console.log('| --- | --- | --- | --- |')
for (const r of rows) console.log(`| ${cell(r.citation)} | ${cell(r.claim)} | ${cell(r.source)} | ${cell(r.result)} |`)
