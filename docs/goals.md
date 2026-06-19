# TaskFlow V1 — Project Goals

## Vision
A desktop-first project management application (Electron) that enables teams to create projects, manage tasks, assign work, and track progress. Designed for future cloud sync and mobile expansion.

## V1 Goals (Phase 1 — MVP)
- User authentication (register, login, JWT)
- Dashboard with task summary and recent activity
- Teams (CRUD, invite members)
- Projects (CRUD, list view)
- Task management (CRUD, assign, status, priority, due dates)
- Basic search & filters
- Role-based access (Admin, Project Manager, Team Member)
- Theme system (light/dark, configurable accent colors)
- SQLite local cache for offline reads
- Electron desktop app with Express API backend

## V2 Goals (Phase 2)
- Kanban board view
- Calendar view
- Comments on tasks
- File attachments
- Notifications system
- Offline sync queue (create offline → push when online)

## V3 Goals (Phase 3)
- Analytics (progress charts, team performance)
- Advanced filters
- Activity logs
- Granular user permissions
- Cloud backend option (point renderer to remote API)
- Mobile platform with multi-device sync

## Non-Goals for V1
- Real-time collaboration (WebSockets)
- Mobile apps
- Cloud backend (local Electron only)
- Kanban/Calendar views (Phase 2)
- File uploads (Phase 2)

## Success Criteria
- Clean, polished UI matching the provided design reference
- All CRUD operations work offline via SQLite cache
- Theme switching without page reload
- Coding agents can understand the project from docs/ alone
