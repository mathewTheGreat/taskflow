import { Router, Response } from 'express'
import { z } from 'zod'
import { Prisma } from '../generated/prisma-client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/error.js'
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.js'
import { cacheGet, cacheGetWithStale, cacheSet, cacheInvalidate, cacheSetList, kvCacheSet, kvCacheGet, kvCacheGetWithStale } from '../services/cache.js'
import { syncQueuePush } from '../services/cache.js'

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

const createTaskSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  assignee_id: z.string().uuid().optional(),
  parent_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  estimated_hours: z.number().int().positive().optional(),
  completion_percentage: z.number().int().min(0).max(100).optional(),
})

const updateTaskSchema = z.object({
  project_id: z.string().uuid().optional(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional(),
  assignee_id: z.string().uuid().optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  start_date: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  estimated_hours: z.number().int().positive().optional().nullable(),
  completion_percentage: z.number().int().min(0).max(100).optional(),
})

const createCommentSchema = z.object({
  message: z.string().min(1).max(5000),
})

// GET /api/tasks
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const projectId = (req.query.project_id as string) || ''
    const assigneeId = (req.query.assignee_id as string) || ''
    const status = (req.query.status as string) || ''
    const priority = (req.query.priority as string) || ''
    const search = (req.query.search as string) || ''
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
    const offset = parseInt(req.query.offset as string) || 0

    const cacheKey = `tasks:list:v1:${req.user!.userId}:${projectId}:${assigneeId}:${status}:${priority}:${search}:${limit}:${offset}`
    const cached = kvCacheGet<{ tasks: Record<string, unknown>[]; total: number }>(cacheKey)
    if (cached) {
      console.log('[Cache] HIT tasks list', cacheKey.slice(0, 80))
      return res.json(cached)
    }

    const stale = kvCacheGetWithStale<{ tasks: Record<string, unknown>[]; total: number }>(cacheKey)

    try {
      const where: Record<string, unknown> = {}
      if (projectId) where.project_id = projectId
      if (assigneeId) where.assignee_id = assigneeId
      if (status) where.status = status.toUpperCase()
      if (priority) where.priority = priority.toUpperCase()
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include: {
            assignee: { select: { id: true, name: true } },
          },
          take: limit,
          skip: offset,
          orderBy: { created_at: 'desc' },
        }),
        prisma.task.count({ where }),
      ])

      const result = {
        tasks: tasks.map(t => ({
          id: t.id,
          project_id: t.project_id,
          title: t.title,
          description: t.description,
          assignee_id: t.assignee_id,
          assignee_name: t.assignee?.name || null,
          assignee_initials: t.assignee?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || null,
          parent_id: t.parent_id,
          status: t.status.toLowerCase(),
          priority: t.priority.toLowerCase(),
          start_date: t.start_date,
          due_date: t.due_date,
          estimated_hours: t.estimated_hours,
          completion_percentage: t.completion_percentage,
          created_by: t.created_by,
          created_at: t.created_at,
        })),
        total,
        limit,
        offset,
      }

      console.log('[Cache] MISS tasks list, caching result', result.tasks.length, 'tasks')
      cacheSetList('cache_tasks', result.tasks as { id: string }[])
      kvCacheSet(cacheKey, result)
      return res.json(result)
    } catch (err) {
      if (isNetworkError(err) && stale) {
        console.log('[Cache] STALE tasks list (offline)')
        res.set('X-Cache-Stale', 'true')
        return res.json(stale.data)
      }
      throw err
    }
  } catch (err) {
    next(err)
  }
})

// POST /api/tasks
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const data = createTaskSchema.parse(req.body)

    const task = await prisma.task.create({
      data: {
        ...(data.id && { id: data.id }),
        project_id: data.project_id,
        title: data.title,
        description: data.description,
        assignee_id: data.assignee_id,
        parent_id: data.parent_id,
        status: (data.status?.toUpperCase() || 'PENDING') as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
        priority: (data.priority?.toUpperCase() || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        due_date: data.due_date ? new Date(data.due_date) : undefined,
        estimated_hours: data.estimated_hours,
        completion_percentage: data.completion_percentage,
        created_by: req.user!.userId,
      },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    })

    await prisma.activityLog.create({
      data: {
        user_id: req.user!.userId,
        action: 'task_created',
        entity_type: 'task',
        entity_id: task.id,
        metadata: { title: task.title },
      },
    })

    const result = {
      id: task.id,
      project_id: task.project_id,
      title: task.title,
      description: task.description,
      assignee_id: task.assignee_id,
      assignee_name: task.assignee?.name || null,
      parent_id: task.parent_id,
      status: task.status.toLowerCase(),
      priority: task.priority.toLowerCase(),
      due_date: task.due_date,
      completion_percentage: task.completion_percentage,
      created_by: task.created_by,
      created_at: task.created_at,
    }

    cacheSet('cache_tasks', task.id, result)
    res.status(201).json(result)
  } catch (err) {
    if (isNetworkError(err)) {
      const data = req.body as Record<string, unknown>
      syncQueuePush('create', 'tasks', data)
      if (data.id) {
        cacheSet('cache_tasks', data.id as string, data)
      }
      res.status(503).json({ offline: true, message: 'Saved offline - will sync when connection restores' })
    } else {
      next(err)
    }
  }
})

// GET /api/tasks/:id
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const id = req.params.id as string

    const cached = cacheGet<Record<string, unknown>>('cache_tasks', id)
    if (cached) {
      console.log('[Cache] HIT task detail', id)
      return res.json(cached)
    }

    const stale = cacheGetWithStale<Record<string, unknown>>('cache_tasks', id)

    try {
      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          assignee: { select: { id: true, name: true } },
          comments: {
            include: { user: { select: { name: true } } },
            orderBy: { created_at: 'asc' },
          },
        },
      })

      if (!task) {
        throw new AppError('Task not found', 404)
      }

      const result = {
        id: task.id,
        project_id: task.project_id,
        title: task.title,
        description: task.description,
        assignee_id: task.assignee_id,
        assignee_name: task.assignee?.name || null,
        parent_id: task.parent_id,
        status: task.status.toLowerCase(),
        priority: task.priority.toLowerCase(),
        start_date: task.start_date,
        due_date: task.due_date,
        estimated_hours: task.estimated_hours,
        completion_percentage: task.completion_percentage,
        created_by: task.created_by,
        created_at: task.created_at,
        comments: task.comments.map((c: { id: string; task_id: string; user_id: string; message: string; created_at: Date; user: { name: string } }) => ({
          id: c.id,
          task_id: c.task_id,
          user_id: c.user_id,
          user_name: c.user.name,
          message: c.message,
          created_at: c.created_at,
        })),
      }

      console.log('[Cache] MISS task detail, caching', id)
      cacheSet('cache_tasks', id, result)
      return res.json(result)
    } catch (err) {
      if (isNetworkError(err) && stale) {
        console.log('[Cache] STALE task detail', id)
        res.set('X-Cache-Stale', 'true')
        return res.json(stale.data)
      }
      throw err
    }
  } catch (err) {
    next(err)
  }
})

// PUT /api/tasks/:id
router.put('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const id = req.params.id as string
    const data = updateTaskSchema.parse(req.body)

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(data.project_id !== undefined && { project_id: data.project_id }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.assignee_id !== undefined && { assignee_id: data.assignee_id }),
        ...(data.parent_id !== undefined && { parent_id: data.parent_id }),
        ...(data.status !== undefined && { status: data.status.toUpperCase() as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' }),
        ...(data.priority !== undefined && { priority: data.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' }),
        ...(data.start_date !== undefined && { start_date: data.start_date ? new Date(data.start_date) : null }),
        ...(data.due_date !== undefined && { due_date: data.due_date ? new Date(data.due_date) : null }),
        ...(data.estimated_hours !== undefined && { estimated_hours: data.estimated_hours }),
        ...(data.completion_percentage !== undefined && { completion_percentage: data.completion_percentage }),
      },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    })

    const result = {
      id: task.id,
      project_id: task.project_id,
      title: task.title,
      description: task.description,
      assignee_id: task.assignee_id,
      assignee_name: task.assignee?.name || null,
      parent_id: task.parent_id,
      status: task.status.toLowerCase(),
      priority: task.priority.toLowerCase(),
      due_date: task.due_date,
      completion_percentage: task.completion_percentage,
      created_by: task.created_by,
      created_at: task.created_at,
    }

    cacheSet('cache_tasks', id, result)
    res.json(result)
  } catch (err) {
    if (isNetworkError(err)) {
      const id = req.params.id as string
      syncQueuePush('update', 'tasks', { id, ...req.body })
      // Optimistically update cache
      const cached = cacheGetWithStale<Record<string, unknown>>('cache_tasks', id)
      if (cached) {
        cacheSet('cache_tasks', id, { ...cached.data, ...req.body })
      }
      res.status(503).json({ offline: true, message: 'Saved offline - will sync when connection restores' })
    } else {
      next(err)
    }
  }
})

// DELETE /api/tasks/:id
router.delete('/:id', roleMiddleware('admin', 'project_manager'), async (req: AuthRequest, res: Response, next) => {
  try {
    const id = req.params.id as string
    await prisma.task.delete({ where: { id } })
    cacheInvalidate('cache_tasks', id)
    res.status(204).send()
  } catch (err) {
    if (isNetworkError(err)) {
      const id = req.params.id as string
      syncQueuePush('delete', 'tasks', { id })
      cacheInvalidate('cache_tasks', id)
      res.status(503).json({ offline: true, message: 'Saved offline - will sync when connection restores' })
    } else {
      next(err)
    }
  }
})

// POST /api/tasks/:id/comments
router.post('/:id/comments', async (req: AuthRequest, res: Response, next) => {
  try {
    const { message } = createCommentSchema.parse(req.body)

    const comment = await prisma.comment.create({
      data: {
        task_id: req.params.id as string,
        user_id: req.user!.userId,
        message,
      },
      include: {
        user: { select: { name: true } },
      },
    })

    res.status(201).json({
      id: comment.id,
      task_id: comment.task_id,
      user_id: comment.user_id,
      user_name: comment.user.name,
      message: comment.message,
      created_at: comment.created_at,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/tasks/:id/comments
router.get('/:id/comments', async (req: AuthRequest, res: Response, next) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { task_id: req.params.id as string },
      include: { user: { select: { name: true } } },
      orderBy: { created_at: 'asc' },
    })

    res.json({
      comments: comments.map((c: { id: string; user_id: string; user: { name: string }; message: string; created_at: Date }) => ({
        id: c.id,
        user_id: c.user_id,
        user_name: c.user.name,
        message: c.message,
        created_at: c.created_at,
      })),
    })
  } catch (err) {
    next(err)
  }
})

export { router as tasksRouter }
