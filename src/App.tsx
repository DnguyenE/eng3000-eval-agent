import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Background } from './components/Background'
import { Chat } from './components/Chat'
import { Composer } from './components/Composer'
import { ExampleChips } from './components/ExampleChips'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { PromptViewer } from './components/PromptViewer'
import { ResultsPanel, ResultsPlaceholder } from './components/ResultsPanel'
import { streamChat } from './lib/chatApi'
import { splitMessage } from './lib/parseAssessment'
import type { Message } from './types'

function Footnote() {
  return (
    <p className="text-center text-[0.7rem] text-slate-500">
      Uses a free AI model. Answers can be wrong, so check every citation. Do not enter personal information.
    </p>
  )
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const assessment = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role !== 'assistant') continue
      const parsed = splitMessage(messages[i].content).assessment
      if (parsed) return parsed
    }
    return null
  }, [messages])

  const run = useCallback(async (history: Message[]) => {
    const assistantId = crypto.randomUUID()
    const controller = new AbortController()
    abortRef.current = controller
    setMessages([...history, { id: assistantId, role: 'assistant', content: '', streaming: true }])
    setStreaming(true)

    const update = (patch: (m: Message) => Partial<Message>) =>
      setMessages((ms) => ms.map((m) => (m.id === assistantId ? { ...m, ...patch(m) } : m)))

    try {
      await streamChat({
        messages: history.filter((m) => !m.error && m.content).map(({ role, content }) => ({ role, content })),
        signal: controller.signal,
        onProvider: (provider) => update(() => ({ provider })),
        onText: (chunk) => update((m) => ({ content: m.content + chunk })),
      })
    } catch (err) {
      if (!controller.signal.aborted) {
        update(() => ({ error: (err as Error).message || 'Something went wrong. Please try again.' }))
      }
    } finally {
      update((m) => ({
        streaming: false,
        content: m.content || (controller.signal.aborted ? '_Stopped._' : ''),
      }))
      if (abortRef.current === controller) {
        abortRef.current = null
        setStreaming(false)
      }
    }
  }, [])

  function send() {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    run([...messages, { id: crypto.randomUUID(), role: 'user', content: text }])
  }

  function retry() {
    const last = messages[messages.length - 1]
    if (last?.role === 'assistant' && last.error) run(messages.slice(0, -1))
  }

  function stop() {
    abortRef.current?.abort()
  }

  function reset() {
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
    setMessages([])
    setInput('')
  }

  const composer = (
    <Composer
      value={input}
      onChange={setInput}
      onSend={send}
      onStop={stop}
      streaming={streaming}
      autoFocus
    />
  )

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh print:h-auto">
      <Background />
      <Header onShowPrompt={() => setPromptOpen(true)} onReset={messages.length > 0 ? reset : undefined} />

      <AnimatePresence mode="wait">
        {messages.length === 0 ? (
          <motion.main
            key="landing"
            exit={{ opacity: 0, y: -16, transition: { duration: 0.2 } }}
            className="flex flex-1 items-center justify-center px-4 pt-4 pb-12"
          >
            <div className="w-full max-w-3xl space-y-8">
              <Hero />
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                {composer}
                <p className="text-center text-xs tracking-wide text-slate-500 uppercase">or try a test case</p>
                <ExampleChips onPick={setInput} />
              </motion.div>
              <Footnote />
            </div>
          </motion.main>
        ) : (
          <motion.main
            key="workspace"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid flex-1 gap-4 px-4 pb-4 sm:px-6 lg:min-h-0 lg:grid-cols-[minmax(340px,5fr)_7fr]"
          >
            <section className="flex flex-col lg:min-h-0 print:hidden" aria-label="Chat">
              <div className="scroll-thin flex-1 pr-1 lg:min-h-0 lg:overflow-y-auto">
                <Chat messages={messages} onRetry={retry} />
              </div>
              <div className="mt-3 space-y-2">
                {composer}
                <Footnote />
              </div>
            </section>

            <section className="print-area scroll-thin pr-1 lg:min-h-0 lg:overflow-y-auto" aria-label="Results">
              {assessment ? <ResultsPanel assessment={assessment} /> : <ResultsPlaceholder waiting={streaming} />}
            </section>
          </motion.main>
        )}
      </AnimatePresence>

      <PromptViewer open={promptOpen} onClose={() => setPromptOpen(false)} />
    </div>
  )
}
