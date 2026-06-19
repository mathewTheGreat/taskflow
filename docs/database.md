# TaskFlow V1 — Database Schema

## Overview
- **Remote database:** Neon (PostgreSQL) via Prisma ORM
- **Local cache:** SQLite via better-sqlite3
- All writes go to Neon first, then cache is updated
- Prisma v6 (not v7 — v7 requires adapters + prisma.config.ts)

## Entity Relationship Diagram

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  users   │◄────┤ team_members ├────►│  teams   │
└──────────┘     └──────────────┘     └──────────┘
     │                                     │
     │                                     │
     │         ┌──────────┐               │
     ├────────►│ projects │◄──────────────┘
     │         └──────────┘
     │              │
     │              │
     │         ┌──────────┐     ┌───────────┐
     ├────────►│  tasks   ├────►│ comments  │
     │         └──────────┘     └───────────┘
     │              │
     │         ┌───────────┐
     ├────────►│attachments│
     │         └───────────┘
     │
     │    ┌──────────────┐
     └───►│notifications │
          └──────────────┘
```

## Tables

### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key (gen_random_uuid()) |
| name | TEXT | Not null |
| email | TEXT | Unique, not null |
| password | TEXT | Bcrypt hashed |
| role | TEXT | admin, project_manager, team_member |
| company | TEXT | Nullable |
| created_at | TIMESTAMPTZ | Default now() |

### teams
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | Not null |
| description | TEXT | Nullable |
| created_by | UUID → users.id | Not null |
| created_at | TIMESTAMPTZ | Default now() |

### team_members
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| team_id | UUID → teams.id | Not null |
| user_id | UUID → users.id | Not null |
| created_at | TIMESTAMPTZ | Default now() |
| **Unique:** | (team_id, user_id) | |

### projects
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | Not null |
| description | TEXT | Nullable |
| owner_id | UUID → users.id | Not null |
| team_id | UUID → teams.id | Nullable |
| status | TEXT | active, archived |
| start_date | DATE | Nullable |
| end_date | DATE | Nullable |
| created_at | TIMESTAMPTZ | Default now() |

### tasks
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| project_id | UUID → projects.id | Not null |
| title | TEXT | Not null |
| description | TEXT | Nullable |
| assignee_id | UUID → users.id | Nullable |
| status | TEXT | pending, in_progress, completed |
| priority | TEXT | low, medium, high |
| start_date | DATE | Nullable |
| due_date | DATE | Nullable |
| estimated_hours | INTEGER | Nullable |
| created_by | UUID → users.id | Not null |
| created_at | TIMESTAMPTZ | Default now() |

### comments
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| task_id | UUID → tasks.id | Not null |
| user_id | UUID → users.id | Not null |
| message | TEXT | Not null |
| created_at | TIMESTAMPTZ | Default now() |

### attachments
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| task_id | UUID → tasks.id | Not null |
| filename | TEXT | Not null |
| path | TEXT | File storage path |
| uploaded_by | UUID → users.id | Not null |
| created_at | TIMESTAMPTZ | Default now() |

### notifications
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID → users.id | Not null |
| message | TEXT | Not null |
| is_read | BOOLEAN | Default false |
| created_at | TIMESTAMPTZ | Default now() |

### activity_log
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID → users.id | Not null |
| action | TEXT | Not null (e.g., task_created) |
| entity_type | TEXT | task, project, team |
| entity_id | UUID | |
| metadata | JSONB | Nullable |
| created_at | TIMESTAMPTZ | Default now() |

## Indexes
- `users.email` — unique index
- `tasks.project_id` — index for project task queries
- `tasks.assignee_id` — index for user task queries
- `tasks.status` — index for filtering
- `tasks.due_date` — index for date range queries
- `team_members(team_id, user_id)` — unique composite
- `comments.task_id` — index
- `notifications.user_id` — index
- `activity_log(entity_type, entity_id)` — index

## SQLite Cache Tables
The local SQLite cache mirrors a subset of the above tables for offline reads:
- `cache_projects` — recent projects
- `cache_tasks` — recent tasks with assignee names denormalized
- `cache_teams` — user's teams
- `cache_sync_queue` — pending offline changes to push
