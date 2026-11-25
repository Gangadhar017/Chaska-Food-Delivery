// Starts the API server and the Vite dev server together.
// Vite is told to talk to the API; run `npm run dev:web` on its own for the browser-only demo.

import { spawn } from 'node:child_process'
import { createServer } from 'vite'

process.env.VITE_API_URL = '/api'
// The API gets its own port. PORT is left for Vite, since hosts and tools set it for the web server.
const apiPort = process.env.API_PORT || '4000'

const api = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', '--watch', 'server/index.js'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: apiPort },
})

const vite = await createServer()
await vite.listen()
vite.printUrls()

function stop() {
  api.kill()
  vite.close().finally(() => process.exit(0))
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
api.on('exit', (code) => {
  if (code) process.exit(code)
})
