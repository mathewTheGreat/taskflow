import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error'
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

router.get('/me', async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, company: true, created_at: true },
    })
    if (!user) {
      throw new AppError('User not found', 404)
    }
    res.json({ ...user, role: user.role.toLowerCase() })
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
