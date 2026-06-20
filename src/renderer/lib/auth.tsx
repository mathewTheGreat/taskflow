import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { api } from './api'
import type { User, Role } from '@shared/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; password: string; company?: string }) => Promise<void>
  logout: () => Promise<void>
  refreshAccessToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'taskflow_tokens'

function loadTokens(): { accessToken: string | null; refreshToken: string | null } {
  try {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return { accessToken: null, refreshToken: null }
}

function saveTokens(accessToken: string | null, refreshToken: string | null) {
  if (accessToken && refreshToken) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ accessToken, refreshToken }))
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const tokens = loadTokens()
    return {
      user: null,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: !!tokens.accessToken,
      isLoading: !!tokens.accessToken,
    }
  })

  // Verify token on mount
  useEffect(() => {
    if (state.accessToken) {
      api.getMe(state.accessToken)
        .then(user => {
          setState(s => ({ ...s, user, isLoading: false }))
        })
        .catch(() => {
          saveTokens(null, null)
          setState(s => ({ ...s, user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false }))
        })
    } else {
      setState(s => ({ ...s, isLoading: false }))
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    console.debug('[Auth] login attempt', { email })
    const result = await api.login(email, password)
    console.debug('[Auth] login success', { email })
    saveTokens(result.accessToken, result.refreshToken)
    setState({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    })
  }, [])

  const register = useCallback(async (data: { name: string; email: string; password: string; company?: string }) => {
    console.debug('[Auth] register attempt', { email: data.email, name: data.name, company: data.company })
    const result = await api.register(data)
    console.debug('[Auth] register success', { email: data.email })
    saveTokens(result.accessToken, result.refreshToken)
    setState({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    })
  }, [])

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const tokens = loadTokens()
    if (!tokens.refreshToken) {
      console.debug('[Auth] refresh skipped, no refresh token')
      return false
    }

    try {
      console.debug('[Auth] refresh attempt')
      const result = await api.refresh(tokens.refreshToken)
      saveTokens(result.accessToken, result.refreshToken)
      setState(s => ({ ...s, accessToken: result.accessToken, refreshToken: result.refreshToken }))
      console.debug('[Auth] refresh success')
      return true
    } catch (err) {
      console.error('[Auth] refresh failed', err)
      saveTokens(null, null)
      setState(s => ({ ...s, user: null, accessToken: null, refreshToken: null, isAuthenticated: false }))
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout(state.accessToken)
    } catch { /* ignore */ }
    saveTokens(null, null)
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }, [state.accessToken])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function hasRole(user: User | null, ...roles: Role[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}
