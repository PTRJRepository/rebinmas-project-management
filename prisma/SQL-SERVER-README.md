# SQL Server Integration - Schedule Tracker

## Overview

This project integrates with an external SQL Server database via the SQL Gateway API for storing and synchronizing Project Management data.

## Security Restrictions (IMPORTANT)

⚠️ **STRICT SECURITY POLICY - DO NOT VIOLATE**

- **ONLY `SERVER_PROFILE_1`** is allowed for write operations
- **ONLY `extend_db_ptrj`** database is allowed for write operations
- Other databases (`db_ptrj`, `db_ptrj_mill`, etc.) are **READ-ONLY**
- Any attempt to write to other profiles/databases will be blocked

### API Configuration

```env
SQL_GATEWAY_URL=http://10.0.0.110:8001
SQL_GATEWAY_TOKEN=2a993486e7a448474de66bfaea4adba7a99784defbcaba420e7f906176b94df6
SQL_GATEWAY_SERVER=SERVER_PROFILE_1
SQL_GATEWAY_DATABASE=extend_db_ptrj
```

## Database Schema

The following tables are created in `extend_db_ptrj` database:

| Table | Description |
|-------|-------------|
| `pm_users` | User accounts (ADMIN, PM, MEMBER roles) |
| `pm_projects` | Project management data |
| `pm_task_statuses` | Custom task statuses per project |
| `pm_tasks` | Task items with assignments |
| `pm_comments` | Task comments/discussions |
| `pm_attachments` | File attachments for tasks |

## Files Structure

```
schedule-tracker/
├── prisma/
│   ├── sql-server-migration.sql    # SQL migration script
│   └── seed-sql-server.ts          # TypeScript seeder
├── lib/
│   ├── api/
│   │   └── sql-gateway.ts          # API client library
│   └── sync/
│       └── sql-sync.ts             # Sync utility
└── app/api/
    └── sync/
        └── route.ts                # Sync API endpoint
```

## Setup Instructions

### 1. Create Tables (Migration)

Run the migration script via curl or use the SQL Gateway API:

```bash
# Using the seeder (includes table creation)
bun run prisma/seed-sql-server.ts
```

Or execute the SQL manually:
```bash
cat prisma/sql-server-migration.sql
# Execute each CREATE TABLE statement via /v1/query endpoint
```

### 2. Seed Initial Data

The seeder will create:
- 3 demo users (admin, manager, member)
- 3 sample projects
- 5 default task statuses per project
- 7 sample tasks
- 3 sample comments

```bash
bun run prisma/seed-sql-server.ts
```

## Usage

### Direct API Client

```typescript
import { sqlGateway, pmQueries } from '@/lib/api/sql-gateway';

// Get all projects
const projects = await pmQueries.projects.getAll();

// Get tasks for a project
const tasks = await pmQueries.tasks.getByProject('proj-001');

// Create a new task
await pmQueries.tasks.create({
  id: 'task-123',
  title: 'New Task',
  project_id: 'proj-001',
  status_id: 'status-001',
  // ... other fields
});
```

### Sync API Endpoint

```bash
# Get sync status
GET /api/sync

# Trigger sync operation
POST /api/sync
{
  "direction": "both",  // "push", "pull", or "both"
  "tables": ["projects", "tasks"]  // optional
}
```

### Programmatic Sync

```typescript
import { syncData, pushToServer, pullFromServer } from '@/lib/sync/sql-sync';

// Bidirectional sync
await syncData({
  direction: 'both',
  tables: ['users', 'projects', 'tasks', 'statuses', 'comments']
});

// Quick push local changes to server
await pushToServer();

// Quick pull from server to local
await pullFromServer();
```

## Data Flow

```
┌─────────────────────┐         ┌──────────────────────┐
│  Local SQLite       │         │  SQL Server          │
│  (Prisma ORM)       │◄────────│  extend_db_ptrj      │
│                     │  Sync   │  pm_* tables         │
│  - projects         │         │                      │
│  - tasks            │         │  - pm_projects       │
│  - users            │         │  - pm_tasks          │
│  - comments         │         │  - pm_users          │
└─────────────────────┘         └──────────────────────┘
           ▲                              ▲
           │                              │
           └────────── SQL Gateway ───────┘
                   API:8001
```

## API Documentation Reference

See `dokumentasi/api_query.md` for complete SQL Gateway API documentation.

## Troubleshooting

### Connection Issues

```bash
# Check API health
curl http://10.0.0.110:8001/health

# List available servers
curl -H "x-api-key: YOUR_TOKEN" http://10.0.0.110:8001/v1/servers

# Check databases
curl -H "x-api-key: YOUR_TOKEN" "http://10.0.0.110:8001/v1/databases?server=SERVER_PROFILE_1"
```

### Permission Errors

If you see "Access denied" errors:
1. Verify you're using `SERVER_PROFILE_1`
2. Verify database is `extend_db_ptrj` (not `db_ptrj`)
3. Check API token is valid

### Table Already Exists

The migration uses `IF NOT EXISTS` so it's safe to run multiple times.

## Security Notes

1. **NEVER** hardcode API tokens in client-side code
2. **ALWAYS** use environment variables for sensitive data
3. **ONLY** use SERVER_PROFILE_1 for write operations
4. **READ-ONLY** access to other databases (db_ptrj, etc.)
5. The API endpoint `/api/sync` should be protected with authentication

## Default Credentials (Demo)

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@rebinmas.polda.id | admin123 |
| PM | manager@rebinmas.polda.id | manager123 |
| MEMBER | member@rebinmas.polda.id | member123 |

⚠️ **Change these passwords in production!**
