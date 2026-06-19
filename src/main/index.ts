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

export async function createServer() {
  const app = express()

  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }))
  app.use(express.json())
  app.use(cookieParser())

  // Initialize SQLite cache
  await initializeCache()

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
