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
    <div className="w-[230px] flex-shrink-0 border-r border-border bg-surface flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-4">
        <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-sm">
          <IconCheckbox />
        </div>
        <span className="font-semibold text-[16px] text-text-primary tracking-tight">TaskFlow</span>
      </div>

      {/* Workspace dropdown */}
      <div className="mx-4 mb-4">
        <button className="w-full flex items-center justify-between rounded-lg px-3.5 py-2.5 text-[13px] text-text-secondary border border-border hover:bg-surface-secondary transition-colors cursor-pointer bg-surface">
          <span className="truncate font-medium">{user?.company || 'My Workspace'}</span>
          <IconChevronDown className="text-text-tertiary" />
        </button>
      </div>

      {/* Add New */}
      <div className="px-4 mb-5">
        <button className="w-full bg-brand-500 text-white border-none py-2.5 text-[13px] font-semibold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 hover:bg-brand-600 transition-colors shadow-sm">
          <IconPlus className="text-sm" /> Add New
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 px-3 text-[13.5px]">
        {navItems.map(item => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`flex items-center gap-3 px-3 py-[8px] rounded-lg text-left transition-colors border-none cursor-pointer ${
              item.active
                ? 'bg-brand-50 text-brand-600 font-semibold'
                : 'text-text-secondary hover:bg-surface-secondary bg-transparent'
            }`}
          >
            <span className="text-[17px] flex-shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="bg-danger-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-semibold leading-none">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Favorites section */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between px-2 py-1">
          <button
            onClick={() => setFavoritesExpanded(!favoritesExpanded)}
            className="flex items-center gap-1.5 text-[11.5px] font-semibold text-text-tertiary uppercase tracking-wider hover:text-text-secondary transition-colors border-none bg-transparent cursor-pointer p-0"
          >
            {favoritesExpanded ? <IconChevronDown className="text-[10px]" /> : <IconChevronRight className="text-[10px]" />}
            Favorites
          </button>
          <button className="text-text-tertiary hover:text-text-secondary transition-colors border-none bg-transparent cursor-pointer p-0 text-sm">
            <IconDotsHorizontal />
          </button>
        </div>
        {favoritesExpanded && (
          <div className="ml-1 mt-1 text-[13px] text-text-tertiary italic px-2.5 py-2">
            No favorites yet
          </div>
        )}
      </div>

      {/* Projects section */}
      <div className="mt-4 px-4">
        <div className="flex items-center justify-between px-2 py-1">
          <button
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="flex items-center gap-1.5 text-[11.5px] font-semibold text-text-tertiary uppercase tracking-wider hover:text-text-secondary transition-colors border-none bg-transparent cursor-pointer p-0"
          >
            {projectsExpanded ? <IconChevronDown className="text-[10px]" /> : <IconChevronRight className="text-[10px]" />}
            Projects
          </button>
          <button className="text-text-tertiary hover:text-text-secondary transition-colors border-none bg-transparent cursor-pointer p-0 text-sm">
            <IconPlus className="text-[12px]" />
          </button>
        </div>
        {projectsExpanded && (
          <div className="flex flex-col gap-0.5 mt-1 ml-1">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => onProjectSelect(p.id)}
                className={`flex items-center gap-2.5 py-[6px] px-3 rounded-lg text-[13px] text-left transition-colors border-none cursor-pointer ${
                  activeProjectId === p.id
                    ? 'bg-brand-50 text-brand-600 font-medium'
                    : 'text-text-secondary hover:bg-surface-secondary bg-transparent'
                }`}
              >
                <IconProject className="text-text-tertiary flex-shrink-0" />
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom nav */}
      <nav className="flex flex-col gap-0.5 px-3 text-[13.5px] mb-3">
        {bottomItems.map(item => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`flex items-center gap-3 px-3 py-[8px] rounded-lg text-left transition-colors border-none cursor-pointer ${
              item.active
                ? 'bg-brand-50 text-brand-600 font-medium'
                : 'text-text-secondary hover:bg-surface-secondary bg-transparent'
            }`}
          >
            <span className="text-[17px] flex-shrink-0">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* User profile */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3 px-2">
          <Avatar name={user?.name || 'User'} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-text-primary truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] text-text-tertiary truncate">{user?.email || ''}</p>
          </div>
          <button className="text-text-tertiary hover:text-text-secondary transition-colors border-none bg-transparent cursor-pointer p-0">
            <IconChevronDown className="text-[12px]" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Icons — Tabler-style, clean and minimal
function IconCheckbox() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> }
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
