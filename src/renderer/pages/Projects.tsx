import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import type { Project } from '@shared/types'

export function ProjectsPage({ onProjectSelect, onProjectCreated }: { onProjectSelect: (id: string) => void; onProjectCreated?: () => void }) {
  const { accessToken } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [createError, setCreateError] = useState('')

  const loadProjects = async () => {
    if (!accessToken) return
    try {
      const result = await api.getProjects(accessToken, search ? { search } : undefined)
      setProjects(result.projects)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProjects() }, [accessToken])

  useEffect(() => {
    const timer = setTimeout(loadProjects, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleCreate = async () => {
    if (!accessToken || !newName.trim()) return
    setCreateError('')
    try {
      await api.createProject(accessToken, { name: newName, description: newDesc || undefined })
      setNewName('')
      setNewDesc('')
      setShowCreate(false)
      loadProjects()
      onProjectCreated?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project'
      setCreateError(message)
    }
  }

  return (
    <div className="projects-page">
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} projects`}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <IconPlus /> New Project
          </Button>
        }
      />

      <div className="project-search">
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          icon={<IconSearch />}
        />
      </div>

      {showCreate && (
        <Card className="mb-4" padding="md">
          <h3 className="detail-create-task__title">Create New Project</h3>
          <div className="flex flex-col gap-3">
            {createError && <p className="create-form__error">{createError}</p>}
            <Input placeholder="Project name" value={newName} onChange={e => setNewName(e.target.value)} />
            <Input placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            <div className="create-form__actions">
              <Button variant="ghost" onClick={() => { setShowCreate(false); setCreateError('') }}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="loading-text">Loading...</div>
      ) : projects.length === 0 ? (
        <Card className="project-empty">
          <p className="project-empty__text">No projects yet</p>
          <Button onClick={() => setShowCreate(true)}>Create your first project</Button>
        </Card>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} onClick={() => onProjectSelect(project.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const progress = project.task_count ? Math.round((project.completed_count / project.task_count) * 100) : 0

  return (
    <Card className="project-card" padding="md" onClick={onClick}>
      <div className="project-card__header">
        <div className="project-card__body">
          <h3 className="project-card__name">{project.name}</h3>
          {project.description && (
            <p className="project-card__desc">{project.description}</p>
          )}
        </div>
        <Badge variant={project.status === 'active' ? 'success' : 'default'}>
          {project.status}
        </Badge>
      </div>

      <div className="project-card__meta">
        <span>{project.task_count} tasks</span>
        <span>{project.completed_count} completed</span>
      </div>

      <div className="project-card__progress">
        <div className="project-card__progress-bar" style={{ width: `${progress}%` }} />
      </div>
    </Card>
  )
}

function IconPlus() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IconSearch() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }