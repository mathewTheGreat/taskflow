# TaskFlow V1 — Architecture

## Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron 33+ |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4 |
| Icons | @tabler/icons-react |
| Backend API | Node.js, Express 5 |
| ORM | Prisma v6 |
| Remote DB | Neon (PostgreSQL) |
| Local Cache | better-sqlite3 (SQLite) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| HTTP Client | Native fetch (custom wrapper) |

## Application Architecture

```
┌─────────────────────────────────────────────┐
│                  Electron                    │
│  ┌─────────────┐    ┌──────────────────┐    │
│  │  Main Process│    │  Renderer Process │    │
│  │  (main.ts)   │    │  (React + Vite)   │    │
│  │              │    │                   │    │
│  │  Spawns ──►  │    │  fetch() ──►      │    │
│  │  Express     │    │  localhost:3001   │    │
│  │  child proc  │    │                   │    │
│  └──────┬───────┘    └──────────────────┘    │
│         │                                    │
└─────────┼────────────────────────────────────┘
          │
          ▼
┌──────────────────┐     ┌──────────────────┐
│  Express Server   │     │  SQLite Cache     │
│  (localhost:3001) │◄───►│  (local file)     │
│                   │     │                   │
│  REST API routes  │     │  Offline reads    │
│  JWT auth         │     │  Sync queue       │
│  Prisma client    │     │                   │
└────────┬──────────┘     └──────────────────┘
         │
         ▼
┌──────────────────┐
│  Neon PostgreSQL  │
│  (remote cloud)   │
│                   │
│  Source of truth  │
│  All writes go    │
│  here first       │
└──────────────────┘
```

## Key Patterns

### API Communication
- Renderer NEVER accesses the database directly
- All data goes through Express REST API at `http://localhost:3001/api`
- API client in `src/renderer/lib/api.ts` wraps fetch with auth headers
- Future: change `API_BASE_URL` to point to cloud backend

### Local Cache
- SQLite database file at `~/.taskflow/cache.db`
- Stores recently fetched projects, tasks, teams for offline reads
- Write-through pattern: API success → update cache
- Sync queue: offline-created items stored locally, pushed when online

### Theme System
- CSS custom properties for all colors
- Tailwind v4 `@theme` directive maps to CSS vars
- Light/dark mode via `data-theme` attribute on `<html>`
- Theme context in React for runtime switching
- Persist preference to localStorage + SQLite

### Auth
- JWT access token (15min) + refresh token (7d)
- Tokens stored in renderer memory (not localStorage — XSS risk)
- HttpOnly cookies preferred for refresh token
- Auth context provides `user`, `login`, `logout`, `isAuthenticated`

### Role-Based Access
- Roles: `admin`, `project_manager`, `team_member`
- Middleware on API routes enforces permissions
- UI shows/hides actions based on role

## File Structure

```
taskflow/
├── docs/                        # Knowledge base for coding agents
│   ├── goals.md
│   ├── progress.md
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   └── research/
│       ├── offline-sync.md
│       ├── electron-react-auth.md
│       └── kanban-implementations.md
├── electron/
│   ├── main.ts                  # Electron main process entry
│   └── preload.ts               # Context bridge for renderer
├── src/
│   ├── main/                    # Express API (backend)
│   │   ├── index.ts             # Server entry, starts Express
│   │   ├── routes/              # API route handlers
│   │   ├── middleware/           # Auth, error handling
│   │   └── services/            # Cache, sync services
│   ├── renderer/                # React app (frontend)
│   │   ├── main.tsx             # React entry point
│   │   ├── App.tsx              # Root component, routing
│   │   ├── theme/               # Theme provider + CSS vars
│   │   ├── components/
│   │   │   ├── ui/              # Button, Input, Card, Badge, PageHeader
│   │   │   ├── layout/          # Sidebar, TopBar, AppShell
│   │   │   └── shared/          # Avatar, StatusPill, PriorityBadge
│   │   ├── pages/               # Page components
│   │   ├── hooks/               # useAuth, useApi, useTheme
│   │   └── lib/                 # api.ts client, auth.ts context
│   └── shared/                  # Shared TypeScript types
│       └── types.ts
├── prisma/
│   └── schema.prisma            # Database schema
├── scripts/
│   └── setup.sh                 # Initial setup script
├── package.json
├── electron-builder.json
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── postcss.config.mjs
└── .env.example
```

## Conventions
- All components use Tailwind utility classes — never raw `style={{}}`
- Only use `style={{}}` for truly dynamic computed values
- API errors return `{ error: string, status: number }`
- All dates are ISO 8601 strings over the wire
- File names: PascalCase for components, camelCase for utilities
- Route files: kebab-case (e.g., `project-detail.tsx`)
