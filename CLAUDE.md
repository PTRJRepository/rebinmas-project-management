# Rebinmas Schedule Tracker Project

## Project Overview
Modern project management application built with Next.js 16, Prisma, and SQLite. Features include:
- Kanban board for task management
- Canvas view with Excalidraw integration
- Dark mode only theme
- Rich text editor with image upload
- Project categorization: Sekarang (Current), Rencana (Planned), Selesai (Completed)

## Tech Stack
- **Framework**: Next.js 16.1.6 with App Router
- **Database**: Prisma ORM with SQLite
- **UI**: Tailwind CSS, shadcn/ui components
- **Rich Text**: TipTap editor v2.27
- **Canvas**: Excalidraw integration
- **Styling**: Dark mode only (slate-950, slate-900, slate-800 colors)

## Key File Locations

### Database
- `prisma/schema.prisma` - Database schema (Project, Task, TaskStatus, User)
- `lib/prisma.ts` - Prisma client singleton

### API Routes
- `app/api/projects/` - Project CRUD
- `app/api/projects/[id]/` - Project update/delete
- `app/api/projects/[id]/canvas/` - Canvas save/load
- `app/api/tasks/` - Task operations
- `app/api/user/` - Current user

### Server Actions
- `app/actions/auth.ts` - Authentication (getCurrentUser, getSession)
- `app/actions/project.ts` - Project operations
- `app/actions/task.ts` - Task operations

### Components
- `components/AppShell.tsx` - Main layout (conditionally shows sidebar based on auth)
- `components/Sidebar.tsx` - Navigation sidebar
- `components/KanbanBoard.tsx` - Kanban board with drag-drop
- `components/CanvasBoard.tsx` - Excalidraw canvas integration
- `components/editor/NovelEditor.tsx` - Rich text editor with TipTap
- `components/task/TaskDescriptionEditor.tsx` - Task description editor

### Pages
- `app/projects/page.tsx` - Projects dashboard (Sekarang/Rencana/Selesai rows)
- `app/projects/[id]/page.tsx` - Project detail/overview
- `app/projects/[id]/ProjectBoardClient.tsx` - Client-side project board
- `app/projects/[id]/board/[taskId]/page.tsx` - Task detail with rich text editor

## Important Implementation Details

### Authentication Flow
1. `getSession()` in `lib/auth.ts` checks session cookie
2. Root layout (`app/layout.tsx`) gets session and passes `isAuthenticated` to AppShell
3. AppShell conditionally renders Sidebar only when authenticated
4. Public pages (login, register) don't show sidebar

### Dark Mode Only
- `globals.css` - All colors set to dark theme (slate-950 background)
- `layout.tsx` - Has `className="dark"` on html element
- No theme toggle - dark mode only

### Project Categorization (Dashboard)
```typescript
// Based on date ranges:
// - Selesai: endDate < now (past deadline)
// - Sekarang: startDate <= now AND endDate >= now
// - Rencana: startDate > now (future)
```

### Image Upload in Rich Text Editor
- Drag & drop, copy-paste, or file selection
- Client-side compression (1200px max width, 80% quality)
- Stored as base64 in database

### Canvas Save Issue
- Fixed: Canvas saves to localStorage AND `/api/projects/[id]/canvas`
- Data stored in project.description as `[CANVAS_DATA:...]` JSON

## TypeScript Build Fixes Applied
1. Fixed `id` vs `projectId` in `app/actions/project.ts` delete function
2. Added `name` field to Task interface assignee type in ProjectBoardClient.tsx
3. Added `bannerImage` to form reset in projects/page.tsx
4. Fixed `new Image()` conflict with TipTap Image extension
5. Fixed ExcalidrawWrapper to not use ref prop (not supported)
6. Changed "compact" to "focus" in LayoutSwitcher.tsx
7. Removed duplicate `size` attribute in TaskDetailHeader.tsx

## Known Issues
- Canvas save API needs improvement (currently storing in description field)
- Should use dedicated Canvas table in database for production

## Development Commands
```bash
bun run dev      # Start dev server
bun run build    # Production build
bun run start    # Start production server
```

## Default Project Banner
https://www.shutterstock.com/image-photo/successful-business-development-plan-path-260nw-1994345504.jpg
