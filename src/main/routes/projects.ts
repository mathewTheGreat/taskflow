import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error'
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

const createProjectSchema = z.object({
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

    // Get user's team IDs
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

    if (status) where.status = status
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
          tasks: {
            where: { status: 'COMPLETED' },
            select: { id: true },
          },
        },
        take: limit,
        skip: offset,
        orderBy: { created_at: 'desc' },
      }),
      prisma.project.count({ where }),
    ])

    res.json({
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
        completed_count: p.tasks.length,
        created_at: p.created_at,
      })),
      total,
      limit,
      offset,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/projects
router.post('/', roleMiddleware('admin', 'project_manager'), async (req: AuthRequest, res: Response, next) => {
  try {
    const data = createProjectSchema.parse(req.body)

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        owner_id: req.user!.userId,
        team_id: data.team_id,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : undefined,
      },
    })

    res.status(201).json(project)
  } catch (err) {
    next(err)
  }
})

// GET /api/projects/:id
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { tasks: true } },
        tasks: {
          where: { status: 'COMPLETED' },
          select: { id: true },
        },
      },
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    res.json({
      id: project.id,
      name: project.name,
      description: project.description,
      owner_id: project.owner_id,
      team_id: project.team_id,
      status: project.status.toLowerCase(),
      start_date: project.start_date,
      end_date: project.end_date,
      task_count: project._count.tasks,
      completed_count: project.tasks.length,
      created_at: project.created_at,
    })
  } catch (err) {
    next(err)
  }
})

// PUT /api/projects/:id
router.put('/:id', roleMiddleware('admin', 'project_manager'), async (req: AuthRequest, res: Response, next) => {
  try {
    const data = createProjectSchema.parse(req.body)

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name: data.name,
        description: data.description,
        team_id: data.team_id,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : undefined,
      },
    })

    res.json(project)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/projects/:id
router.delete('/:id', roleMiddleware('admin', 'project_manager'), async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export { router as projectsRouter }
