import type { Message } from '../types'


function fence(text: string, lang = 'text'): string {
  const longestRun = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length))
  const ticks = '`'.repeat(Math.max(3, longestRun + 1))
  return `${ticks}${lang}\n${text}\n${ticks}`
}

function statusLines(message: Message): string[] {
  const lines: string[] = []
  if (message.streaming) lines.push('- Status: still streaming when the transcript was saved (reply incomplete)')
  if (message.stopped) lines.push('- Status: stopped by the user before the reply finished')
  if (message.error) lines.push(`- Error: ${message.error}`)
  return lines
}

function entry(message: Message, index: number): string {
  const number = index + 1
  const meta = [`- Message ${number}, role: ${message.role}`]
  if (message.role === 'assistant') meta.push(`- Provider and model: ${message.provider ?? 'not reported'}`)
  meta.push(...statusLines(message))
  const body = message.content ? fence(message.content) : '_(no text received)_'
  return `## ${number}. ${message.role === 'user' ? 'User' : 'Agent'}\n\n${meta.join('\n')}\n\n${body}`
}

export function buildTranscript(messages: Message[], date = new Date()): string {
  const header = [
    '# ENG 3000 Project Evaluation Agent transcript',
    '',
    `- Saved: ${date.toISOString()} (${date.toLocaleString()})`,
    `- Messages: ${messages.length}`,
    '',
    'Each message below is reproduced exactly as it was sent to or received from the agent.',
  ].join('\n')
  return [header, ...messages.map(entry)].join('\n\n') + '\n'
}
