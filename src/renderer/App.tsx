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
import { api } from './lib/api'

function AppContent() {
  const { isAuthenticated, isLoading, accessToken } = useAuth()
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

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
    if (page !== 'project-detail') {
      setActiveProjectId(undefined)
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />
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

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  )
}