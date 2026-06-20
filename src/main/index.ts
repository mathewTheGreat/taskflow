import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { authRouter } from './routes/auth'
import { usersRouter } from './routes/users'
import { teamsRouter } from './routes/teams'
import { projectsRouter } from './routes/projects'
import { tasksRouter } from './routes/tasks'
import { dashboardRouter } from './routes/dashboard'
import { errorHandler } from './middleware/error'
import { initializeCache } from './services/cache'

const PORT = process.env.API_PORT || 3001

function safeJsonParse(raw: string) {
  try { return JSON.parse(raw) }
  catch { return {} }
}

export async function createServer() {
  const app = express()

  app.use((req, _res, next) => {
    console.log('[API Request Start]', req.method, req.originalUrl, 'content-type=', req.headers['content-type'], 'content-length=', req.headers['content-length'])
    req.on('aborted', () => {
      console.warn('[API Request aborted]', req.method, req.originalUrl)
    })
    req.on('error', (err) => {
      console.error('[API Request error]', req.method, req.originalUrl, err)
    })
    next()
  })

  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }))

  // Diagnostic: POST endpoint that fires before body parsing
  app.post('/api/ping', (_req, res) => {
    console.log('[Ping] POST /api/ping entered')
    res.json({ pong: true })
  })

  app.use((req, _res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8')
        req.body = raw ? safeJsonParse(raw) : {}
        next()
      })
      req.on('error', (err) => {
        console.error('[Body parse error]', err)
        next(err)
      })
    } else {
      next()
    }
  })

  app.use(cookieParser())

  app.use((req, _res, next) => {
    console.log('[API Request]', req.method, req.originalUrl, 'body=', JSON.stringify(req.body)?.slice(0, 200) ?? '', 'query=', JSON.stringify(req.query))
    next()
  })

  // Initialize SQLite cache
  await initializeCache()

  // Debug endpoint for POST JSON health check
  app.post('/api/debug', (req, res) => {
    console.log('[Debug] /api/debug request', { body: req.body })
    res.json({ received: req.body })
  })

  // Routes
  app.use('/api/auth', authRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/teams', teamsRouter)
  app.use('/api/projects', projectsRouter)
  app.use('/api/tasks', tasksRouter)
  app.use('/api/dashboard', dashboardRouter)

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Error handler
  app.use(errorHandler)

  return app
}

export function startServer() {
  createServer().then(app => {
    app.listen(PORT, () => {
      console.log(`[TaskFlow API] Running on http://localhost:${PORT}`)
    })
  }).catch(err => {
    console.error('[TaskFlow API] Failed to start:', err)
    process.exit(1)
  })
}

// Auto-start if run directly
if (require.main === module) {
  startServer()
}
