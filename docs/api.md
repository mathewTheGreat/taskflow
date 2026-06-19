# TaskFlow V1 — API Reference

## Base URL
`http://localhost:3001/api`

## Auth
All protected routes require `Authorization: Bearer <access_token>` header.

---

## Authentication

### POST /api/auth/register
Register a new user.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "company": "Acme Inc"
}
```

**Response (201):**
```json
{
  "user": { "id": "...", "name": "...", "email": "...", "role": "team_member" },
  "accessToken": "...",
  "refreshToken": "..."
}
```

### POST /api/auth/login
**Body:**
```json
{ "email": "john@example.com", "password": "securepassword" }
```

**Response (200):**
```json
{
  "user": { "id": "...", "name": "...", "email": "...", "role": "team_member" },
  "accessToken": "...",
  "refreshToken": "..."
}
```

### POST /api/auth/refresh
**Body:**
```json
{ "refreshToken": "..." }
```

**Response (200):**
```json
{ "accessToken": "...", "refreshToken": "..." }
```

### POST /api/auth/logout
**Headers:** Authorization required

**Response (200):**
```json
{ "message": "Logged out" }
```

---

## Users

### GET /api/users/me
Get current user profile.

**Response (200):**
```json
{ "id": "...", "name": "...", "email": "...", "role": "...", "created_at": "..." }
```

### GET /api/users
List all users (admin only).

**Query:** `?search=&role=&limit=50&offset=0`

**Response (200):**
```json
{ "users": [...], "total": 24 }
```

### PUT /api/users/:id/role
Update user role (admin only).

**Body:**
```json
{ "role": "project_manager" }
```

---

## Teams

### GET /api/teams
List teams for current user.

**Response (200):**
```json
{ "teams": [{ "id": "...", "name": "...", "description": "...", "member_count": 5, "created_at": "..." }] }
```

### POST /api/teams
Create a team (admin, project_manager).

**Body:**
```json
{ "name": "Engineering", "description": "Dev team" }
```

**Response (201):**
```json
{ "id": "...", "name": "Engineering", "description": "Dev team", "created_at": "..." }
```

### GET /api/teams/:id
Get team details with members.

**Response (200):**
```json
{
  "id": "...",
  "name": "Engineering",
  "members": [{ "id": "...", "name": "...", "email": "...", "role": "..." }],
  "created_at": "..."
}
```

### PUT /api/teams/:id
Update team (admin, project_manager).

**Body:**
```json
{ "name": "New Name", "description": "Updated" }
```

### DELETE /api/teams/:id
Delete team (admin only).

**Response (204):** No content.

### POST /api/teams/:id/members
Add member to team (admin, project_manager).

**Body:**
```json
{ "user_id": "..." }
```

### DELETE /api/teams/:id/members/:userId
Remove member from team (admin, project_manager).

**Response (204):** No content.

---

## Projects

### GET /api/projects
List projects for current user.

**Query:** `?team_id=&status=active&search=&limit=50&offset=0`

**Response (200):**
```json
{
  "projects": [{
    "id": "...",
    "name": "Website Redesign",
    "description": "...",
    "status": "active",
    "owner_id": "...",
    "team_id": "...",
    "task_count": 12,
    "completed_count": 5,
    "start_date": "...",
    "end_date": "...",
    "created_at": "..."
  }],
  "total": 24
}
```

### POST /api/projects
Create a project (admin, project_manager).

**Body:**
```json
{
  "name": "Website Redesign",
  "description": "Redesign the company website",
  "team_id": "...",
  "start_date": "2025-01-01",
  "end_date": "2025-06-01"
}
```

**Response (201):** Project object.

### GET /api/projects/:id
Get project details.

**Response (200):** Project object with task summary.

### PUT /api/projects/:id
Update project (admin, project_manager, owner).

**Body:** Same as POST, all fields optional.

### DELETE /api/projects/:id
Delete project (admin, project_manager).

**Response (204):** No content.

---

## Tasks

### GET /api/tasks
List tasks.

**Query:** `?project_id=&assignee_id=&status=&priority=&search=&due_before=&due_after=&limit=50&offset=0`

**Response (200):**
```json
{
  "tasks": [{
    "id": "...",
    "project_id": "...",
    "title": "Design Homepage",
    "description": "...",
    "assignee_id": "...",
    "assignee_name": "John",
    "status": "pending",
    "priority": "high",
    "due_date": "2025-03-20",
    "estimated_hours": 4,
    "created_by": "...",
    "created_at": "..."
  }],
  "total": 140
}
```

### POST /api/tasks
Create a task (admin, project_manager, team_member).

**Body:**
```json
{
  "project_id": "...",
  "title": "Design Homepage",
  "description": "Create mockups",
  "assignee_id": "...",
  "status": "pending",
  "priority": "high",
  "due_date": "2025-03-20",
  "estimated_hours": 4
}
```

**Response (201):** Task object.

### GET /api/tasks/:id
Get task details with comments.

**Response (200):** Task object with `comments` array.

### PUT /api/tasks/:id
Update task (admin, project_manager, assignee).

**Body:** Same as POST, all fields optional.

### DELETE /api/tasks/:id
Delete task (admin, project_manager).

**Response (204):** No content.

### POST /api/tasks/:id/comments
Add comment to task.

**Body:**
```json
{ "message": "Please update the colors" }
```

**Response (201):**
```json
{ "id": "...", "task_id": "...", "user_id": "...", "user_name": "...", "message": "...", "created_at": "..." }
```

### GET /api/tasks/:id/comments
Get comments for a task.

**Response (200):**
```json
{ "comments": [{ "id": "...", "user_name": "...", "message": "...", "created_at": "..." }] }
```

---

## Dashboard

### GET /api/dashboard
Get dashboard data for current user.

**Response (200):**
```json
{
  "my_tasks": {
    "due_today": 3,
    "overdue": 2,
    "completed": 15
  },
  "project_summary": {
    "total_projects": 5,
    "total_tasks": 42,
    "completed_tasks": 28,
    "overdue_tasks": 2
  },
  "recent_activity": [
    { "id": "...", "type": "task_assigned", "message": "John assigned 'Design Homepage' to Sarah", "created_at": "..." }
  ]
}
```

---

## Error Format

All errors follow this format:

```json
{
  "error": "Error message",
  ivalidation_errors": [
    { "field": "email", "message": "Invalid email" }
  ]
}
```

Status codes: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error).
