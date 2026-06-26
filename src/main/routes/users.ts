import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/error.js'
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.js'
import { kvCacheSet, kvCacheGetWithStale } from '../services/cache.js'
import { Prisma } from '../generated/prisma-client'

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

router.get('/me', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.userId
    const stale = kvCacheGetWithStale<Record<string, unknown>>(`user:${userId}`)

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, company: true, created_at: true },
      })
      if (!user) {
        throw new AppError('User not found', 404)
      }
      const result = { ...user, role: user.role.toLowerCase() }
      console.log('[Cache] MISS user/me, caching')
      kvCacheSet(`user:${userId}`, result)
      res.json(result)
    } catch (err) {
      if (isNetworkError(err) && stale) {
        console.log('[Cache] STALE user/me (offline)')
        res.set('X-Cache-Stale', 'true')
        return res.json(stale.data)
      }
      throw err
    }
  } catch (err) {
    next(err)
  }
})

router.get('/', roleMiddleware('admin'), async (req: AuthRequest, res: Response, next) => {
  try {
    const search = (req.query.search as string) || ''
    const role = (req.query.role as string) || ''
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
    const offset = parseInt(req.query.offset as string) || 0

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (role) {
      where.role = role.toUpperCase()
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, created_at: true },
        take: limit,
        skip: offset,
        orderBy: { created_at: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    res.json({ users: users.map(u => ({ ...u, role: u.role.toLowerCase() })), total, limit, offset })
  } catch (err) {
    next(err)
  }
})

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'project_manager', 'team_member']),
})

router.put('/:id/role', roleMiddleware('admin'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { role } = updateRoleSchema.parse(req.body)
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { role: role.toUpperCase() as 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER' },
      select: { id: true, name: true, email: true, role: true },
    })
    res.json({ ...user, role: user.role.toLowerCase() })
  } catch (err) {
    next(err)
  }
})

export { router as usersRouter }
