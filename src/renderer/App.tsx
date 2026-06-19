import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './lib/auth'
import { ThemeProvider } from './theme/theme-provider'
import { LoginPage } from './pages/Login'
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
  const [searchValue, setSearchValue] = useState('')
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])

  // Load projects for sidebar
  useEffect(() => {
    if (accessToken) {
      api.getProjects(accessToken).then(result => {
        setProjects(result.projects.map(p => ({ id: p.id, name: p.name })))
      }).catch(() => {})
    }
  }, [accessToken])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-tertiary flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

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
        return <ProjectsPage onProjectSelect={handleProjectSelect} />
      case 'project-detail':
        return activeProjectId ? (
          <ProjectDetailPage projectId={activeProjectId} onBack={() => handleNavigate('projects')} />
        ) : (
          <ProjectsPage onProjectSelect={handleProjectSelect} />
        )
      case 'teams':
        return <TeamsPage />
      case 'settings':
        return <SettingsPage />
      case 'analytics':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-text-secondary">Analytics coming in Phase 3</div>
          </div>
        )
      case 'inbox':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-text-secondary">Inbox coming in Phase 2</div>
          </div>
        )
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className="h-screen flex bg-surface-tertiary">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        projects={projects}
        onProjectSelect={handleProjectSelect}
        activeProjectId={activeProjectId}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar searchValue={searchValue} onSearchChange={setSearchValue} />
        <main className="flex-1 overflow-y-auto p-6">
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
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}
