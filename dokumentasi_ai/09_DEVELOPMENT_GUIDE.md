# 🛠️ Development Guide

> **Version**: 1.0  
> **Last Updated**: 2026-02-17

---

## 1. Quick Start

```bash
# 1. Clone the project
cd "d:\Gawean Rebinmas\Schedule Tracker\schedule-tracker"

# 2. Install dependencies
bun install

# 3. Set up environment
cp .env.production.example .env.local
# Edit .env.local with your SQL Gateway credentials

# 4. Start development server
bun run dev

# 5. Open browser
# http://localhost:3000
```

---

## 2. Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `bun run dev` | Start dev server (Webpack mode) |
| `build` | `bun run build` | Production build (Webpack) |
| `start` | `bun run start` | Start production server (0.0.0.0) |
| `lint` | `bun run lint` | Run ESLint |
| `migrate` | `bun run migrate` | Migrate SQLite → SQL Server |
| `test:prod` | `bun run test:prod` | Test production connection |
| `test:connection` | `bun run test:connection` | Test SQL Gateway connection |

---

## 3. Development Workflow

### 3.1. Adding a New Page

1. Create route in `app/<route>/page.tsx`
2. Add the path to `middleware.ts` protected paths (if needed)
3. Add navigation link in `components/Sidebar.tsx`

### 3.2. Adding a New API Operation

1. Add SQL query in `lib/api/projects.ts` or `lib/api/tasks.ts`
2. Create Server Action in `app/actions/<module>.ts`
3. Call the action from your React component

**Example — Adding a new query:**

```typescript
// lib/api/projects.ts
export async function getProjectsByStatus(status: string): Promise<Project[]> {
  const result = await sqlGateway.query<any>(
    `SELECT * FROM pm_projects WHERE status = @status ORDER BY created_at DESC`,
    { status }
  );
  return result.recordset.map(toProjectCamelCase);
}

// app/actions/project.ts
export async function getProjectsByStatus(status: string) {
  try {
    const projects = await apiGetProjectsByStatus(status);
    return { success: true, data: projects };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

### 3.3. Adding a New Component

1. Create component in `components/<name>.tsx`
2. For base UI, add to `components/ui/`
3. Use Tailwind classes + dark mode palette

### 3.4. Adding a New Database Table

1. Add model to `prisma/schema.prisma`
2. Add SQL migration to `prisma/sql-server-migration.sql`
3. Create API functions in `lib/api/`
4. Create server actions in `app/actions/`
5. Run migration via SQL Gateway

---

## 4. Key Conventions

### 4.1. File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Pages | `page.tsx` | `app/projects/page.tsx` |
| Server Actions | `<module>.ts` | `app/actions/task.ts` |
| Components | `PascalCase.tsx` | `KanbanBoard.tsx` |
| UI Components | `lowercase.tsx` | `button.tsx` |
| API Clients | `kebab-case.ts` | `sql-gateway.ts` |

### 4.2. Data Flow Convention

```
Component → Server Action → API Client (lib/api/) → SQL Gateway → SQL Server
```

- **Never** call SQL Gateway directly from components
- **Always** go through Server Actions for mutations
- **Always** revalidate paths after mutations

### 4.3. Error Handling Pattern

```typescript
// Standard response format
return { success: true, data: result };
return { success: false, error: "Error message" };
```

### 4.4. Naming Convention for SQL

| Context | Convention |
|---------|-----------|
| SQL Server tables | `pm_` prefix + `snake_case` |
| SQL columns | `snake_case` |
| TypeScript | `camelCase` |
| Use `toCamelCase()` | when reading from SQL |
| Use `toSnakeCase()` | when writing to SQL |

---

## 5. Database Operations

### 5.1. Reading Data

```typescript
import { sqlGateway } from '@/lib/api/sql-gateway';

const result = await sqlGateway.query<any>(
  'SELECT * FROM pm_projects WHERE id = @id',
  { id: projectId }
);
const project = result.recordset[0];
```

### 5.2. Writing Data

```typescript
await sqlGateway.query(
  `INSERT INTO pm_tasks (id, title, project_id, status_id, priority, created_at, updated_at)
   VALUES (@id, @title, @projectId, @statusId, @priority, GETDATE(), GETDATE())`,
  { id: newId, title, projectId, statusId, priority }
);
```

### 5.3. Batch Operations (Transactions)

```typescript
await sqlGateway.batchQuery([
  { sql: 'DELETE FROM pm_comments WHERE task_id = @id', params: { id: taskId } },
  { sql: 'DELETE FROM pm_attachments WHERE task_id = @id', params: { id: taskId } },
  { sql: 'DELETE FROM pm_tasks WHERE id = @id', params: { id: taskId } },
]);
```

---

## 6. Utility Scripts

| Script | Purpose |
|--------|---------|
| `scripts/push-to-sql-server.ts` | Push Prisma schema to SQL Server |
| `scripts/migrate-sqlite-to-sqlserver.ts` | Full data migration SQLite → SQL Server |
| `scripts/test-production-connection.js` | Test all production endpoints |
| `scripts/verify-api.ts` | Verify API is responding |
| `scripts/verify-migration.ts` | Verify migration completeness |
| `scripts/verify-server-access.ts` | Test server network access |
| `scripts/update-user-password.js` | Reset a user's password |
| `scripts/debug-projects-query.ts` | Debug project queries |
| `scripts/test-sync.ts` | Test sync operations |

---

## 7. Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Build fails with uuid error** | Run `bun install` to ensure `uuid@9.0.1` is installed |
| **`next dev` Turbopack error** | Dev script uses `--webpack` flag intentionally |
| **SQL Gateway timeout** | Check network connectivity to `10.0.0.110:8001` |
| **Session lost after refresh** | Verify `NODE_ENV` and cookie settings in `lib/auth.ts` |
| **Canvas not saving** | Canvas data is stored in `project.description` as `[CANVAS_DATA:...]` |
| **Image upload fails** | Images stored as base64 — check file size limits |

---

## 8. Important Notes

1. **Build Flag**: Always use `--webpack` flag (not Turbopack) — set in `package.json` scripts
2. **Database**: Production uses SQL Server via API Gateway, NOT local SQLite
3. **Dark Mode**: Application is dark-mode only by design
4. **SQL Server Write**: Only `SERVER_PROFILE_1` + `extend_db_ptrj` allow write operations
5. **Blocked SQL**: `DROP`, `TRUNCATE`, `ALTER`, `CREATE`, `GRANT`, `REVOKE` are blocked by the gateway
