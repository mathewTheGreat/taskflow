import { Router, Response } from 'express'
import { Prisma } from '../generated/prisma-client'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { kvCacheSet, kvCacheGet, kvCacheGetWithStale } from '../services/cache.js'

const router = Router()

router.use(authMiddleware)

function isNetworkError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P1001', 'P1002', 'P1008'].includes(err.code)
  }
  const msg = (err as Error)?.message?.toLowerCase() || ''
  return /econnrefused|econnreset|etimedout|network.*(unreachable|error)/.test(msg)
}

router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.userId
    const cacheKey = `dashboard:v1:${userId}`
    const cached = kvCacheGet<Record<string, unknown>>(cacheKey)
    if (cached) {
      console.log('[Cache] HIT dashboard')
      return res.json(cached)
    }

    const stale = kvCacheGetWithStale<Record<string, unknown>>(cacheKey)

    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

      // User's projects: owned or member of the owning team
      const userProjectIds = await prisma.project.findMany({
        where: {
          OR: [
            { owner_id: userId },
            { team: { members: { some: { user_id: userId } } } },
          ],
        },
        select: { id: true },
      }).then(rows => rows.map(r => r.id))

      const [dueToday, overdue, completed, totalProjects, totalTasks, recentActivity] = await Promise.all([
        prisma.task.count({
          where: {
            assignee_id: userId,
            due_date: { gte: todayStart, lt: todayEnd },
            status: { not: 'COMPLETED' },
          },
        }),
        prisma.task.count({
          where: {
            assignee_id: userId,
            due_date: { lt: todayStart },
            status: { not: 'COMPLETED' },
          },
        }),
        prisma.task.count({
          where: {
            assignee_id: userId,
            status: 'COMPLETED',
          },
        }),
        prisma.project.count({
          where: { id: { in: userProjectIds } },
        }),
        prisma.task.count({
          where: { project_id: { in: userProjectIds } },
        }),
        prisma.activityLog.findMany({
          take: 10,
          orderBy: { created_at: 'desc' },
          include: { user: { select: { name: true } } },
        }),
      ])

      const overdueInUserProjects = await prisma.task.count({
        where: {
          project_id: { in: userProjectIds },
          due_date: { lt: todayStart },
          status: { not: 'COMPLETED' },
        },
      })

      const result = {
        my_tasks: {
          due_today: dueToday,
          overdue,
          completed,
        },
        project_summary: {
          total_projects: totalProjects,
          total_tasks: totalTasks,
          completed_tasks: await prisma.task.count({
            where: { project_id: { in: userProjectIds }, status: 'COMPLETED' },
          }),
          overdue_tasks: overdueInUserProjects,
        },
        recent_activity: recentActivity.map((a: { id: string; action: string; user: { name: string }; metadata: unknown; created_at: Date }) => ({
          id: a.id,
          type: a.action,
          message: formatActivityMessage(a.action, a.user.name, a.metadata),
          created_at: a.created_at,
        })),
      }

      console.log('[Cache] MISS dashboard, caching')
      kvCacheSet(cacheKey, result)
      return res.json(result)
    } catch (err) {
      if (isNetworkError(err) && stale) {
        console.log('[Cache] STALE dashboard (offline)')
        res.set('X-Cache-Stale', 'true')
        return res.json(stale.data)
      }
      throw err
    }
  } catch (err) {
    next(err)
  }
})

function formatActivityMessage(action: string, userName: string, metadata: unknown): string {
  const meta = metadata as Record<string, string> | null
  switch (action) {
    case 'task_created':
      return `${userName} created "${meta?.title || 'a task'}"`
    case 'task_completed':
      return `${userName} completed "${meta?.title || 'a task'}"`
    case 'task_assigned':
      return `${userName} assigned "${meta?.title || 'a task'}"`
    default:
      return `${userName} performed ${action}`
  }
}

export { router as dashboardRouter }
