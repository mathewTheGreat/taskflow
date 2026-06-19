# TaskFlow V1

A desktop project management application built with Electron, React, and PostgreSQL. Create projects, manage tasks, assign team members, and track progress — all from a polished desktop interface.

## Features

- **Authentication** — Register, login, JWT-based sessions with refresh tokens
- **Dashboard** — Task summary, project progress, recent activity feed
- **Projects** — Create, edit, archive projects with team assignments
- **Tasks** — Full CRUD, status tracking (Pending → In Progress → Completed), priority levels, due dates, assignees
- **Teams** — Create teams, invite members, manage roles
- **Role-based access** — Admin, Project Manager, Team Member permissions
- **Theme system** — Light/dark mode with configurable accent colors
- **Offline support** — SQLite local cache for reads, sync queue for writes
- **Analytics** — Project progress, team performance metrics (Phase 3)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 34 |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express 5 |
| Database | Neon (PostgreSQL) via Prisma v7 |
| Local Cache | SQLite (better-sqlite3) |
| Auth | JWT + bcrypt |

## Prerequisites

- Node.js 20+
- Neon database (free tier works)
- WSL2 with display support (for Linux/WSL users)

## Quick Start

```bash
# Clone the repo
git clone https://github.com/mathewTheGreat/taskflow.git
cd taskflow

# Run the setup script
npm run setup

# Edit .env with your Neon connection string
nano .env

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev --name init

# Start the app
npm run electron:dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
DATABASE_URL="postgresql://user:password@your-neon-host.neon.tech/dbname?sslmode=require"
JWT_ACCESS_SECRET="generate-with-openssl-rand-base64-32"
JWT_REFRESH_SECRET="generate-a-different-one"
API_PORT=3001
NODE_ENV=development
```

## Development

```bash
# Web-only mode (no Electron)
npm run dev          # Vite dev server on port 5173
npm run server       # API server on port 3001

# Full Electron app
npm run electron:dev # Starts Vite + API server + Electron window

# Database
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma migrate dev --name <migration_name>
```

## Project Structure

```
taskflow/
├── docs/                    # Knowledge base for coding agents
│   ├── goals.md            # Project vision and scope
│   ├── progress.md         # Phase tracker
│   ├── architecture.md     # Stack, patterns, conventions
│   ├── api.md              # REST API reference
│   ├── database.md         # Schema documentation
│   └── research/           # Implementation research notes
├── electron/
│   ├── main.ts             # Electron main process
│   └── preload.js          # Context bridge
├── src/
│   ├── main/               # Express API (backend)
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Auth, error handling
│   │   ├── services/       # SQLite cache, sync queue
│   │   └── lib/            # Prisma client
│   ├── renderer/           # React app (frontend)
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # API client, auth context
│   │   └── theme/          # Theme provider
│   └── shared/             # Shared TypeScript types
├── prisma/
│   └── schema.prisma       # Database schema
└── scripts/
    └── setup.sh            # One-command setup
```

## Architecture

```
Electron Main Process
  ├── Spawns Express API (child process, port 3001)
  └── Creates BrowserWindow → loads Vite dev server (port 5173)

Renderer (React) → fetch() → Express API → Neon PostgreSQL
                                      ↕
                                 SQLite cache (offline)
```

The renderer never touches the database directly. All data goes through the REST API. The SQLite cache stores recently fetched data for offline reads, and queues writes when offline.

## Roadmap

- **Phase 1** (Current): Auth, Dashboard, Projects, Tasks, Teams, Theme
- **Phase 2**: Kanban board, Calendar view, Comments, File uploads, Notifications
- **Phase 3**: Analytics, Advanced filters, Activity logs, Cloud backend, Mobile sync

## License

MIT
