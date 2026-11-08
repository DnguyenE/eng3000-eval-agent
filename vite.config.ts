import type { IncomingMessage, ServerResponse } from 'node:http'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Connect, type Plugin, type ViteDevServer } from 'vite'

type ApiModule = Record<string, ((request: Request) => Response | Promise<Response>) | undefined>

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks)
}

function localApi(): Plugin {
  return {
    name: 'local-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/chat', async (req: Connect.IncomingMessage, res: ServerResponse) => {
        const controller = new AbortController()
        res.on('close', () => controller.abort())
        try {
          const mod = (await server.ssrLoadModule('/api/chat.ts')) as ApiModule
          const handler = mod[req.method ?? 'GET']
          if (!handler) {
            res.statusCode = 405
            res.end()
            return
          }
          const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
          const request = new Request(`http://localhost${req.originalUrl ?? req.url}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: hasBody ? new Uint8Array(await readBody(req)) : undefined,
            signal: controller.signal,
          })
          const response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          if (!response.body) {
            res.end()
            return
          }
          for await (const chunk of response.body) res.write(chunk)
          res.end()
        } catch (err) {
          if (controller.signal.aborted) return
          server.config.logger.error(`[local-api] ${(err as Error).stack ?? err}`)
          if (!res.headersSent) res.statusCode = 500
          res.end()
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return {
    plugins: [react(), tailwindcss(), localApi()],
  }
})
