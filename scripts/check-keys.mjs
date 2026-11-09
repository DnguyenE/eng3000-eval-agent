// Verifies the API keys in .env.local by making one tiny request per configured model.
// Usage: npm run check:keys
import { existsSync } from 'node:fs'

if (existsSync('.env.local')) process.loadEnvFile('.env.local')
else if (existsSync('.env')) process.loadEnvFile('.env')

const providers = [
  {
    name: 'Groq',
    key: process.env.GROQ_API_KEY,
    models: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    url: 'https://api.groq.com/openai/v1/chat/completions',
  },
  {
    name: 'Gemini',
    key: process.env.GEMINI_API_KEY,
    models: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  },
]

let working = 0
for (const provider of providers) {
  if (!provider.key) {
    console.log(`-  ${provider.name}: no key set (skipped)`)
    continue
  }
  for (const model of provider.models.split(',').map((m) => m.trim()).filter(Boolean)) {
    try {
      const res = await fetch(provider.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.key}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Say OK.' }], max_tokens: 5 }),
      })
      if (res.ok) {
        working++
        console.log(`OK ${provider.name} ${model}`)
      } else {
        const detail = (await res.text().catch(() => '')).slice(0, 200).replace(/\s+/g, ' ')
        console.log(`X  ${provider.name} ${model}: HTTP ${res.status} ${detail}`)
      }
    } catch (err) {
      console.log(`X  ${provider.name} ${model}: ${err.message}`)
    }
  }
}

if (working === 0) {
  console.error('\nNo working provider. Add a valid GROQ_API_KEY or GEMINI_API_KEY to .env.local.')
  process.exit(1)
}
console.log(`\n${working} working model(s). You're ready to run npm run dev.`)
