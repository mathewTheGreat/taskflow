import { useTheme } from '../../theme/theme-provider'

interface TopBarProps {
  currentPage: string
  projectName?: string
}

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  teams: 'Teams',
  inbox: 'Inbox',
  settings: 'Settings',
  analytics: 'Analytics',
}

export function TopBar({ currentPage, projectName }: TopBarProps) {
  const { toggleTheme, theme } = useTheme()

  const title = currentPage === 'project-detail'
    ? (projectName || 'Project')
    : (pageTitles[currentPage] || 'TaskFlow')

  return (
    <div className="topbar">
      <div className="topbar-row">
        <div className="topbar-breadcrumbs">
          <span className="topbar-title">{title}</span>
        </div>
        <div className="topbar-actions">
          <button
            onClick={toggleTheme}
            className="topbar-icon-btn"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <IconMoon /> : <IconSun />}
          </button>
          <button className="topbar-icon-btn" title="Notifications (coming soon)">
            <IconBell />
            <span className="topbar-icon-btn__dot" />
          </button>
        </div>
      </div>
    </div>
  )
}

function IconBell() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> }
function IconMoon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg> }
function IconSun() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> }
