import { Router, Response } from 'express'
import { z } from 'zod'
import { Prisma } from '../generated/prisma-client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/error.js'
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.js'
import { cacheGet, cacheGetWithStale, cacheSet, cacheInvalidate, cacheSetList, kvCacheSet, kvCacheGet, kvCacheGetWithStale, syncQueuePush } from '../services/cache.js'

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

const createProjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  team_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

// GET /api/projects
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.userId
    const teamId = (req.query.team_id as string) || ''
    const status = (req.query.status as string) || ''
    const search = (req.query.search as string) || ''
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
    const offset = parseInt(req.query.offset as string) || 0

    const cacheKey = `projects:list:v1:${userId}:${teamId}:${status}:${search}:${limit}:${offset}`
    const cached = kvCacheGet<{ projects: Record<string, unknown>[]; total: number }>(cacheKey)
    if (cached) {
      console.log('[Cache] HIT projects list')
      return res.json(cached)
    }

    const stale = kvCacheGetWithStale<{ projects: Record<string, unknown>[]; total: number }>(cacheKey)

    try {
      const memberships = await prisma.teamMember.findMany({
        where: { user_id: userId },
        select: { team_id: true },
      })
      const teamIds = memberships.map(m => m.team_id)

      const where: Record<string, unknown> = {
        OR: [
          { owner_id: userId },
          { team_id: { in: teamIds } },
        ],
      }

      if (status) where.status = status.toUpperCase()
      if (teamId) where.team_id = teamId
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          include: {
            _count: { select: { tasks: true } },
          },
          take: limit,
          skip: offset,
          orderBy: { created_at: 'desc' },
        }),
        prisma.project.count({ where }),
      ])

      const projectIds = projects.map(p => p.id)
      const completedGroups = await prisma.task.groupBy({
        by: ['project_id'],
        where: { project_id: { in: projectIds }, status: 'COMPLETED' },
        _count: true,
      })
      const completedMap = new Map(completedGroups.map(g => [g.project_id, g._count]))

      const result = {
        projects: projects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          owner_id: p.owner_id,
          team_id: p.team_id,
          status: p.status.toLowerCase(),
          start_date: p.start_date,
          end_date: p.end_date,
          task_count: p._count.tasks,
          completed_count: completedMap.get(p.id) || 0,
          created_at: p.created_at,
        })),
        total,
        limit,
        offset,
      }

      console.log('[Cache] MISS projects list, caching', result.projects.length, 'projects')
      cacheSetList('cache_projects', result.projects as { id: string }[])
      kvCacheSet(cacheKey, result)
      return res.json(result)
    } catch (err) {
      if (isNetworkError(err) && stale) {
        console.log('[Cache] STALE projects list (offline)')
        res.set('X-Cache-Stale', 'true')
        return res.json(stale.data)
      }
      throw err
    }
  } catch (err) {
    next(err)
  }
})

// POST /api/projects
router.post('/', roleMiddleware('admin', 'project_manager', 'team_member'), async (req: AuthRequest, res: Response, next) => {
  try {
    const data = createProjectSchema.parse(req.body)

    const project = await prisma.project.create({
      data: {
        ...(data.id && { id: data.id }),
        name: data.name,
        description: data.description,
        owner_id: req.user!.userId,
        team_id: data.team_id,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : undefined,
      },
    })

    const result = {
      id: project.id,
      name: project.name,
      description: project.description,
      owner_id: project.owner_id,
      team_id: project.team_id,
      status: project.status.toLowerCase(),
      start_date: project.start_date,
      end_date: project.end_date,
      created_at: project.created_at,
    }

    cacheSet('cache_projects', project.id, result)
    res.status(201).json(result)
  } catch (err) {
    if (isNetworkError(err)) {
      const data = req.body as Record<string, unknown>
      syncQueuePush('create', 'projects', data)
      if (data.id) {
        cacheSet('cache_projects', data.id as string, data)
      }
      res.status(503).json({ offline: true, message: 'Saved offline - will sync when connection restores' })
    } else {
      next(err)
    }
  }
})

// GET /api/projects/:id
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const id = req.params.id as string

    const cached = cacheGet<Record<string, unknown>>('cache_projects', id)
    if (cached) {
      console.log('[Cache] HIT project detail', id)
      return res.json(cached)
    }

    const stale = cacheGetWithStale<Record<string, unknown>>('cache_projects', id)

    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          _count: { select: { tasks: true } },
          team: {
            include: {
              members: {
                include: { user: { select: { id: true, name: true, email: true } } },
              },
            },
          },
        },
      })

      if (!project) {
        throw new AppError('Project not found', 404)
      }

      const result = {
        id: project.id,
        name: project.name,
        description: project.description,
        owner_id: project.owner_id,
        team_id: project.team_id,
        status: project.status.toLowerCase(),
        start_date: project.start_date,
        end_date: project.end_date,
        task_count: project._count.tasks,
        completed_count: 0,
        created_at: project.created_at,
        members: project.team?.members.map(m => ({
          user_id: m.user.id,
          user_name: m.user.name,
          email: m.user.email,
        })) || [],
      }

      console.log('[Cache] MISS project detail, caching', id)
      cacheSet('cache_projects', id, result)
      return res.json(result)
    } catch (err) {
      if (isNetworkError(err) && stale) {
        console.log('[Cache] STALE project detail', id)
        res.set('X-Cache-Stale', 'true')
        return res.json(stale.data)
      }
      throw err
    }
  } catch (err) {
    next(err)
  }
})

// PUT /api/projects/:id
router.put('/:id', roleMiddleware('admin', 'project_manager'), async (req: AuthRequest, res: Response, next) => {
  try {
    const id = req.params.id as string
    const data = createProjectSchema.parse(req.body)

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        team_id: data.team_id,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : undefined,
      },
    })

    cacheSet('cache_projects', id, project)
    res.json(project)
  } catch (err) {
    if (isNetworkError(err)) {
      const id = req.params.id as string
      syncQueuePush('update', 'projects', { id, ...req.body })
      const cached = cacheGetWithStale<Record<string, unknown>>('cache_projects', id)
      if (cached) {
        cacheSet('cache_projects', id, { ...cached.data, ...req.body })
      }
      res.status(503).json({ offline: true, message: 'Saved offline - will sync when connection restores' })
    } else {
      next(err)
    }
  }
})

// DELETE /api/projects/:id
router.delete('/:id', roleMiddleware('admin', 'project_manager'), async (req: AuthRequest, res: Response, next) => {
  try {
    const id = req.params.id as string
    await prisma.project.delete({ where: { id } })
    cacheInvalidate('cache_projects', id)
    res.status(204).send()
  } catch (err) {
    if (isNetworkError(err)) {
      const id = req.params.id as string
      syncQueuePush('delete', 'projects', { id })
      cacheInvalidate('cache_projects', id)
      res.status(503).json({ offline: true, message: 'Saved offline - will sync when connection restores' })
    } else {
      next(err)
    }
  }
})

export { router as projectsRouter }
