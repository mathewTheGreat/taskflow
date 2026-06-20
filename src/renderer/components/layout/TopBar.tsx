import { useAuth } from '../../lib/auth'
import { useTheme } from '../../theme/theme-provider'
import { Avatar } from '../shared/Avatar'

type ViewTab = 'spreadsheet' | 'timeline' | 'calendar' | 'board'

interface TopBarProps {
  currentPage: string
  projectName?: string
  searchValue: string
  onSearchChange: (value: string) => void
  activeView?: ViewTab
  onViewChange?: (view: ViewTab) => void
}

const viewTabs: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
  { id: 'spreadsheet', label: 'Spreadsheet', icon: <IconSpreadsheet /> },
  { id: 'timeline', label: 'Timeline', icon: <IconTimeline /> },
  { id: 'calendar', label: 'Calendar', icon: <IconCalendar /> },
  { id: 'board', label: 'Board', icon: <IconBoard /> },
]

export function TopBar({ currentPage, projectName, searchValue, onSearchChange, activeView = 'spreadsheet', onViewChange }: TopBarProps) {
  const { user } = useAuth()
  const { toggleTheme, theme } = useTheme()

  const isProjectDetail = currentPage === 'project-detail'

  return (
    <div className="border-b border-border bg-surface">
      {/* Top row: breadcrumbs + actions */}
      <div className="flex items-center justify-between px-6 py-3">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[13px]">
          {isProjectDetail ? (
            <>
              <span className="text-text-tertiary cursor-pointer hover:text-text-secondary transition-colors">Projects</span>
              <IconChevronRight className="text-text-tertiary" />
              <span className="text-text-primary font-medium">{projectName || 'Project'}</span>
              <button className="text-text-tertiary hover:text-text-secondary ml-1 border-none bg-transparent cursor-pointer p-0">
                <IconDotsHorizontal />
              </button>
            </>
          ) : (
            <span className="text-text-primary font-semibold text-[15px]">
              {currentPage === 'dashboard' && 'Dashboard'}
              {currentPage === 'teams' && 'Teams'}
              {currentPage === 'inbox' && 'Inbox'}
              {currentPage === 'settings' && 'Settings'}
              {currentPage === 'projects' && 'Projects'}
              {currentPage === 'analytics' && 'Analytics'}
              {!['dashboard', 'teams', 'inbox', 'settings', 'projects', 'analytics'].includes(currentPage) && 'TaskFlow'}
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md hover:bg-surface-secondary text-text-tertiary transition-colors border-none bg-transparent cursor-pointer"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <IconMoon /> : <IconSun />}
          </button>

          <button className="p-1.5 rounded-md hover:bg-surface-secondary text-text-tertiary transition-colors border-none bg-transparent cursor-pointer relative">
            <IconBell />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
          </button>

          <button className="bg-brand-500 text-white border-none px-3 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-brand-600 transition-colors flex items-center gap-1.5">
            <IconShare />
            Share
          </button>
        </div>
      </div>

      {/* View tabs row (only on project detail) */}
      {isProjectDetail && (
        <div className="flex items-center justify-between px-6 pb-2">
          {/* View tabs */}
          <div className="flex items-center gap-1">
            {viewTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onViewChange?.(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors border-none cursor-pointer ${
                  activeView === tab.id
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-text-tertiary hover:bg-surface-secondary hover:text-text-secondary bg-transparent'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            <button className="p-1.5 rounded-md text-text-tertiary hover:bg-surface-secondary hover:text-text-secondary transition-colors border-none bg-transparent cursor-pointer">
              <IconPlus />
            </button>
          </div>

          {/* Search + Filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 text-[13px] bg-surface-secondary">
              <IconSearch />
              <input
                type="text"
                placeholder="Search task..."
                value={searchValue}
                onChange={e => onSearchChange(e.target.value)}
                className="bg-transparent border-none outline-none text-[13px] text-text-primary placeholder:text-text-tertiary w-[160px]"
              />
            </div>
            <button className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-text-secondary hover:bg-surface-secondary transition-colors bg-surface cursor-pointer">
              <IconFilter />
              Filter
            </button>
            <button className="p-1.5 rounded-md text-text-tertiary hover:bg-surface-secondary hover:text-text-secondary transition-colors border-none bg-transparent cursor-pointer">
              <IconDotsHorizontal />
            </button>
          </div>
        </div>
      )}

      {/* Search bar for non-project pages */}
      {!isProjectDetail && (
        <div className="flex items-center justify-between px-6 pb-2">
          <div />
          <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 text-[13px] bg-surface-secondary w-[300px]">
            <IconSearch />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              className="bg-transparent border-none outline-none text-[13px] text-text-primary placeholder:text-text-tertiary w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Icons
function IconSearch() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function IconBell() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> }
function IconMoon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg> }
function IconSun() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> }
function IconShare() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> }
function IconChevronRight({ className = '' }: { className?: string }) { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"/></svg> }
function IconDotsHorizontal() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg> }
function IconPlus() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IconFilter() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> }
function IconSpreadsheet() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg> }
function IconTimeline() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="12" x2="22" y2="12"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/></svg> }
function IconCalendar() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function IconBoard() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="8" rx="1"/></svg> }
