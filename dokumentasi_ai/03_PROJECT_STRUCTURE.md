# 📁 Project Structure

> **Version**: 1.0  
> **Last Updated**: 2026-02-17

---

## Full Directory Tree

```
schedule-tracker/
│
├── 📄 package.json              # Dependencies & scripts
├── 📄 tsconfig.json              # TypeScript configuration
├── 📄 next.config.ts             # Next.js configuration
├── 📄 middleware.ts              # Route protection middleware
├── 📄 postcss.config.mjs         # PostCSS config (Tailwind)
├── 📄 eslint.config.mjs          # ESLint configuration
├── 📄 .env                       # Environment variables
├── 📄 .env.production.example    # Production env template
├── 📄 README.md                  # Project README
├── 📄 CLAUDE.md                  # AI assistant context file
├── 📄 PRODUCTION_LOGIN_CHECKLIST.md
│
├── 📂 app/                       # Next.js App Router
│   ├── 📄 layout.tsx             # Root layout (dark mode, fonts)
│   ├── 📄 page.tsx               # Root page (redirects)
│   ├── 📄 globals.css            # Global styles & CSS variables
│   ├── 📄 favicon.ico
│   │
│   ├── 📂 actions/               # Server Actions
│   │   ├── 📄 auth.ts            # login, register, logout, getCurrentUser
│   │   ├── 📄 project.ts         # CRUD for projects
│   │   ├── 📄 task.ts            # CRUD for tasks + comments
│   │   ├── 📄 user.ts            # User management actions
│   │   └── 📄 dashboard.ts       # Dashboard statistics
│   │
│   ├── 📂 api/                   # API Routes (REST)
│   │   ├── 📂 projects/          # Project endpoints
│   │   │   ├── 📂 [id]/          # Single project
│   │   │   │   ├── 📂 canvas/    # Canvas data save/load
│   │   │   │   └── route.ts      # GET, PUT, DELETE project
│   │   │   └── route.ts          # GET all, POST create
│   │   ├── 📂 tasks/             # Task endpoints
│   │   │   ├── 📂 [id]/          # Single task operations
│   │   │   └── route.ts          # GET, POST tasks
│   │   ├── 📂 statuses/          # Task status endpoints
│   │   ├── 📂 user/              # Current user endpoint
│   │   ├── 📂 upload/            # File upload endpoint
│   │   ├── 📂 sync/              # Data sync endpoint
│   │   ├── 📂 seed/              # Database seeder endpoint
│   │   └── 📂 logout/            # Logout endpoint
│   │
│   ├── 📂 auth/                  # Auth pages
│   │   ├── 📂 login/             # Login page
│   │   └── 📂 register/          # Register page (if exposed)
│   │
│   ├── 📂 dashboard/             # Dashboard page
│   │   └── 📄 page.tsx
│   │
│   ├── 📂 projects/              # Projects section
│   │   ├── 📄 page.tsx           # Projects list/dashboard
│   │   ├── 📂 [id]/              # Project detail
│   │   │   ├── 📄 page.tsx       # Project overview
│   │   │   ├── 📄 ProjectBoardClient.tsx  # Client board
│   │   │   └── 📂 board/
│   │   │       └── 📂 [taskId]/  # Task detail page
│   │   │           └── 📄 page.tsx
│   │   └── 📂 new/               # New project page
│   │
│   ├── 📂 reports/               # Reports section
│   │   └── 📄 page.tsx
│   │
│   ├── 📂 settings/              # Settings page
│   │   └── 📄 page.tsx
│   │
│   └── 📂 users/                 # User management page
│       └── 📄 page.tsx
│
├── 📂 components/                # React components
│   ├── 📄 AppShell.tsx           # Main app shell (sidebar + content)
│   ├── 📄 Sidebar.tsx            # Navigation sidebar
│   ├── 📄 Breadcrumbs.tsx        # Page breadcrumbs
│   ├── 📄 KanbanBoard.tsx        # Kanban board with DnD
│   ├── 📄 KanbanTask.tsx         # Individual Kanban card
│   ├── 📄 CanvasBoard.tsx        # Excalidraw canvas wrapper
│   ├── 📄 CreateTaskDialog.tsx   # New task modal dialog
│   ├── 📄 ReportPage.tsx         # Report generation page
│   ├── 📄 ProjectReportPage.tsx  # Project-specific report
│   ├── 📄 RichTextEditor.tsx     # TipTap rich text editor
│   ├── 📄 QuickActions.tsx       # Quick action buttons
│   ├── 📄 AnimatedBackground.tsx # Animated BG effects
│   ├── 📄 LayoutSwitcher.tsx     # View mode toggle
│   ├── 📄 ExcalidrawWrapper.tsx  # Excalidraw lazy loader
│   ├── 📄 SkipLink.tsx           # Accessibility skip link
│   ├── 📄 theme-provider.tsx     # Theme context provider
│   ├── 📄 theme-toggle.tsx       # Theme toggle button
│   ├── 📄 layout-provider.tsx    # Layout context provider
│   │
│   ├── 📂 auth/                  # Auth components
│   │   ├── 📄 login-form.tsx     # Login form
│   │   ├── 📄 register-form.tsx  # Registration form
│   │   └── 📄 ...
│   │
│   ├── 📂 dashboard/             # Dashboard components
│   │   ├── 📄 DashboardPage.tsx
│   │   ├── 📄 ProjectCard.tsx
│   │   └── 📄 ...
│   │
│   ├── 📂 editor/                # Editor components
│   │   ├── 📄 NovelEditor.tsx    # Full rich text editor
│   │   └── 📄 ...
│   │
│   ├── 📂 kanban/                # Kanban sub-components
│   │   └── 📄 ...
│   │
│   ├── 📂 task/                  # Task detail components
│   │   ├── 📄 TaskDetailHeader.tsx
│   │   ├── 📄 TaskDescriptionEditor.tsx
│   │   └── 📄 ...
│   │
│   ├── 📂 users/                 # User management components
│   │   └── 📄 ...
│   │
│   ├── 📂 notifications/         # Notification components
│   │   └── 📄 ...
│   │
│   └── 📂 ui/                    # Base UI components (shadcn)
│       ├── 📄 button.tsx
│       ├── 📄 card.tsx
│       ├── 📄 dialog.tsx
│       ├── 📄 input.tsx
│       ├── 📄 label.tsx
│       ├── 📄 progress.tsx
│       ├── 📄 separator.tsx
│       ├── 📄 toast.tsx
│       ├── 📄 tooltip.tsx
│       ├── 📄 avatar.tsx
│       └── 📄 ... (15 components total)
│
├── 📂 lib/                       # Shared libraries
│   ├── 📂 api/                   # API client layer
│   │   ├── 📄 sql-gateway.ts     # SQL Gateway client (425 lines)
│   │   ├── 📄 projects.ts        # Project API operations (836 lines)
│   │   ├── 📄 tasks.ts           # Task API operations (358 lines)
│   │   ├── 📄 users.ts           # User API operations
│   │   └── 📄 statuses.ts        # Task status operations
│   │
│   ├── 📂 sync/                  # Data sync utilities
│   │   └── 📄 ...
│   │
│   ├── 📄 auth.ts                # Auth utilities (bcrypt, sessions)
│   ├── 📄 prisma.ts              # Prisma client singleton
│   ├── 📄 sql-server-client.ts   # Direct SQL Server client (legacy)
│   ├── 📄 utils.ts               # General utilities (cn helper)
│   ├── 📄 deadline-utils.ts      # Deadline calculation helpers
│   ├── 📄 editor-utils.ts        # Editor utility functions
│   └── 📄 theme-utils.ts         # Theme helper functions
│
├── 📂 prisma/                    # Database schema & migrations
│   ├── 📄 schema.prisma          # Prisma schema (6 models)
│   ├── 📄 sql-server-migration.sql  # SQL Server migration script
│   ├── 📄 seed-sql-server.ts     # SQL Server seeder
│   ├── 📄 seed.ts                # SQLite seeder
│   ├── 📄 seed.js                # JS seeder fallback
│   ├── 📄 SQL-SERVER-README.md   # SQL Server setup docs
│   └── 📂 migrations/            # Prisma migration history
│
├── 📂 scripts/                   # Utility scripts
│   ├── 📄 push-to-sql-server.ts          # Push schema to SQL Server
│   ├── 📄 migrate-sqlite-to-sqlserver.ts # Full SQLite→SQL Server migration
│   ├── 📄 migrate-to-sql-server.ts       # Alternative migration script
│   ├── 📄 test-production-connection.js  # Production connection test
│   ├── 📄 verify-api.ts                  # API verification
│   ├── 📄 verify-migration.ts            # Migration verification
│   ├── 📄 verify-server-access.ts        # Server access verification
│   ├── 📄 test-sync.ts                   # Sync test
│   ├── 📄 debug-projects-query.ts        # Debug helper
│   └── 📄 update-user-password.js        # Password update utility
│
├── 📂 public/                    # Static assets
│   └── (images, icons)
│
├── 📂 docs/                      # Additional documentation
│   ├── 📄 PRODUCTION_DEPLOYMENT_GUIDE.md
│   └── 📂 plans/                 # Design & implementation plans
│
├── 📂 dokumentasi/               # Existing docs (API query)
│   └── 📄 api_query.md           # SQL Gateway API documentation
│
└── 📂 dokumentasi_ai/            # ← AI-generated documentation (this folder)
```

---

## Key File Descriptions

### Entry Points

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout — sets dark mode class, loads fonts, wraps with ThemeProvider |
| `app/page.tsx` | Root page — simple redirect (to dashboard or login) |
| `middleware.ts` | Route guard — redirects unauthenticated users to `/auth/login` |

### Data Layer

| File | Lines | Purpose |
|------|-------|---------|
| `lib/api/sql-gateway.ts` | 425 | Core SQL Gateway client — handles all DB queries via REST |
| `lib/api/projects.ts` | 836 | Project, Task, Comment, Attachment, User, Status CRUD |
| `lib/api/tasks.ts` | 358 | Additional task query operations |
| `lib/auth.ts` | 105 | Password hashing, session management |

### Component Sizes

| Component | Size (bytes) | Purpose |
|-----------|-------------|---------|
| `ReportPage.tsx` | 40,518 | Full reporting functionality |
| `ProjectReportPage.tsx` | 23,130 | Project-specific reports |
| `KanbanTask.tsx` | 19,917 | Kanban card with all interactions |
| `KanbanBoard.tsx` | 12,253 | Kanban board with drag-drop |
| `CanvasBoard.tsx` | 12,468 | Excalidraw canvas integration |
| `RichTextEditor.tsx` | 11,471 | TipTap rich text editor |
| `Sidebar.tsx` | 10,033 | Navigation sidebar |
