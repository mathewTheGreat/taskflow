import { useState, type ReactNode } from 'react'
import { useAuth } from '../../lib/auth'
import { Avatar } from '../shared/Avatar'

interface NavItem {
  label: string
  icon: ReactNode
  badge?: number
  active?: boolean
  onClick?: () => void
}

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
  projects: { id: string; name: string }[]
  onProjectSelect: (id: string) => void
  activeProjectId?: string
}

export function Sidebar({ currentPage, onNavigate, projects, onProjectSelect, activeProjectId }: SidebarProps) {
  const { user } = useAuth()
  const [projectsExpanded, setProjectsExpanded] = useState(true)
  const [favoritesExpanded, setFavoritesExpanded] = useState(true)

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <IconDashboard />, active: currentPage === 'dashboard', onClick: () => onNavigate('dashboard') },
    { label: 'Inbox', icon: <IconInbox />, badge: 4, active: currentPage === 'inbox', onClick: () => onNavigate('inbox') },
    { label: 'Teams', icon: <IconTeams />, active: currentPage === 'teams', onClick: () => onNavigate('teams') },
    { label: 'Assigned to me', icon: <IconAssigned />, active: currentPage === 'assigned', onClick: () => onNavigate('assigned') },
    { label: 'Created by me', icon: <IconCreated />, active: currentPage === 'created', onClick: () => onNavigate('created') },
  ]

  const bottomItems: NavItem[] = [
    { label: 'Settings', icon: <IconSettings />, active: currentPage === 'settings', onClick: () => onNavigate('settings') },
    { label: 'Help Center', icon: <IconHelp />, active: currentPage === 'help', onClick: () => onNavigate('help') },
  ]

  return (
    <div className="app-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand__icon">
          <img src="./favicon.png" alt="TaskFlow" className="sidebar-brand__img" />
        </div>
        <span className="sidebar-brand__name">TaskFlow</span>
      </div>

      <div className="sidebar-workspace">
        <button onClick={() => onNavigate('settings')} className="sidebar-workspace__btn">
          <span className="truncate font-medium">{user?.company || 'My Workspace'}</span>
          <IconChevronDown />
        </button>
      </div>

      <div className="sidebar-add-new">
        <button onClick={() => onNavigate('projects')} className="sidebar-add-new__btn">
          <IconPlus /> Add New
        </button>
      </div>

      <div className="sidebar-scrollable">
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`sidebar-nav-item ${item.active ? 'sidebar-nav-item--active' : ''}`}
            >
              <span className="sidebar-nav-item__icon">{item.icon}</span>
              <span className="sidebar-nav-item__label">{item.label}</span>
              {item.badge && (
                <span className="sidebar-nav-item__badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <button
              onClick={() => setFavoritesExpanded(!favoritesExpanded)}
              className="sidebar-section-toggle"
            >
              {favoritesExpanded ? <IconChevronDown /> : <IconChevronRight />}
              Favorites
            </button>
            <button className="sidebar-section-action" title="Manage favorites (coming soon)">
              <IconDotsHorizontal />
            </button>
          </div>
          {favoritesExpanded && (
            <div className="sidebar-section-empty">No favorites yet</div>
          )}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="sidebar-section-toggle"
            >
              {projectsExpanded ? <IconChevronDown /> : <IconChevronRight />}
              Projects
            </button>
            <button onClick={() => onNavigate('projects')} className="sidebar-section-action">
              <IconPlus />
            </button>
          </div>
          {projectsExpanded && (
            <div className="sidebar-project-list">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => onProjectSelect(p.id)}
                  className={`sidebar-project-item ${activeProjectId === p.id ? 'sidebar-project-item--active' : ''}`}
                >
                  <span className="sidebar-project-item__icon"><IconProject /></span>
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="sidebar-bottom">
        {bottomItems.map(item => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`sidebar-nav-item ${item.active ? 'sidebar-nav-item--active' : ''}`}
          >
            <span className="sidebar-nav-item__icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user__inner">
          <Avatar name={user?.name || 'User'} size="sm" />
          <div className="sidebar-user__info">
            <p className="sidebar-user__name">{user?.name || 'User'}</p>
            <p className="sidebar-user__email">{user?.email || ''}</p>
          </div>
          <button onClick={() => onNavigate('settings')} className="sidebar-user__chevron">
            <IconChevronDown />
          </button>
        </div>
      </div>
    </div>
  )
}

// Icons — Tabler-style, clean and minimal
function IconDashboard() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function IconInbox() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg> }
function IconTeams() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> }
function IconAssigned() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> }
function IconCreated() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> }
function IconSettings() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> }
function IconHelp() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function IconPlus({ className = '' }: { className?: string }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IconChevronDown({ className = '' }: { className?: string }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"/></svg> }
function IconChevronRight({ className = '' }: { className?: string }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"/></svg> }
function IconDotsHorizontal() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg> }
function IconProject({ className = '' }: { className?: string }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> }