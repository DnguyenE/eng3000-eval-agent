import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PROMPT_FILES = ['system-prompt.md', 'discipline.md', 'citations.json', 'decision-rule.md', 'report-format.md']

const MAX_MESSAGES = 20
const MAX_MESSAGE_CHARS = 8_000
const MAX_TOTAL_CHARS = 40_000
const MAX_OUTPUT_TOKENS = 4_096
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 20

type Role = 'user' | 'assistant'

interface ChatMessage {
  role: Role
  content: string
}

interface Provider {
  name: string
  url: string
  apiKey: string
  model: string
  extraBody?: Record<string, unknown>
}

interface RegisterCheck {
  id: string
  instrument: string
  provision: string | null
  claim: string
  sourceSays: string
  result: string
  checked: string
  uncertain?: boolean
}

interface CitationRegister {
  instruments: Record<string, { name: string; group: string; use?: string }>
  checks: RegisterCheck[]
}

/** Headings for each instrument `group` in prompts/citations.json, in the order they are shown. */
const REGISTER_GROUPS: Record<string, string> = {
  field: 'Field-specific provisions',
  q1: 'Q1 baseline: Ontario professional engineering obligations',
  q2: 'Q2 baseline: law of the land',
  q3: 'Q3 baseline: law on Indigenous rights and relationships with land',
}

function registerLine(c: RegisterCheck): string {
  const provision = !c.provision ? 'whole instrument' : /^(?:part|div)\b/i.test(c.provision) ? c.provision : `s. ${c.provision}`
  // A partly correct claim is replaced by what the source actually says.
  const summary = c.checked && c.result === 'partly_correct' ? c.sourceSays : c.claim
  const caution = c.uncertain ? ' (number not confirmed: give low or medium confidence and say it should be checked)' : ''
  return `- \`${c.id}\` (${provision}): ${summary}${caution}`
}

/**
 * The citation register as the list of law the model works from and cites by ID. It is the only
 * place provisions are listed. Entries a check found wrong or invented are left out; for partly
 * correct ones the model is given what the source actually says.
 */
export function registerSection(json: string): string {
  const register = JSON.parse(json) as CitationRegister
  const byInstrument = new Map<string, RegisterCheck[]>()
  for (const c of register.checks) {
    if (c.checked && (c.result === 'wrong' || c.result === 'invented')) continue
    byInstrument.set(c.instrument, [...(byInstrument.get(c.instrument) ?? []), c])
  }
  const lines: string[] = []
  for (const [group, heading] of Object.entries(REGISTER_GROUPS)) {
    const instruments = Object.entries(register.instruments).filter(([id, inst]) => inst.group === group && byInstrument.has(id))
    if (instruments.length === 0) continue
    lines.push('', `## ${heading}`)
    for (const [id, inst] of instruments) {
      lines.push('', `**${inst.name}**${inst.use ? `: ${inst.use}` : ''}`)
      for (const c of byInstrument.get(id) ?? []) lines.push(registerLine(c))
    }
  }
  return [
    '# Citation register',
    '',
    'These are the acts, regulations, sections and cases to assess projects against, and the ones the app can check against the official source. Cite one by giving its ID, exactly as written, in a finding\'s `citations` list. Use an ID only when it names exactly the provision you rely on (an ID without a section means the instrument as a whole). Anything else you rely on, such as a municipal by-law, a CSA standard, a case, a different section of a listed act or a law not listed here, goes in `citations` as the full written citation instead. Never make up an ID.',
    ...lines,
  ].join('\n')
}

let cachedPrompt: string | undefined

export function buildSystemPrompt(): string {
  if (cachedPrompt && process.env.VERCEL) return cachedPrompt
  const dir = join(process.cwd(), 'prompts')
  cachedPrompt = PROMPT_FILES.map((file) => {
    const text = readFileSync(join(dir, file), 'utf8')
    return file.endsWith('.json') ? registerSection(text) : text.replace(/<!--[\s\S]*?-->/g, '').trim()
  }).join('\n\n---\n\n')
  return cachedPrompt
}

function modelList(value: string | undefined, fallback: string): string[] {
  return (value || fallback)
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean)
}

function configuredProviders(): Provider[] {
  const providers: Provider[] = []
  const groqKey = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY

  if (groqKey) {
    for (const model of modelList(process.env.GROQ_MODEL, 'openai/gpt-oss-120b,qwen/qwen3.8-27b')) {
      providers.push({
        name: 'Groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: groqKey,
        model,
      })
    }
  }

  if (geminiKey) {
    for (const model of modelList(process.env.GEMINI_MODEL, 'gemini-3.5-flash,gemini-3.5-flash-lite')) {
      providers.push({
        name: 'Gemini',
        url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        apiKey: geminiKey,
        model,
        // Gemini counts thinking tokens against max_tokens, which can truncate the JSON report.
        extraBody: { reasoning_effort: 'low' },
      })
    }
  }

  return providers
}

const requestLog = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(ip, recent)
    return true
  }
  recent.push(now)
  requestLog.set(ip, recent)
  return false
}

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

function validateMessages(body: unknown): ChatMessage[] | string {
  if (!body || typeof body !== 'object' || !Array.isArray((body as { messages?: unknown }).messages)) {
    return 'Request body must be { messages: [...] }.'
  }
  const raw = (body as { messages: unknown[] }).messages
  if (raw.length === 0) return 'Send at least one message.'

  const messages: ChatMessage[] = []
  for (const item of raw.slice(-MAX_MESSAGES)) {
    const { role, content } = (item ?? {}) as { role?: unknown; content?: unknown }
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
      return 'Each message needs a role of "user" or "assistant" and text content.'
    }
    if (content.length > MAX_MESSAGE_CHARS) {
      return `Each message must be under ${MAX_MESSAGE_CHARS.toLocaleString()} characters.`
    }
    messages.push({ role, content })
  }

  while (messages.length > 1 && messages.reduce((n, m) => n + m.content.length, 0) > MAX_TOTAL_CHARS) {
    messages.shift()
  }
  if (messages[messages.length - 1].role !== 'user') return 'The last message must be from the user.'
  return messages
}

function streamText(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const reader = upstream.getReader()
  let buffer = ''

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        // Keep reading until we emit something: a pull that enqueues nothing is never re-invoked,
        // which stalls the stream (e.g. reasoning models send many content-less chunks first).
        for (let emitted = false; !emitted; ) {
          const { done, value } = await reader.read()
          if (done) {
            controller.close()
            return
          }
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            const data = line.trim()
            if (!data.startsWith('data:')) continue
            const payload = data.slice(5).trim()
            if (payload === '[DONE]') continue
            try {
              const text = JSON.parse(payload)?.choices?.[0]?.delta?.content
              if (typeof text === 'string' && text) {
                controller.enqueue(encoder.encode(text))
                emitted = true
              }
            } catch {
              // Ignore keep-alive or partial lines that are not JSON.
            }
          }
        }
      } catch {
        controller.enqueue(encoder.encode('\n\n_[The response was interrupted. Please try again.]_'))
        controller.close()
      }
    },
    cancel(reason) {
      return reader.cancel(reason)
    },
  })
}

export function GET(): Response {
  return new Response(buildSystemPrompt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export async function POST(request: Request): Promise<Response> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (isRateLimited(ip)) {
    return jsonError(429, 'Too many requests from this device. Please wait a few minutes and try again.')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError(400, 'Request body must be valid JSON.')
  }

  const messages = validateMessages(body)
  if (typeof messages === 'string') return jsonError(400, messages)

  const providers = configuredProviders()
  if (providers.length === 0) {
    return jsonError(500, 'No AI provider is configured. Set GROQ_API_KEY and/or GEMINI_API_KEY.')
  }

  const fullMessages = [{ role: 'system', content: buildSystemPrompt() }, ...messages]
  const failures: string[] = []
  let allRateLimited = true

  for (const provider of providers) {
    let upstream: Response
    try {
      upstream = await fetch(provider.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
        body: JSON.stringify({
          model: provider.model,
          messages: fullMessages,
          stream: true,
          temperature: 0.2,
          max_tokens: MAX_OUTPUT_TOKENS,
          ...provider.extraBody,
        }),
        signal: request.signal,
      })
    } catch (err) {
      if (request.signal.aborted) return new Response(null, { status: 499 })
      allRateLimited = false
      failures.push(`${provider.name} ${provider.model}: ${(err as Error).message}`)
      continue
    }

    if (upstream.ok && upstream.body) {
      return new Response(streamText(upstream.body), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Accel-Buffering': 'no',
          'X-Provider': `${provider.name} - ${provider.model}`,
        },
      })
    }

    if (upstream.status !== 429) allRateLimited = false
    const detail = (await upstream.text().catch(() => '')).slice(0, 300)
    failures.push(`${provider.name} ${provider.model}: HTTP ${upstream.status} ${detail}`)
  }

  console.error('All AI providers failed:', failures)
  if (allRateLimited) {
    return jsonError(429, 'The free AI quota is used up for the moment. Please try again in a minute.')
  }
  return jsonError(502, 'The AI service is unavailable right now. Please try again shortly.')
}
