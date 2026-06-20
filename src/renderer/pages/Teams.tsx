import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Avatar } from '../components/shared/Avatar'
import type { Team, User } from '@shared/types'

export function TeamsPage() {
  const { accessToken } = useAuth()
  const [teams, setTeams] = useState<(Team & { member_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<(Team & { members: User[] }) | null>(null)

  const loadTeams = async () => {
    if (!accessToken) return
    try {
      const result = await api.getTeams(accessToken)
      setTeams(result.teams)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTeams() }, [accessToken])

  const handleCreate = async () => {
    if (!accessToken || !newName.trim()) return
    try {
      await api.createTeam(accessToken, { name: newName, description: newDesc || undefined })
      setNewName('')
      setNewDesc('')
      setShowCreate(false)
      loadTeams()
    } catch (err) {
      console.error(err)
    }
  }

  const loadTeamDetail = async (id: string) => {
    if (!accessToken) return
    try {
      const team = await api.getTeam(accessToken, id)
      setSelectedTeam(team)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <PageHeader
        title="Teams"
        subtitle={`${teams.length} teams`}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <IconPlus /> New Team
          </Button>
        }
      />

      {showCreate && (
        <Card className="mb-4">
          <h3 className="settings-section__title">Create New Team</h3>
          <div className="flex flex-col gap-3">
            <Input placeholder="Team name" value={newName} onChange={e => setNewName(e.target.value)} />
            <Input placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            <div className="create-form__actions">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="loading-text">Loading...</div>
      ) : teams.length === 0 ? (
        <Card className="project-empty">
          <p className="project-empty__text">No teams yet</p>
          <Button onClick={() => setShowCreate(true)}>Create your first team</Button>
        </Card>
      ) : (
        <div className="projects-grid">
          {teams.map(team => (
            <Card
              key={team.id}
              className="project-card"
              onClick={() => loadTeamDetail(team.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="project-card__name">{team.name}</h3>
                  {team.description && (
                    <p className="project-card__desc">{team.description}</p>
                  )}
                </div>
              </div>
              <div className="project-card__meta">
                <IconUsers />
                <span>{team.member_count} members</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Team detail modal */}
      {selectedTeam && (
        <div className="team-modal-overlay" onClick={() => setSelectedTeam(null)}>
          <Card className="w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <CardHeader
              title={selectedTeam.name}
              subtitle={`${selectedTeam.members.length} members`}
              action={
                <button onClick={() => setSelectedTeam(null)} className="team-modal-close">
                  <IconX />
                </button>
              }
            />
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedTeam.members.map(member => (
                <div key={member.id} className="member-item">
                  <Avatar name={member.name} size="md" />
                  <div className="flex-1">
                    <p className="member-item__name">{member.name}</p>
                    <p className="member-item__email">{member.email}</p>
                  </div>
                  <span className="member-item__role">{member.role.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function IconPlus() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IconUsers() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> }
function IconX() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
