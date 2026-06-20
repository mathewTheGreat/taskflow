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

      <div className="settings-wrapper">
        <Card>
          <h3 className="settings-section__title">Profile</h3>
          <div className="settings-profile">
            <Avatar name={user?.name} size="lg" />
            <div>
              <p className="settings-profile__name">{user?.name}</p>
              <p className="settings-profile__email">{user?.email}</p>
              <p className="settings-profile__role">{user?.role?.replace('_', ' ')}</p>
              {user?.role === 'admin' && <p className="settings-profile__desc settings-profile__desc--admin">Full access</p>}
              {user?.role === 'project_manager' && <p className="settings-profile__desc settings-profile__desc--pm">Can manage projects and teams</p>}
              {user?.role === 'team_member' && <p className="settings-profile__desc settings-profile__desc--member">Can create and work on tasks</p>}
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="settings-section__title">Appearance</h3>
          <div className="settings-appearance-body">
            <div className="settings-theme-row">
              <div>
                <p className="settings-theme-row__label">Theme</p>
                <p className="settings-theme-row__desc">Choose your preferred color scheme</p>
              </div>
              <div className="settings-theme-btns">
                <button
                  onClick={() => setTheme('light')}
                  className={`settings-theme-btn${theme === 'light' ? ' settings-theme-btn--active' : ''}`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`settings-theme-btn${theme === 'dark' ? ' settings-theme-btn--active' : ''}`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="settings-section__title">About</h3>
          <div className="settings-about-body settings-about-text">
            <p>TaskFlow V1.0.0</p>
            <p>Phase 1 — MVP</p>
            <p className="settings-about-muted">Built with Electron, React, Express, and PostgreSQL</p>
          </div>
        </Card>

        <Card>
          <div className="settings-signout-row">
            <div>
              <p className="settings-signout__title">Sign Out</p>
              <p className="settings-signout__desc">Sign out of your account</p>
            </div>
            <Button variant="danger" size="sm" onClick={logout}>Sign Out</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}