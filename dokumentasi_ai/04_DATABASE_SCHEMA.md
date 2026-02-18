# 🗄️ Database Schema

> **Version**: 1.0  
> **Last Updated**: 2026-02-17

---

## 1. Database Overview

| Property | Value |
|----------|-------|
| **Engine** | Microsoft SQL Server |
| **Server** | 10.0.0.110:1433 (`SERVER_PROFILE_1`) |
| **Database** | `extend_db_ptrj` (read-write) |
| **Access Method** | SQL Gateway REST API |
| **Table Prefix** | `pm_` (project management) |

> **Note**: The Prisma schema uses SQLite locally (dev fallback). Production uses SQL Server via API Gateway. Tables in SQL Server have the `pm_` prefix.

---

## 2. Entity Relationship Diagram (ERD)

```
┌──────────────────┐
│     pm_users     │
├──────────────────┤       ┌───────────────────────┐
│ id (PK)          │───┐   │      pm_projects      │
│ username         │   │   ├───────────────────────┤
│ email (UNIQUE)   │   ├──▶│ id (PK)               │
│ password         │   │   │ name                  │
│ name             │   │   │ description           │
│ role             │   │   │ start_date            │
│ avatar_url       │   │   │ end_date              │
│ created_at       │   │   │ priority              │
│ updated_at       │   │   │ banner_image          │
└──────────────────┘   │   │ status                │
         │             │   │ owner_id (FK → users)  │
         │             │   │ created_at            │
         │             │   │ updated_at            │
         │             │   └───────┬───────────────┘
         │             │           │
         │             │           │ 1:N
         │             │           ▼
         │             │   ┌───────────────────────┐
         │             │   │  pm_task_statuses     │
         │             │   ├───────────────────────┤
         │             │   │ id (PK)               │
         │             │   │ name                  │
         │             │   │ order                 │
         │             │   │ project_id (FK)       │
         │             │   │ created_at            │
         │             │   │ updated_at            │
         │             │   └───────┬───────────────┘
         │             │           │
         │             │           │ 1:N
         │             │           ▼
         │             │   ┌───────────────────────┐
         │             ├──▶│      pm_tasks         │
         │                 ├───────────────────────┤
         │                 │ id (PK)               │
         │                 │ title                 │
         │                 │ description           │
         │                 │ priority              │
         │                 │ due_date              │
         │                 │ estimated_hours       │
         │                 │ actual_hours          │
         │                 │ documentation         │
         │                 │ progress (0-100)      │
         │                 │ last_alert_sent       │
         │                 │ project_id (FK)       │
         │                 │ status_id (FK)        │
         │                 │ assignee_id (FK)      │
         │                 │ created_at            │
         │                 │ updated_at            │
         │                 └───────┬───────────────┘
         │                         │
         │                 ┌───────┴───────┐
         │                 │               │
         │                 ▼               ▼
         │   ┌─────────────────┐  ┌──────────────────┐
         └──▶│  pm_comments    │  │  pm_attachments  │
             ├─────────────────┤  ├──────────────────┤
             │ id (PK)         │  │ id (PK)          │
             │ task_id (FK)    │  │ task_id (FK)     │
             │ user_id (FK)    │  │ file_name        │
             │ content         │  │ file_url         │
             │ created_at      │  │ file_type        │
             │ updated_at      │  │ file_size        │
             └─────────────────┘  │ created_at       │
                                  └──────────────────┘
```

---

## 3. Table Definitions

### 3.1. `pm_users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(255) | **PK** | CUID-based unique identifier |
| `username` | VARCHAR(255) | NOT NULL | Display username |
| `email` | VARCHAR(255) | NOT NULL, **UNIQUE** | Login email |
| `password` | VARCHAR(255) | NOT NULL | bcrypt-hashed password |
| `name` | VARCHAR(255) | NOT NULL | Full name |
| `role` | VARCHAR(50) | DEFAULT `'MEMBER'` | `ADMIN` / `PM` / `MEMBER` |
| `avatar_url` | VARCHAR(500) | NULLABLE | Profile image URL |
| `created_at` | DATETIME | DEFAULT `GETDATE()` | Record creation timestamp |
| `updated_at` | DATETIME | ON UPDATE | Last modification timestamp |

### 3.2. `pm_projects`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(255) | **PK** | CUID-based unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Project name |
| `description` | TEXT | NULLABLE | Project description / canvas data |
| `start_date` | DATETIME | NULLABLE | Project start date |
| `end_date` | DATETIME | NULLABLE | Project deadline |
| `priority` | VARCHAR(50) | DEFAULT `'MEDIUM'` | `LOW` / `MEDIUM` / `HIGH` / `CRITICAL` |
| `banner_image` | VARCHAR(500) | DEFAULT (Shutterstock URL) | Banner image URL |
| `status` | VARCHAR(50) | NULLABLE | Manual: `SEKARANG` / `RENCANA` / `SELESAI` or `NULL` (auto) |
| `owner_id` | VARCHAR(255) | **FK** → `pm_users.id` | Project owner |
| `created_at` | DATETIME | DEFAULT `GETDATE()` | Record creation |
| `updated_at` | DATETIME | ON UPDATE | Last modification |
| `deleted_at` | DATETIME | NULLABLE | Soft delete timestamp |

### 3.3. `pm_task_statuses`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(255) | **PK** | CUID-based unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Status name (e.g., "To Do", "In Progress") |
| `order` | INT | DEFAULT `0` | Display order |
| `project_id` | VARCHAR(255) | **FK** → `pm_projects.id` | Parent project |
| `created_at` | DATETIME | DEFAULT `GETDATE()` | Record creation |
| `updated_at` | DATETIME | ON UPDATE | Last modification |

**Unique Constraint**: `(project_id, name)` — No duplicate status names per project.

### 3.4. `pm_tasks`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(255) | **PK** | CUID-based unique identifier |
| `title` | VARCHAR(255) | NOT NULL | Task title |
| `description` | TEXT | NULLABLE | Short description |
| `priority` | VARCHAR(50) | DEFAULT `'MEDIUM'` | `LOW` / `MEDIUM` / `HIGH` / `CRITICAL` |
| `due_date` | DATETIME | NULLABLE | Task deadline |
| `estimated_hours` | FLOAT | NULLABLE | Estimated work hours |
| `actual_hours` | FLOAT | NULLABLE | Actual work hours |
| `documentation` | TEXT | NULLABLE | Rich text (TipTap JSON) |
| `progress` | INT | DEFAULT `0` | Completion % (0–100) |
| `last_alert_sent` | DATETIME | NULLABLE | Last deadline alert |
| `project_id` | VARCHAR(255) | **FK** → `pm_projects.id`, CASCADE DELETE | Parent project |
| `status_id` | VARCHAR(255) | **FK** → `pm_task_statuses.id` | Current status column |
| `assignee_id` | VARCHAR(255) | **FK** → `pm_users.id`, NULLABLE | Assigned user |
| `created_at` | DATETIME | DEFAULT `GETDATE()` | Record creation |
| `updated_at` | DATETIME | ON UPDATE | Last modification |

### 3.5. `pm_comments`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(255) | **PK** | CUID-based unique identifier |
| `task_id` | VARCHAR(255) | **FK** → `pm_tasks.id`, CASCADE DELETE | Parent task |
| `user_id` | VARCHAR(255) | **FK** → `pm_users.id` | Comment author |
| `content` | TEXT | NOT NULL | Comment text |
| `created_at` | DATETIME | DEFAULT `GETDATE()` | Record creation |
| `updated_at` | DATETIME | DEFAULT `GETDATE()` | Last modification |

**Indexes**: `task_id`, `user_id`

### 3.6. `pm_attachments`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(255) | **PK** | CUID-based unique identifier |
| `task_id` | VARCHAR(255) | **FK** → `pm_tasks.id`, CASCADE DELETE | Parent task |
| `file_name` | VARCHAR(255) | NOT NULL | Original file name |
| `file_url` | TEXT | NOT NULL | File storage URL |
| `file_type` | VARCHAR(50) | NOT NULL | `image` / `document` |
| `file_size` | INT | NOT NULL | File size in bytes |
| `created_at` | DATETIME | DEFAULT `GETDATE()` | Upload timestamp |

**Index**: `task_id`

---

## 4. Naming Convention

| Context | Convention | Example |
|---------|-----------|---------|
| SQL Server tables | `pm_` prefix + snake_case | `pm_tasks` |
| SQL Server columns | snake_case | `owner_id`, `due_date` |
| Prisma schema | PascalCase models | `Task`, `Project` |
| Prisma fields | camelCase | `ownerId`, `dueDate` |
| App TypeScript | camelCase | `assigneeId`, `statusId` |

> The `lib/api/projects.ts` file contains `toCamelCase()` and `toSnakeCase()` helper functions to convert between conventions.

---

## 5. Category Logic

Projects are automatically categorized based on dates:

```typescript
// If end_date < NOW → "Selesai" (Completed)
// If start_date <= NOW AND end_date >= NOW → "Sekarang" (Current)  
// If start_date > NOW → "Rencana" (Planned)
// If status field is set manually, it overrides the auto-calculation
```
