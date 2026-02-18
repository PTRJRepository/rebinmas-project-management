# 🔌 API Reference

> **Version**: 1.0  
> **Last Updated**: 2026-02-17

---

## Overview

The application has **two API layers**:

1. **Server Actions** (`app/actions/`) — Direct function calls from React components (recommended)
2. **API Routes** (`app/api/`) — REST endpoints for external access or legacy support

Both layers ultimately call the **API Client** (`lib/api/`) which communicates with the SQL Gateway.

---

## 1. Server Actions

Server Actions are the primary data mutation mechanism. They are called directly from React components using `useFormAction` or direct invocation.

### 1.1. Auth Actions (`app/actions/auth.ts`)

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `register` | `FormData` (name, email, password, confirmPassword) | `AuthResult` | Register a new user, auto-login |
| `login` | `FormData` (email, password) | `AuthResult` | Authenticate user, set session cookie |
| `logout` | None | `{ success, error? }` | Clear session cookie |
| `getCurrentUser` | None | `User \| null` | Get current authenticated user |

**AuthResult Type:**
```typescript
interface AuthResult {
  success: boolean;
  error?: string;
  user?: { id: string; email: string; name: string; role: string; };
}
```

### 1.2. Project Actions (`app/actions/project.ts`)

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `getProjects` | None | `{ success, data: Project[] }` | Get user's projects |
| `getAllProjects` | None | `{ success, data: Project[] }` | Get all projects (admin) |
| `createProject` | `FormData` | `{ success, data: Project }` | Create new project |
| `updateProjectAction` | `FormData` | `{ success, data: Project }` | Update project (ownership check) |
| `getProject` | `projectId: string` | `{ success, data: Project }` | Get project with tasks & statuses |
| `getProjectStats` | `projectId: string` | `{ success, data }` | Get project dashboard statistics |
| `deleteProjectAction` | `projectId: string` | `{ success }` | Soft delete project (move to trash) |
| `restoreProjectAction` | `projectId: string` | `{ success }` | Restore project from trash |
| `permanentDeleteProjectAction` | `projectId: string` | `{ success }` | Permanently delete project |
| `getDeletedProjectsAction` | None | `{ success, data: Project[] }` | Get projects in trash |

### 1.3. Task Actions (`app/actions/task.ts`)

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `getTasks` | `projectId: string` | `{ success, data: Task[] }` | Get all tasks for a project |
| `createTask` | `FormData` | `{ success, data: Task }` | Create new task |
| `updateTask` | `taskId, data, projectId` | `{ success, data: Task }` | Update task fields |
| `updateTaskStatus` | `taskId, statusId, projectId` | `{ success, data: Task }` | Move task to different column |
| `getTask` | `taskId: string` | `{ success, data: Task }` | Get task with comments |
| `deleteTaskAction` | `taskId, projectId` | `{ success }` | Delete a task |

### 1.4. Comment Actions (`app/actions/task.ts`)

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `getComments` | `taskId: string` | `{ success, data: Comment[] }` | Get task comments |
| `createCommentAction` | `FormData` | `{ success, data: Comment }` | Add a comment |
| `deleteCommentAction` | `commentId, taskId, projectId` | `{ success }` | Delete a comment |

### 1.5. Status Actions (`app/actions/task.ts`)

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `getStatuses` | `projectId: string` | `{ success, data: TaskStatus[] }` | Get project's task statuses |

---

## 2. API Routes (REST)

### 2.1. Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create a project |
| `GET` | `/api/projects/[id]` | Get project by ID |
| `PUT` | `/api/projects/[id]` | Update a project |
| `DELETE` | `/api/projects/[id]` | Delete a project |
| `GET` | `/api/projects/[id]/canvas` | Get canvas data |
| `PUT` | `/api/projects/[id]/canvas` | Save canvas data |

### 2.2. Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks?projectId=` | Get tasks (with filters) |
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks/[id]` | Get task by ID |
| `PUT` | `/api/tasks/[id]` | Update a task |
| `DELETE` | `/api/tasks/[id]` | Delete a task |

### 2.3. Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user` | Get current user |
| `POST` | `/api/logout` | Logout (clear session) |
| `GET` | `/api/statuses?projectId=` | Get task statuses |
| `POST` | `/api/upload` | Upload a file |
| `GET` | `/api/sync` | Get sync status |
| `POST` | `/api/sync` | Trigger data sync |
| `POST` | `/api/seed` | Seed database |

---

## 3. API Client Layer (`lib/api/`)

### 3.1. SQL Gateway Client (`lib/api/sql-gateway.ts`)

The core client for all database operations:

```typescript
import { sqlGateway } from '@/lib/api/sql-gateway';

// Execute a query
const result = await sqlGateway.query<T>(
  sql: string,
  params?: Record<string, any>,
  options?: { server?: string, database?: string }
);

// Execute batch queries (transaction)
const results = await sqlGateway.batchQuery(
  queries: Array<{ sql: string; params?: Record<string, any> }>,
  options?: { server?: string, database?: string }
);

// Health check
const isHealthy = await sqlGateway.healthCheck();

// Get server list
const servers = await sqlGateway.getServers();

// Get database list
const databases = await sqlGateway.getDatabases(server?);
```

### 3.2. Project Operations (`lib/api/projects.ts`)

All project-related database operations (836 lines):

| Function | Description |
|----------|-------------|
| `getProjects(userId?)` | List projects with owner info |
| `getProjectById(id)` | Get single project |
| `getProjectWithTasks(id)` | Get project + statuses + tasks |
| `createProject(data)` | Create project + default statuses |
| `updateProject(id, data)` | Update project fields |
| `deleteProject(id)` | Soft delete project (set deleted_at) |
| `restoreProject(id)` | Restore project (clear deleted_at) |
| `permanentDeleteProject(id)` | Permanently delete project record |
| `getDeletedProjects(userId)` | Get soft-deleted projects |
| `getTasks(projectId)` | Get tasks for a project |
| `getTaskById(id)` | Get single task with relations |
| `createTask(data)` | Create a new task |
| `updateTask(id, data)` | Update task fields |
| `deleteTask(id)` | Delete a task |
| `getCommentsByTask(taskId)` | Get comments with user info |
| `createComment(data)` | Add a comment |
| `deleteComment(id)` | Remove a comment |
| `getUserByEmail(email)` | Find user by email |
| `getUserById(id)` | Find user by ID |
| `createUser(data)` | Register a new user |
| `getTaskStatuses(projectId)` | Get project statuses |
| `getProjectDashboardStats(id)` | Get project statistics |

### 3.3. Predefined Queries (`pmQueries`)

The SQL Gateway client includes predefined query builders:

```typescript
import { pmQueries } from '@/lib/api/sql-gateway';

// User queries
pmQueries.users.getAll()
pmQueries.users.getById(id)
pmQueries.users.getByEmail(email)
pmQueries.users.create(data)

// Project queries
pmQueries.projects.getAll()
pmQueries.projects.getById(id)
```

---

## 4. Response Format

All server actions follow a consistent response format:

```typescript
// Success
{ success: true, data: <result> }

// Error
{ success: false, error: "Error message" }
```

---

## 5. SQL Gateway API (External)

The application communicates with the SQL Gateway at `http://10.0.0.110:8001`. For full SQL Gateway documentation, see:

📄 **`dokumentasi/api_query.md`** — Complete endpoint reference for the SQL Gateway API including:
- `/v1/query` — Single query execution
- `/v1/query/batch` — Transaction-based batch queries
- `/v1/servers` — List server profiles
- `/v1/databases` — List databases
- `/health` — Health check

Authentication: `x-api-key` header with API token.
