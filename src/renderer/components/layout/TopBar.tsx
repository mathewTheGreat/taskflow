import { useAuth } from '../../lib/auth'
import { useTheme } from '../../theme/theme-provider'
import { Avatar } from '../shared/Avatar'

interface TopBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
}

export function TopBar({ searchValue, onSearchChange }: TopBarProps) {
  const { user } = useAuth()
  const { toggleTheme, theme } = useTheme()

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface">
      {/* Search */}
      <div className="flex items-center gap-2 border border-border rounded-lg px-4 py-2 w-[360px] text-text-tertiary text-sm bg-neutral-50">
        <IconSearch />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          className="bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-tertiary w-full"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md hover:bg-surface-secondary text-text-secondary transition-colors"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <IconMoon /> : <IconSun />}
        </button>

        <button className="p-1.5 rounded-md hover:bg-surface-secondary text-text-secondary transition-colors relative">
          <IconBell />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-danger-500 rounded-full" />
        </button>

        <div className="w-px h-5 bg-border" />

        {user && (
          <div className="flex items-center gap-2">
            <Avatar name={user.name} size="sm" />
            <span className="text-sm font-medium text-text-primary">{user.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function IconSearch() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function IconBell() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> }
function IconMoon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg> }
function IconSun() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> }
