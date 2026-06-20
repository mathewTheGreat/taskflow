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
      <div className="dashboard-loading">
        <div className="app-loading__text">Loading dashboard...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="dashboard-loading">
        <div className="app-loading__text">Failed to load dashboard</div>
      </div>
    )
  }

  const { my_tasks, project_summary, recent_activity } = data

  return (
    <div className="dashboard">
      <div className="dashboard-stats">
        <StatCard label="Total Projects" value={project_summary.total_projects} icon={<IconFolder />} color="brand" />
        <StatCard label="Total Tasks" value={project_summary.total_tasks} icon={<IconList />} color="info" />
        <StatCard label="Completed" value={project_summary.completed_tasks} icon={<IconCheck />} color="success" />
        <StatCard label="Overdue" value={project_summary.overdue_tasks} icon={<IconAlert />} color="danger" />
      </div>

      <div className="dashboard-grid">
        <Card>
          <CardHeader title="My Tasks" subtitle="Your task overview" />
          <div className="dashboard-stat-rows">
            <TaskStatRow label="Due Today" count={my_tasks.due_today} variant="warning" />
            <TaskStatRow label="Overdue" count={my_tasks.overdue} variant="danger" />
            <TaskStatRow label="Completed" count={my_tasks.completed} variant="success" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Project Progress" subtitle="Overall completion" />
          <div className="donut-wrapper">
            <div className="donut-container">
              <svg className="donut-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#E0E0E0" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="var(--color-success-500)" strokeWidth="8"
                  strokeDasharray={`${(project_summary.completed_tasks / Math.max(project_summary.total_tasks, 1)) * 264} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="donut-center">
                <span className="donut-center__text">
                  {Math.round((project_summary.completed_tasks / Math.max(project_summary.total_tasks, 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>
          <div className="donut-legend">
            <span className="donut-legend__item">
              <span className="donut-legend__dot bg-emerald-500" /> Completed
            </span>
            <span className="donut-legend__item">
              <span className="donut-legend__dot bg-neutral-300" /> Remaining
            </span>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Activity" subtitle="Latest updates" />
          <div className="activity-list">
            {recent_activity.length === 0 ? (
              <p className="activity-empty">No recent activity</p>
            ) : (
              recent_activity.map(item => (
                <div key={item.id} className="activity-item">
                  <div className="activity-item__dot" />
                  <div className="activity-item__content">
                    <p className="activity-item__message">{item.message}</p>
                    <p className="activity-item__time">
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
  return (
    <Card padding="md">
      <div className="stat-card__inner">
        <div>
          <p className="stat-card__label">{label}</p>
          <p className="stat-card__value">{value}</p>
        </div>
        <div className={`stat-card__icon stat-card__icon--${color}`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

function TaskStatRow({ label, count, variant }: { label: string; count: number; variant: string }) {
  return (
    <div className="task-stat-row">
      <span className="task-stat-row__label">{label}</span>
      <Badge variant={variant as 'warning' | 'danger' | 'success'}>{count}</Badge>
    </div>
  )
}

function IconFolder() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> }
function IconList() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> }
function IconCheck() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
function IconAlert() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }