import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
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
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (data: { name: string; email: string; password: string; company?: string }, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  refreshAccessToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'taskflow_tokens'
const REMEMBER_KEY = 'taskflow_remember'

function getStorage(rememberMe: boolean): Storage {
  return rememberMe ? localStorage : sessionStorage
}

function loadRememberMe(): boolean {
  try {
    return localStorage.getItem(REMEMBER_KEY) === 'true'
  } catch { return false }
}

function saveRememberMe(rememberMe: boolean) {
  if (rememberMe) {
    localStorage.setItem(REMEMBER_KEY, 'true')
  } else {
    localStorage.removeItem(REMEMBER_KEY)
  }
}

function loadTokens(): { accessToken: string | null; refreshToken: string | null } {
  const rememberMe = loadRememberMe()
  const storage = getStorage(rememberMe)
  try {
    const stored = storage.getItem(TOKEN_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return { accessToken: null, refreshToken: null }
}

function saveTokens(accessToken: string | null, refreshToken: string | null) {
  const rememberMe = loadRememberMe()
  const storage = getStorage(rememberMe)
  if (accessToken && refreshToken) {
    storage.setItem(TOKEN_KEY, JSON.stringify({ accessToken, refreshToken }))
  } else {
    storage.removeItem(TOKEN_KEY)
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

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const tokens = loadTokens()
    if (!tokens.refreshToken) return false
    try {
      const result = await api.refresh(tokens.refreshToken)
      saveTokens(result.accessToken, result.refreshToken)
      setState(s => ({ ...s, accessToken: result.accessToken, refreshToken: result.refreshToken }))
      return true
    } catch {
      saveTokens(null, null)
      setState(s => ({ ...s, user: null, accessToken: null, refreshToken: null, isAuthenticated: false }))
      return false
    }
  }, [])

  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (state.accessToken) {
      api.getMe(state.accessToken)
        .then(user => setState(s => ({ ...s, user, isLoading: false })))
        .catch(async () => {
          const refreshed = await refreshAccessToken()
          if (refreshed) {
            const tokens = loadTokens()
            if (tokens.accessToken) {
              try {
                const user = await api.getMe(tokens.accessToken)
                setState(s => ({ ...s, user, isLoading: false }))
                return
              } catch {}
            }
          }
          saveTokens(null, null)
          setState(s => ({ ...s, user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false }))
        })
    } else {
      setState(s => ({ ...s, isLoading: false }))
    }
  }, [])

  const login = useCallback(async (email: string, password: string, rememberMe?: boolean) => {
    const persist = rememberMe ?? true
    saveRememberMe(persist)
    const result = await api.login(email, password)
    saveTokens(result.accessToken, result.refreshToken)
    setState({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    })
  }, [])

  const register = useCallback(async (data: { name: string; email: string; password: string; company?: string }, rememberMe?: boolean) => {
    const persist = rememberMe ?? true
    saveRememberMe(persist)
    const result = await api.register(data)
    saveTokens(result.accessToken, result.refreshToken)
    setState({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    })
  }, [])

  const logout = useCallback(async () => {
    try { await api.logout(state.accessToken) } catch { /* ignore */ }
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
