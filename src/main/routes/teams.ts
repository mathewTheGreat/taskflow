import { Router, Response } from 'express'
import { z } from 'zod'
import { Prisma } from '../generated/prisma-client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/error.js'
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.js'
import { cacheGet, cacheGetWithStale, cacheSet, cacheInvalidate, syncQueuePush } from '../services/cache.js'

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

const createTeamSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

const addMemberSchema = z.object({
  user_id: z.string().uuid(),
})

// GET /api/teams
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.userId

    const memberships = await prisma.teamMember.findMany({
      where: { user_id: userId },
      select: { team_id: true },
    })
    const teamIds = memberships.map(m => m.team_id)

    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { created_at: 'desc' },
    })

    res.json({
      teams: teams.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        member_count: t._count.members,
        created_at: t.created_at,
      })),
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/teams
router.post('/', roleMiddleware('admin', 'project_manager'), async (req: AuthRequest, res: Response, next) => {
  try {
    const data = createTeamSchema.parse(req.body)
    const userId = req.user!.userId

    const team = await prisma.team.create({
      data: {
        ...(data.id && { id: data.id }),
        name: data.name,
        description: data.description,
        created_by: userId,
        members: {
          create: { user_id: userId },
        },
      },
    })

    const result = {
      id: team.id,
      name: team.name,
      description: team.description,
      created_by: team.created_by,
      created_at: team.created_at,
    }

    cacheSet('cache_teams', team.id, result)
    res.status(201).json(result)
  } catch (err) {
    if (isNetworkError(err)) {
      const data = req.body as Record<string, unknown>
      syncQueuePush('create', 'teams', data)
      if (data.id) {
        cacheSet('cache_teams', data.id as string, data)
      }
      res.status(503).json({ offline: true, message: 'Saved offline - will sync when connection restores' })
    } else {
      next(err)
    }
  }
})

// GET /api/teams/:id
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const id = req.params.id as string

    const cached = cacheGet<Record<string, unknown>>('cache_teams', id)
    if (cached) return res.json(cached)

    const stale = cacheGetWithStale<Record<string, unknown>>('cache_teams', id)

    try {
      const team = await prisma.team.findUnique({
        where: { id },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, role: true } },
            },
          },
        },
      })

      if (!team) {
        throw new AppError('Team not found', 404)
      }

      const result = {
        id: team.id,
        name: team.name,
        description: team.description,
        created_by: team.created_by,
        members: team.members.map((m: { user: { id: string; name: string; email: string; role: string } }) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.user.role.toLowerCase(),
        })),
        created_at: team.created_at,
      }

      cacheSet('cache_teams', id, result)
      return res.json(result)
    } catch (err) {
      if (isNetworkError(err) && stale) {
        res.set('X-Cache-Stale', 'true')
        return res.json(stale.data)
      }
      throw err
    }
  } catch (err) {
    next(err)
  }
})

// PUT /api/teams/:id
router.put('/:id', roleMiddleware('admin', 'project_manager'), async (req: AuthRequest, res: Response, next) => {
  try {
    const id = req.params.id as string
    const data = createTeamSchema.parse(req.body)
    const team = await prisma.team.update({
      where: { id },
      data: { name: data.name, description: data.description },
    })
    cacheSet('cache_teams', id, team)
    res.json(team)
  } catch (err) {
    if (isNetworkError(err)) {
      const id = req.params.id as string
      syncQueuePush('update', 'teams', { id, ...req.body })
      const cached = cacheGetWithStale<Record<string, unknown>>('cache_teams', id)
      if (cached) {
        cacheSet('cache_teams', id, { ...cached.data, ...req.body })
      }
      res.status(503).json({ offline: true, message: 'Saved offline - will sync when connection restores' })
    } else {
      next(err)
    }
  }
})

// DELETE /api/teams/:id
router.delete('/:id', roleMiddleware('admin'), async (req: AuthRequest, res: Response, next) => {
  try {
    const id = req.params.id as string
    await prisma.team.delete({ where: { id } })
    cacheInvalidate('cache_teams', id)
    res.status(204).send()
  } catch (err) {
    if (isNetworkError(err)) {
      const id = req.params.id as string
      syncQueuePush('delete', 'teams', { id })
      cacheInvalidate('cache_teams', id)
      res.status(503).json({ offline: true, message: 'Saved offline - will sync when connection restores' })
    } else {
      next(err)
    }
  }
})

// POST /api/teams/:id/members
router.post('/:id/members', roleMiddleware('admin', 'project_manager'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { user_id } = addMemberSchema.parse(req.body)

    const member = await prisma.teamMember.create({
      data: {
        team_id: req.params.id as string,
        user_id,
      },
    })

    res.status(201).json(member)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/teams/:id/members/:userId
router.delete('/:id/members/:userId', roleMiddleware('admin', 'project_manager'), async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.teamMember.delete({
      where: {
        team_id_user_id: {
          team_id: req.params.id as string,
          user_id: req.params.userId as string,
        },
      },
    })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export { router as teamsRouter }
