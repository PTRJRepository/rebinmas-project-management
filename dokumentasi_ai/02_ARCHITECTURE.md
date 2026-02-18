# 🏗️ Architecture & Tech Stack

> **Version**: 1.0  
> **Last Updated**: 2026-02-17

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Dashboard │ │  Kanban  │ │  Canvas  │ │  Task Detail  │  │
│  │   Page    │ │  Board   │ │  Board   │ │   + Editor    │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬────────┘  │
│       └─────────────┴────────────┴──────────────┘            │
│                          │                                    │
│                    React Components                           │
│              (shadcn/ui + Tailwind CSS 4)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (Server Actions / API Routes)
┌──────────────────────────┴──────────────────────────────────┐
│                     NEXT.JS 16 SERVER                        │
│                                                              │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │  Server Actions  │  │         API Routes               │  │
│  │  (app/actions/)  │  │  (app/api/)                      │  │
│  │  - auth.ts       │  │  - /api/projects/                │  │
│  │  - project.ts    │  │  - /api/tasks/                   │  │
│  │  - task.ts       │  │  - /api/user/                    │  │
│  │  - user.ts       │  │  - /api/sync/                    │  │
│  │  - dashboard.ts  │  │  - /api/upload/                  │  │
│  └────────┬────────┘  └──────────┬───────────────────────┘  │
│           └──────────────────────┘                            │
│                          │                                    │
│           ┌──────────────┴──────────────┐                    │
│           │    API Client Layer          │                    │
│           │    (lib/api/)                │                    │
│           │    - sql-gateway.ts          │                    │
│           │    - projects.ts             │                    │
│           │    - tasks.ts                │                    │
│           │    - users.ts                │                    │
│           └──────────────┬──────────────┘                    │
│                          │                                    │
│           ┌──────────────┴──────────────┐                    │
│           │   Middleware (middleware.ts)  │                    │
│           │   Auth + Route Protection    │                    │
│           └──────────────────────────────┘                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP REST API
┌──────────────────────────┴──────────────────────────────────┐
│                  SQL GATEWAY API (Port 8001)                 │
│              http://10.0.0.110:8001                          │
│                                                              │
│  ┌────────────────┐  ┌───────────────┐  ┌────────────────┐  │
│  │  /v1/query     │  │ /v1/query/    │  │  /v1/servers   │  │
│  │  Single Query  │  │    batch      │  │  Server List   │  │
│  └────────┬───────┘  └──────┬────────┘  └────────────────┘  │
└───────────┴─────────────────┴────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                    SQL SERVER (Port 1433)                     │
│                    10.0.0.110:1433                            │
│                                                              │
│  ┌──────────────────────┐  ┌─────────────────────────────┐  │
│  │  extend_db_ptrj (RW) │  │  db_ptrj (READ-ONLY)       │  │
│  │  - pm_users          │  │  - HR_EMPLOYEE              │  │
│  │  - pm_projects       │  │  - Other legacy tables      │  │
│  │  - pm_task_statuses  │  │                             │  │
│  │  - pm_tasks          │  │                             │  │
│  │  - pm_comments       │  │                             │  │
│  │  - pm_attachments    │  │                             │  │
│  └──────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Patterns

### 2.1. Data Flow Pattern

```
User Action → React Component → Server Action → API Client → SQL Gateway → SQL Server
                                                                    ↓
User Sees   ← React Rerender  ← Revalidate    ← Response  ← Query Result
```

### 2.2. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **SQL Gateway API** (not direct DB connection) | Centralized access control, shared with other internal apps |
| **Server Actions** over traditional REST | Simpler data mutations, leverages Next.js RSC benefits |
| **Cookie-based sessions** (not JWT) | Simpler for SSR; HTTP-only cookies for XSS protection |
| **Dark mode only** | Matches the organization's internal branding |
| **Prisma schema kept** (but unused at runtime) | Documents the data model; used for local dev fallback |

### 2.3. Security Layers

1. **Middleware** — Route protection (unauthenticated → login redirect)
2. **Server Actions** — Session validation before data mutations
3. **SQL Gateway** — Server-level & database-level read/write permissions
4. **SQL Gateway** — DDL operations (DROP, ALTER, CREATE) permanently blocked
5. **bcrypt** — Password hashing with 10 salt rounds

---

## 3. Technology Details

### 3.1. Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.1.6 | Framework (App Router) |
| `react` / `react-dom` | 19.2.3 | UI library |
| `tailwindcss` | 4.x | Utility-first CSS |
| `@radix-ui/*` | Various | Accessible headless UI primitives |
| `framer-motion` | 11.18.2 | Animations |
| `@hello-pangea/dnd` | 18.0.1 | Drag-and-drop for Kanban |
| `@excalidraw/excalidraw` | 0.18.0 | Canvas drawing |
| `@tiptap/*` | 2.x | Rich text editor (TipTap) |
| `lucide-react` | 0.563.0 | Icon library |
| `class-variance-authority` | 0.7.1 | Component variants |
| `clsx` + `tailwind-merge` | Latest | Class name utilities |

### 3.2. Backend

| Package | Version | Purpose |
|---------|---------|---------|
| `bcryptjs` | 3.0.3 | Password hashing |
| `uuid` | 9.0.1 | Unique ID generation |
| `date-fns` | 4.1.0 | Date manipulation |

### 3.3. Database

| Package | Version | Purpose |
|---------|---------|---------|
| `@prisma/client` | 5.10.2 | ORM client (dev fallback) |
| `prisma` | 5.10.2 | Schema management & migrations |
| `better-sqlite3` | 12.6.2 | Local SQLite driver (dev) |

### 3.4. Dev Tools

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | 5.x | Type safety |
| `eslint` + `eslint-config-next` | 9.x | Code linting |
| `tsx` | 4.21.0 | TypeScript execution |
| `dotenv` | 17.2.4 | Environment variable loading |
