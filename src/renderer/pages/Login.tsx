import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { Button } from './../components/ui/Button'
import { Input } from './../components/ui/Input'
import { Card } from './../components/ui/Card'

export function LoginPage() {
  const { login, register } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        await register({ name, email, password, company: company || undefined })
      } else {
        await login(email, password)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsRegister(!isRegister)
    setError('')
  }

  return (
    <div className="auth-page">
      <div className="auth-page__left">
        <div className="auth-brand">
          <div className="auth-brand__badge">
            <IconCheckbox />
          </div>
          <div className="auth-brand__heading">
            <h1 className="auth-title">TaskFlow</h1>
            <p className="auth-subtitle">
              A calm, elegant workspace for tracking teams, projects, and delivery.
            </p>
          </div>
          <ul className="auth-features">
            <li>
              <IconCheck />
              Track tasks across teams and projects
            </li>
            <li>
              <IconCheck />
              Real-time collaboration and updates
            </li>
            <li>
              <IconCheck />
              Secure, role-based access control
            </li>
          </ul>
        </div>
      </div>

      <div className="auth-page__right">
        <Card padding="none" className="auth-card">
          <div className="auth-card-header">
            <h2 className="auth-card-title">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="auth-card-subtitle">
              {isRegister
                ? 'Register once, access all your projects securely.'
                : 'Sign in to continue managing your work.'}
            </p>
          </div>

          {error && <div className="auth-alert">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <Input
                label="Full Name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="auth-field"
              />
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="auth-field"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="auth-field"
            />

            {isRegister && (
              <Input
                label="Company (optional)"
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Acme Inc"
                className="auth-field"
              />
            )}

            <Button type="submit" className="w-full mt-1" disabled={loading}>
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="auth-toggle">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <button type="button" onClick={toggleMode}>
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}

function IconCheckbox() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
