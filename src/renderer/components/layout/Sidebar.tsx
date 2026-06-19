import { useState, type ReactNode } from 'react'
import { useAuth } from '../../lib/auth'

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

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <IconGrid />, active: currentPage === 'dashboard', onClick: () => onNavigate('dashboard') },
    { label: 'Inbox', icon: <IconInbox />, badge: 4, active: currentPage === 'inbox', onClick: () => onNavigate('inbox') },
    { label: 'Teams', icon: <IconUsers />, active: currentPage === 'teams', onClick: () => onNavigate('teams') },
    { label: 'Analytics', icon: <IconChart />, active: currentPage === 'analytics', onClick: () => onNavigate('analytics') },
    { label: 'Settings', icon: <IconSettings />, active: currentPage === 'settings', onClick: () => onNavigate('settings') },
  ]

  return (
    <div className="w-[230px] flex-shrink-0 border-r border-border bg-surface flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-4">
        <div className="w-6 h-6 rounded-md bg-accent-50 flex items-center justify-center text-accent-500">
          <IconCheckbox />
        </div>
        <span className="font-semibold text-base text-text-primary">TaskFlow</span>
      </div>

      {/* Workspace */}
      <div className="mx-3 mb-4">
        <div className="flex items-center justify-between border border-border rounded-lg px-3 py-2 text-sm text-text-primary cursor-pointer hover:bg-surface-secondary transition-colors">
          <span className="truncate">{user?.company || 'My Workspace'}</span>
          <IconChevronDown className="text-text-tertiary text-xs" />
        </div>
      </div>

      {/* Add New */}
      <div className="px-3 mb-4">
        <button className="w-full bg-brand-500 text-white border-none py-2.5 text-sm font-semibold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 hover:bg-brand-600 transition-colors">
          <IconPlus className="text-sm" /> Add New
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 text-sm">
        {navItems.map(item => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`flex items-center gap-2.5 px-2 py-2 rounded-md text-left transition-colors ${
              item.active
                ? 'bg-accent-50 text-accent-500 font-medium'
                : 'text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            <span className="text-[17px]">{item.icon}</span>
            {item.label}
            {item.badge && (
              <span className="ml-auto bg-danger-500 text-white text-[10px] rounded-md px-1.5 py-0.5 font-medium">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="border-t border-border my-3 mx-0" />

      {/* Projects */}
      <div className="px-3">
        <button
          onClick={() => setProjectsExpanded(!projectsExpanded)}
          className="flex items-center gap-1.5 text-xs text-text-tertiary font-medium px-2 py-1.5 w-full hover:text-text-secondary transition-colors"
        >
          <IconPlus className="text-xs" /> Add Projects
        </button>
      </div>

      {projectsExpanded && (
        <div className="flex flex-col gap-0.5 px-3 mt-1 text-sm overflow-y-auto flex-1">
          <div className="flex items-center gap-2 px-2 py-2 font-semibold text-text-primary cursor-pointer">
            <IconFolder className="text-text-tertiary text-[15px]" />
            <span className="flex-1">Projects</span>
            <IconChevronUp className="text-text-tertiary text-xs" />
          </div>
          <div className="flex flex-col gap-0 pl-6">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => onProjectSelect(p.id)}
                className={`flex items-center gap-2 py-1.5 px-2 rounded-md text-[13.5px] text-left transition-colors ${
                  activeProjectId === p.id
                    ? 'bg-accent-50 text-accent-500 font-medium'
                    : 'text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                <IconList className="text-[15px]" />
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom */}
      <div className="mt-auto px-3 pb-4 pt-2 flex gap-2">
        <button className="flex-1 py-2 text-xs font-medium rounded-lg bg-brand-50 text-brand-600 border-none cursor-pointer hover:bg-brand-100 transition-colors">
          Invite Team
        </button>
        <button className="flex-1 py-2 text-xs font-medium rounded-lg bg-surface text-text-primary border border-border cursor-pointer hover:bg-surface-secondary transition-colors">
          Help
        </button>
      </div>
    </div>
  )
}

// Inline SVG icons (Tabler-style)
function IconGrid() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function IconInbox() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg> }
function IconUsers() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> }
function IconChart() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> }
function IconSettings() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> }
function IconPlus({ className = '' }: { className?: string }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IconChevronDown({ className = '' }: { className?: string }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"/></svg> }
function IconChevronUp({ className = '' }: { className?: string }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="18 15 12 9 6 15"/></svg> }
function IconFolder({ className = '' }: { className?: string }) { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> }
function IconList({ className = '' }: { className?: string }) { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> }
function IconCheckbox() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> }
