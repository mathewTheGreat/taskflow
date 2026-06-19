import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.userId
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    const [dueToday, overdue, completed, projectStats, recentActivity] = await Promise.all([
      // Due today
      prisma.task.count({
        where: {
          assignee_id: userId,
          due_date: { gte: todayStart, lt: todayEnd },
          status: { not: 'COMPLETED' },
        },
      }),
      // Overdue
      prisma.task.count({
        where: {
          assignee_id: userId,
          due_date: { lt: todayStart },
          status: { not: 'COMPLETED' },
        },
      }),
      // Completed (all time for simplicity, could be this week)
      prisma.task.count({
        where: {
          assignee_id: userId,
          status: 'COMPLETED',
        },
      }),
      // Project stats
      prisma.project.aggregate({
        _count: { id: true },
      }),
      prisma.task.aggregate({
        _count: { id: true },
      }),
      prisma.task.count({
        where: { status: 'COMPLETED' },
      }),
      // Recent activity
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: { user: { select: { name: true } } },
      }),
    ])

    const totalProjects = projectStats._count.id
    const totalTasks = prisma.task.count() // This is a separate query, fixing below

    res.json({
      my_tasks: {
        due_today: dueToday,
        overdue,
        completed,
      },
      project_summary: {
        total_projects: totalProjects,
        total_tasks: await totalTasks,
        completed_tasks: completed,
        overdue_tasks: overdue,
      },
      recent_activity: recentActivity.map(a => ({
        id: a.id,
        type: a.action,
        message: formatActivityMessage(a.action, a.user.name, a.metadata),
        created_at: a.created_at,
      })),
    })
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
