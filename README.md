# Rebinmas Schedule Tracker

Modern project management application built with Next.js 16, using SQL Server database via SQL Gateway API.

## Features

- **Kanban Board** - Drag-and-drop task management
- **Canvas View** - Excalidraw integration for visual planning
- **Dark Mode** - Slate-950 dark theme
- **Rich Text Editor** - TipTap editor with image upload
- **Project Categories** - Sekarang (Current), Rencana (Planned), Selesai (Completed)

## Tech Stack

- **Framework**: Next.js 16.1.6 with App Router
- **Database**: SQL Server via SQL Gateway API (NOT SQLite)
- **UI**: Tailwind CSS, shadcn/ui components
- **Rich Text**: TipTap editor v2.27
- **Canvas**: Excalidraw integration

## Database Configuration

⚠️ **IMPORTANT**: This application uses **SQL Server** database, not SQLite.

### Connection Details

- **API URL**: `http://10.0.0.110:8001`
- **Server**: `SERVER_PROFILE_1` (10.0.0.110:1433)
- **Database**: `extend_db_ptrj`
- **Authentication**: API Token based

### Tables

| Table | Description |
|-------|-------------|
| `pm_users` | User accounts (ADMIN, PM, MEMBER) |
| `pm_projects` | Project management data |
| `pm_task_statuses` | Custom task statuses per project |
| `pm_tasks` | Task items with assignments |
| `pm_comments` | Task comments/discussions |
| `pm_attachments` | File attachments for tasks |

### Security Restrictions

- **ONLY `SERVER_PROFILE_1`** is allowed for write operations
- **ONLY `extend_db_ptrj`** database is allowed for write operations
- Other databases (`db_ptrj`, etc.) are **READ-ONLY**

## Getting Started

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm
- Access to SQL Gateway API at `http://10.0.0.110:8001`

### Installation

```bash
bun install
```

### Environment Variables

Create `.env.local`:

```env
# SQL Gateway API Configuration
SQL_GATEWAY_URL=http://10.0.0.110:8001
SQL_GATEWAY_TOKEN=2a993486e7a448474de66bfaea4adba7a99784defbcaba420e7f906176b94df6
SQL_GATEWAY_SERVER=SERVER_PROFILE_1
SQL_GATEWAY_DATABASE=extend_db_ptrj
```

### Database Setup

The database tables should already be created. If not, run:

```bash
# Run seeder (creates tables and seeds data)
bun run prisma/seed-sql-server.ts
```

### Development

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@rebinmas.polda.id | admin123 |
| PM | manager@rebinmas.polda.id | manager123 |
| MEMBER | member@rebinmas.polda.id | member123 |

⚠️ **Change these in production!**

## Project Structure

```
schedule-tracker/
├── app/
│   ├── actions/         # Server actions (using SQL Gateway)
│   ├── api/             # API routes (using SQL Gateway)
│   ├── projects/        # Project pages
│   └── auth/            # Authentication pages
├── components/          # React components
│   ├── ui/              # shadcn/ui components
│   ├── KanbanBoard.tsx  # Kanban board
│   └── CanvasBoard.tsx  # Excalidraw canvas
├── lib/
│   ├── api/             # API clients (SQL Gateway)
│   │   ├── sql-gateway.ts      # SQL Gateway client
│   │   ├── projects.ts          # Project operations
│   │   ├── tasks.ts             # Task operations
│   │   └── users.ts             # User operations
│   ├── sync/            # Sync utilities
│   ├── auth.ts          # Auth utilities
│   └── utils.ts         # General utilities
└── prisma/
    ├── sql-server-migration.sql  # SQL migration script
    ├── seed-sql-server.ts        # Database seeder
    └── SQL-SERVER-README.md      # SQL Server documentation
```

## API Documentation

See `dokumentasi/api_query.md` for SQL Gateway API documentation.

## Development Commands

```bash
bun run dev      # Start dev server
bun run build    # Production build
bun run start    # Start production server
```

## Data Operations

All data operations use the SQL Gateway API:

```typescript
import { sqlGateway } from '@/lib/api/sql-gateway';
import { getProjects, createProject } from '@/lib/api/projects';

// Get projects
const projects = await getProjects(userId);

// Create project
const project = await createProject({
  name: 'New Project',
  description: 'Description',
  ownerId: userId,
});
```

## Sync API

Sync data between local cache and SQL Server:

```bash
# Get sync status
GET /api/sync

# Trigger sync
POST /api/sync
{
  "direction": "both",  // "push", "pull", or "both"
  "tables": ["projects", "tasks"]
}
```

## License

MIT
