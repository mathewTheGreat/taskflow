import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, AuthRequest } from '../middleware/auth'

const router = Router()

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  company: z.string().max(100).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

router.post('/register', async (req, res: Response, next) => {
  try {
    const data = registerSchema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      throw new AppError('Email already registered', 400)
    }

    const passwordHash = await bcrypt.hash(data.password, 12)
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: passwordHash,
        company: data.company,
      },
      select: { id: true, name: true, email: true, role: true, company: true, created_at: true },
    })

    const payload = { userId: user.id, email: user.email, role: user.role }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.status(201).json({ user, accessToken, refreshToken })
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res: Response, next) => {
  try {
    const data = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) {
      throw new AppError('Invalid email or password', 401)
    }

    const valid = await bcrypt.compare(data.password, user.password)
    if (!valid) {
      throw new AppError('Invalid email or password', 401)
    }

    const payload = { userId: user.id, email: user.email, role: user.role }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, company: user.company, created_at: user.created_at },
      accessToken,
      refreshToken,
    })
  } catch (err) {
    next(err)
  }
})

router.post('/refresh', async (req, res: Response, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body)
    const payload = verifyRefreshToken(refreshToken)

    const newAccessToken = generateAccessToken(payload)
    const newRefreshToken = generateRefreshToken(payload)

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken })
  } catch (err) {
    next(new AppError('Invalid refresh token', 401))
  }
})

router.post('/logout', (_req: AuthRequest, res: Response) => {
  res.clearCookie('refreshToken')
  res.json({ message: 'Logged out' })
})

export { router as authRouter }
