import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import type { Project } from '@shared/types'

export function ProjectsPage({ onProjectSelect }: { onProjectSelect: (id: string) => void }) {
  const { accessToken } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

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
    try {
      await api.createProject(accessToken, { name: newName, description: newDesc || undefined })
      setNewName('')
      setNewDesc('')
      setShowCreate(false)
      loadProjects()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} projects`}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <IconPlus /> New Project
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          icon={<IconSearch />}
        />
      </div>

      {/* Create form */}
      {showCreate && (
        <Card className="mb-4">
          <h3 className="font-semibold text-text-primary mb-3">Create New Project</h3>
          <div className="flex flex-col gap-3">
            <Input placeholder="Project name" value={newName} onChange={e => setNewName(e.target.value)} />
            <Input placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Project list */}
      {loading ? (
        <div className="text-center py-8 text-text-secondary">Loading...</div>
      ) : projects.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary mb-4">No projects yet</p>
          <Button onClick={() => setShowCreate(true)}>Create your first project</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-text-primary">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">{project.description}</p>
          )}
        </div>
        <Badge variant={project.status === 'active' ? 'success' : 'default'}>
          {project.status}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-xs text-text-tertiary mt-4">
        <span>{project.task_count} tasks</span>
        <span>{project.completed_count} completed</span>
      </div>

      <div className="mt-2 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-success-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </Card>
  )
}

function IconPlus() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IconSearch() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
