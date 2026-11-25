// Prints the citation register (src/config/citations.json) as a Markdown citation check table.
// Usage: npm run citations:table > docs/citation-check.md
import { readFileSync } from 'node:fs'

const register = JSON.parse(readFileSync(new URL('../src/config/citations.json', import.meta.url), 'utf8'))

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
  const provision = c.provision ? (c.provision.startsWith('Part') ? `, ${c.provision}` : `, s. ${c.provision}`) : ''
  const confirmed = c.result !== 'unchecked' && c.checked
  return {
    citation: `[${inst.name}${provision}](${inst.url})`,
    claim: c.claim,
    source: confirmed ? c.sourceSays : '_Not yet checked against the official source._',
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
  'Each act, regulation, section and case the agent is given in `prompts/discipline.md`, with the result of checking it against Ontario e-Laws, the federal Justice Laws Website, the Supreme Court of Canada, PEO or Engineers Canada. Rows marked "Not checked yet" have not been confirmed and must not be presented as correct. Generated from `src/config/citations.json` by `npm run citations:table`; edit the register, not this file.\n',
)
console.log(Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(' · ') + '\n')
console.log('| Citation | What the agent claims | What the source actually says | Result |')
console.log('| --- | --- | --- | --- |')
for (const r of rows) console.log(`| ${cell(r.citation)} | ${cell(r.claim)} | ${cell(r.source)} | ${cell(r.result)} |`)
