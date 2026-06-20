import fs from 'fs'
import path from 'path'
import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, AuthRequest } from '../middleware/auth'

const authDebugDir = path.resolve(process.cwd(), 'logs')
const authDebugPath = path.join(authDebugDir, 'auth-debug.log')
if (!fs.existsSync(authDebugDir)) {
  fs.mkdirSync(authDebugDir, { recursive: true })
}

function authDebug(message: string, data?: unknown) {
  const line = `${new Date().toISOString()} ${message} ${data ? JSON.stringify(data) : ''}\n`
  fs.appendFileSync(authDebugPath, line)
}

const router = Router()

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>

function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

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

router.post('/register', asyncHandler(async (req, res: Response, next) => {
  console.log('[Auth] register start', { body: req.body })
  authDebug('register start', req.body)
  try {
    const data = registerSchema.parse(req.body)
    console.log('[Auth] register validated', { email: data.email, name: data.name, company: data.company })
    authDebug('register validated', { email: data.email, name: data.name, company: data.company })

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    console.log('[Auth] register existing user lookup', { email: data.email, found: Boolean(existing) })
    authDebug('register existing user lookup', { email: data.email, found: Boolean(existing) })
    if (existing) {
      throw new AppError('Email already registered', 400)
    }

    const passwordHash = await bcrypt.hash(data.password, 12)
    console.log('[Auth] register password hashed')
    authDebug('register password hashed')

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: passwordHash,
        company: data.company,
      },
      select: { id: true, name: true, email: true, role: true, company: true, created_at: true },
    })
    console.log('[Auth] register user created', { userId: user.id })
    authDebug('register user created', { userId: user.id })

    const payload = { userId: user.id, email: user.email, role: user.role as 'admin' | 'project_manager' | 'team_member' }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)
    console.log('[Auth] register tokens generated')
    authDebug('register tokens generated')

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.status(201).json({ user, accessToken, refreshToken })
  } catch (err) {
    console.error('[Auth] register failed', err)
    authDebug('register failed', { error: (err as Error).message, stack: (err as Error).stack })
    next(err)
  }
}))

router.post('/login', asyncHandler(async (req, res: Response, next) => {
  console.log('[Auth] login start', { body: req.body })
  try {
    const data = loginSchema.parse(req.body)
    console.log('[Auth] login validated', { email: data.email })

    const user = await prisma.user.findUnique({ where: { email: data.email } })
    console.log('[Auth] login user lookup', { email: data.email, found: Boolean(user) })
    if (!user) {
      throw new AppError('Invalid email or password', 401)
    }

    const valid = await bcrypt.compare(data.password, user.password)
    console.log('[Auth] login password compare', { valid })
    if (!valid) {
      throw new AppError('Invalid email or password', 401)
    }

    const payload = { userId: user.id, email: user.email, role: user.role as 'admin' | 'project_manager' | 'team_member' }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)
    console.log('[Auth] login tokens generated')

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
    console.error('[Auth] login failed', err)
    next(err)
  }
}))

router.post('/refresh', asyncHandler(async (req, res: Response, next) => {
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
}))

router.post('/logout', (_req: AuthRequest, res: Response) => {
  res.clearCookie('refreshToken')
  res.json({ message: 'Logged out' })
})

export { router as authRouter }
