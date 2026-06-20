# TaskFlow V1 — Progress Tracker

## Current Phase: Phase 1 (MVP)

## Status: ✅ Complete

## Completed
- [x] Project planning and architecture design
- [x] Design reference analysis (HTML layout)
- [x] Technology stack finalization
- [x] Project scaffolding (Electron + Vite + React + Express + Prisma)
- [x] Database schema (Prisma — users, projects, tasks, teams)
- [x] Documentation (goals, architecture, API)
- [x] Express API server with auth routes (register/login/refresh)
- [x] SQLite cache service
- [x] Electron main process
- [x] React renderer with Tailwind v4
- [x] UI component library (Card, Badge, Button, Input, Avatar, etc.)
- [x] Theme system (light/dark with CSS variables)
- [x] Auth flow (register, login, JWT refresh, protected routes)
- [x] Dashboard page (stat cards, donut chart, activity feed)
- [x] Sidebar (nav, favorites, projects, user profile)
- [x] TopBar (simplified — page title + theme toggle + notification bell only; no search, view tabs, or breadcrumb links)
- [x] Projects page (list, create, progress bars)
- [x] Project Detail page (spreadsheet view, task CRUD, subtasks, CSS class conversion)
- [x] Teams page (list, create, member management)
- [x] Settings page (profile, appearance, sign out)
- [x] Login page (split layout, branding panel, form card)
- [x] TopBar stripped of global search and view tabs (content mixing fix)
- [x] All pages converted to CSS classes with `var()` — no inline `style` attributes or inline Tailwind utilities remain

## Styling Standard (Established)
- **No inline Tailwind utilities in JSX** — all styling uses **CSS classes defined in `index.css`** with explicit `var(--color-*)` references
- CSS classes include layout properties (flex, grid, gap, padding, margin) — no mix of Tailwind classes + CSS classes
- **No inline `style` attributes** in component markup
- CSS classes follow BEM-like naming (`.block__element--modifier`) for clarity
- Unlayered CSS (written after `@import "tailwindcss"`) beats Tailwind's layered utilities, ensuring our classes always win regardless of Tailwind's utility generation
- Default theme is light (`theme-provider.tsx` ignores stale localStorage)

## Pending (Phase 2)
- [ ] Inbox page
- [ ] Kanban board view
- [ ] Calendar view
- [ ] Timeline view
- [ ] Search & filters
- [ ] Comments system
- [ ] File attachments
- [ ] Notifications
- [ ] Role-based access control enforcement
- [ ] Offline sync queue
- [ ] Setup script

## Pending (Phase 3)
- [ ] Analytics dashboard
- [ ] Advanced filters
- [ ] Activity logs
- [ ] Cloud backend option
- [ ] Mobile platform with multi-device sync

## Known Issues
- Express 5.2.1 has an async handler detection bug — wrapped all handlers with `asyncHandler()` utility
- Express 5.2.1 `express.json()` body parser hangs — replaced with manual stream-based body parsing
- Zombie server processes can accumulate on port 3001 from Electron child-process spawns — run `netstat -ano | findstr :3001` and kill stale PIDs if auth/API are unreachable
- `tsc --noEmit` throws TS6305/TS6306 errors from stale dist-electron output files and tsconfig project refs — these are pre-existing config issues; `vite build` succeeds cleanly

## Notes
- All dates are tracked in commit history
- Repo: https://github.com/mathewTheGreat/taskflow
- Update this file when completing major milestones
