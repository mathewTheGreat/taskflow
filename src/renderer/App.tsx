import { useState, useEffect, useCallback } from 'react'
import { AuthProvider, useAuth } from './lib/auth'
import { ThemeProvider } from './theme/theme-provider'
import { LoginPage } from './pages/Login'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { DashboardPage } from './pages/Dashboard'
import { ProjectsPage } from './pages/Projects'
import { ProjectDetailPage } from './pages/ProjectDetail'
import { TeamsPage } from './pages/Teams'
import { SettingsPage } from './pages/Settings'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { ToastProvider } from './components/shared/Toast'
import { api } from './lib/api'

function AppContent() {
  const { isAuthenticated, isLoading, accessToken, isOffline, pendingSyncCount } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>()
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])

  const loadSidebarProjects = useCallback(() => {
    if (accessToken) {
      api.getProjects(accessToken).then(result => {
        setProjects(result.projects.map(p => ({ id: p.id, name: p.name })))
      }).catch(() => {})
    }
  }, [accessToken])

  useEffect(() => {
    loadSidebarProjects()
  }, [loadSidebarProjects])

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading__text">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  const activeProject = projects.find(p => p.id === activeProjectId)

  const handleProjectSelect = (id: string) => {
    setActiveProjectId(id)
    setCurrentPage('project-detail')
  }

  const handleNavigate = (page: string, projectId?: string) => {
    setCurrentPage(page)
    if (page === 'project-detail' && projectId) {
      setActiveProjectId(projectId)
    } else if (page !== 'project-detail') {
      setActiveProjectId(undefined)
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />
      case 'projects':
        return <ProjectsPage onProjectSelect={handleProjectSelect} onProjectCreated={loadSidebarProjects} />
      case 'project-detail':
        return activeProjectId ? (
          <ProjectDetailPage projectId={activeProjectId} onBack={() => handleNavigate('projects')} />
        ) : (
          <ProjectsPage onProjectSelect={handleProjectSelect} onProjectCreated={loadSidebarProjects} />
        )
      case 'teams':
        return <TeamsPage />
      case 'settings':
        return <SettingsPage />
      case 'analytics':
        return (
          <div className="placeholder-page">
            <p className="placeholder-page__text">Analytics coming in Phase 3</p>
          </div>
        )
      case 'inbox':
        return (
          <div className="placeholder-page">
            <p className="placeholder-page__text">Inbox coming in Phase 2</p>
          </div>
        )
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className="app-layout">
      {isOffline && (
        <div className="offline-banner">
          <div className="offline-banner__content">
            <IconWifiOff />
            <span>You are offline — showing cached data</span>
            {pendingSyncCount > 0 && (
              <span className="offline-banner__pending">{pendingSyncCount} pending changes</span>
            )}
          </div>
        </div>
      )}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        projects={projects}
        onProjectSelect={handleProjectSelect}
        activeProjectId={activeProjectId}
      />
      <div className="app-main">
        <TopBar
          currentPage={currentPage}
          projectName={activeProject?.name}
        />
        <main className="app-main__content">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

function IconWifiOff() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
      <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0122.56 9" />
      <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
      <path d="M8.53 16.11a6 6 0 016.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  )
}