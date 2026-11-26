// Keeps prompts/citations.json the single source of truth for the agent's law.
// Fails when the register is malformed, when a prompt file refers to a register ID that does not
// exist, or when a prompt file writes out a statute or regulation citation instead of using an ID.
// Usage: npm run citations:lint (also run by npm run build)
import { readdirSync, readFileSync } from 'node:fs'

const dir = new URL('../prompts/', import.meta.url)
const register = JSON.parse(readFileSync(new URL('citations.json', dir), 'utf8'))
const errors = []

const GROUPS = ['field', 'q1', 'q2', 'q3']
const RESULTS = ['correct', 'partly_correct', 'wrong', 'invented', 'unchecked']
const ID_SHAPE = /^[a-z][a-z0-9_]*(?:-[a-z0-9.]+)*$/

for (const [key, inst] of Object.entries(register.instruments)) {
  if (!inst.name || !inst.url) errors.push(`citations.json: instrument "${key}" needs a name and url`)
  if (!GROUPS.includes(inst.group)) errors.push(`citations.json: instrument "${key}" needs a group (${GROUPS.join(', ')})`)
}

const ids = new Set()
for (const c of register.checks) {
  if (!ID_SHAPE.test(c.id ?? '')) errors.push(`citations.json: check id "${c.id}" must be lower case, like "reg941-72-2-b"`)
  if (ids.has(c.id)) errors.push(`citations.json: duplicate check id "${c.id}"`)
  ids.add(c.id)
  if (!Object.hasOwn(register.instruments, c.instrument)) errors.push(`citations.json: check "${c.id}" names unknown instrument "${c.instrument}"`)
  // The app reads the instrument as the part of the ID before the first "-", so the ID must be exactly that.
  else if (c.id !== c.instrument && !c.id.startsWith(`${c.instrument}-`)) {
    errors.push(`citations.json: check id "${c.id}" must be "${c.instrument}" or start with "${c.instrument}-"`)
  }
  if (!RESULTS.includes(c.result)) errors.push(`citations.json: check "${c.id}" has unknown result "${c.result}"`)
  if (c.result !== 'unchecked' && !/^\d{4}-\d{2}-\d{2}$/.test(c.checked ?? '')) {
    errors.push(`citations.json: check "${c.id}" is marked ${c.result} but has no checked date (YYYY-MM-DD)`)
  }
  if (c.result !== 'unchecked' && !c.sourceSays) errors.push(`citations.json: check "${c.id}" is marked ${c.result} but sourceSays is empty`)
}

// Entries a check found wrong or invented are left out of the prompt (see registerSection in api/chat.ts).
const dropped = new Map(
  register.checks.filter((c) => c.checked && (c.result === 'wrong' || c.result === 'invented')).map((c) => [c.id, c.result]),
)

// Written-out statute and regulation citations belong in the register, not in prompt prose.
const WRITTEN_OUT = /\b(?:O\. Reg\. \d|R\.R\.O\.|R\.S\.O\.|R\.S\.C\.|S\.O\. \d{4}|S\.C\. \d{4}|SOR\/\d|\d{4} SCC \d)/

for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
  // HTML comments are removed before the prompt is sent, so they are notes for editors.
  const text = readFileSync(new URL(file, dir), 'utf8').replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
  text.split('\n').forEach((line, i) => {
    const where = `prompts/${file}:${i + 1}`
    const written = line.match(WRITTEN_OUT)
    if (written) errors.push(`${where}: "${written[0]}..." is written out; cite it by its register ID instead`)
    for (const [, token] of line.matchAll(/`"?([^`"]+)"?`/g)) {
      if (!ID_SHAPE.test(token) || !Object.hasOwn(register.instruments, token.split('-')[0])) continue
      if (!ids.has(token)) errors.push(`${where}: \`${token}\` is not a register ID`)
      else if (dropped.has(token)) errors.push(`${where}: \`${token}\` is marked ${dropped.get(token)}, so it is not sent to the agent; cite something else`)
    }
  })
}

if (errors.length > 0) {
  console.error(`Citation register check failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`)
  process.exit(1)
}
console.log(`Citation register OK: ${ids.size} checks, ${Object.keys(register.instruments).length} instruments.`)
