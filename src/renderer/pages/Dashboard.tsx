import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import type { DashboardData } from '@shared/types'

export function DashboardPage() {
  const { accessToken } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return
    api.getDashboard(accessToken)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [accessToken])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading dashboard...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Failed to load dashboard</div>
      </div>
    )
  }

  const { my_tasks, project_summary, recent_activity } = data

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={project_summary.total_projects} icon={<IconFolder />} color="brand" />
        <StatCard label="Total Tasks" value={project_summary.total_tasks} icon={<IconList />} color="info" />
        <StatCard label="Completed" value={project_summary.completed_tasks} icon={<IconCheck />} color="success" />
        <StatCard label="Overdue" value={project_summary.overdue_tasks} icon={<IconAlert />} color="danger" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* My Tasks */}
        <Card className="col-span-1">
          <CardHeader title="My Tasks" subtitle="Your task overview" />
          <div className="space-y-3">
            <TaskStatRow label="Due Today" count={my_tasks.due_today} variant="warning" />
            <TaskStatRow label="Overdue" count={my_tasks.overdue} variant="danger" />
            <TaskStatRow label="Completed" count={my_tasks.completed} variant="success" />
          </div>
        </Card>

        {/* Project Progress */}
        <Card className="col-span-1">
          <CardHeader title="Project Progress" subtitle="Overall completion" />
          <div className="flex items-center justify-center py-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-neutral-100)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="var(--color-success-500)" strokeWidth="8"
                  strokeDasharray={`${(project_summary.completed_tasks / Math.max(project_summary.total_tasks, 1)) * 264} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-text-primary">
                  {Math.round((project_summary.completed_tasks / Math.max(project_summary.total_tasks, 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success-500" /> Completed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-neutral-200" /> Remaining
            </span>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-1">
          <CardHeader title="Recent Activity" subtitle="Latest updates" />
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recent_activity.length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-4">No recent activity</p>
            ) : (
              recent_activity.map(item => (
                <div key={item.id} className="flex items-start gap-2.5 text-sm">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-text-primary">{item.message}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-500',
    info: 'bg-accent-50 text-accent-500',
    success: 'bg-success-50 text-success-500',
    danger: 'bg-danger-50 text-danger-500',
  }

  return (
    <Card padding="md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

function TaskStatRow({ label, count, variant }: { label: string; count: number; variant: string }) {
  const variantMap: Record<string, string> = {
    warning: 'bg-warning-50 text-warning-500',
    danger: 'bg-danger-50 text-danger-500',
    success: 'bg-success-50 text-success-500',
  }

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-text-secondary">{label}</span>
      <Badge variant={variant as 'warning' | 'danger' | 'success'}>{count}</Badge>
    </div>
  )
}

function IconFolder() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> }
function IconList() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> }
function IconCheck() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
function IconAlert() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
