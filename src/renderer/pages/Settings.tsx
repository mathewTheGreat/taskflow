import { useAuth } from '../lib/auth'
import { useTheme } from '../theme/theme-provider'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/shared/Avatar'

export function SettingsPage() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <Card>
          <h3 className="font-semibold text-text-primary mb-4">Profile</h3>
          <div className="flex items-center gap-4 mb-4">
            <Avatar name={user?.name} size="lg" />
            <div>
              <p className="font-medium text-text-primary">{user?.name}</p>
              <p className="text-sm text-text-secondary">{user?.email}</p>
              <p className="text-xs text-text-tertiary capitalize mt-0.5">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <h3 className="font-semibold text-text-primary mb-4">Appearance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-primary">Theme</p>
                <p className="text-xs text-text-tertiary">Choose your preferred color scheme</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    theme === 'light'
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-surface text-text-secondary border-border hover:bg-surface-secondary'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    theme === 'dark'
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-surface text-text-secondary border-border hover:bg-surface-secondary'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card>
          <h3 className="font-semibold text-text-primary mb-4">About</h3>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>TaskFlow V1.0.0</p>
            <p>Phase 1 — MVP</p>
            <p className="text-text-tertiary">Built with Electron, React, Express, and PostgreSQL</p>
          </div>
        </Card>

        {/* Logout */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Sign Out</p>
              <p className="text-xs text-text-tertiary">Sign out of your account</p>
            </div>
            <Button variant="danger" size="sm" onClick={logout}>Sign Out</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
