# 🧩 UI Components Reference

> **Version**: 1.0  
> **Last Updated**: 2026-02-17

---

## 1. Component Architecture

```
AppShell (layout wrapper)
├── Sidebar (navigation)
├── Breadcrumbs (page header)
│
├── [Page Content]
│   ├── Dashboard
│   │   ├── DashboardPage
│   │   └── ProjectCard
│   │
│   ├── Projects List
│   │   └── ProjectCard (reusable)
│   │
│   ├── Project Board
│   │   ├── LayoutSwitcher (Kanban / Canvas toggle)
│   │   ├── KanbanBoard
│   │   │   ├── KanbanTask (per card)
│   │   │   └── CreateTaskDialog
│   │   └── CanvasBoard (Excalidraw)
│   │
│   ├── Task Detail
│   │   ├── TaskDetailHeader
│   │   ├── TaskDescriptionEditor (TipTap)
│   │   └── Comments Section
│   │
│   ├── Reports
│   │   ├── ReportPage
│   │   └── ProjectReportPage
│   │
│   └── Auth Pages
│       ├── LoginForm
│       └── RegisterForm
│
├── ThemeProvider (dark mode context)
├── LayoutProvider (layout state)
└── AnimatedBackground
```

---

## 2. Core Components

### 2.1. `AppShell.tsx`

**Purpose**: Main application shell — wraps all pages with sidebar + content layout.

| Prop | Type | Description |
|------|------|-------------|
| `isAuthenticated` | `boolean` | Show/hide sidebar |
| `children` | `ReactNode` | Page content |

**Behavior**: Conditionally renders Sidebar only when authenticated.

---

### 2.2. `Sidebar.tsx` (10,033 bytes)

**Purpose**: Left navigation panel with project links.

**Sections**:
- User profile header (avatar, name, role)
- Navigation links (Dashboard, Projects, Reports, Settings, Users)
- Collapsible design
- Logout button

---

### 2.3. `KanbanBoard.tsx` (12,253 bytes)

**Purpose**: Drag-and-drop task board with status columns.

| Prop | Type | Description |
|------|------|-------------|
| `project` | `Project` | Project data with tasks & statuses |

**Features**:
- Drag-and-drop via `@hello-pangea/dnd`
- Dynamic columns based on `TaskStatus` records
- Task creation per column
- Real-time status update on drop

---

### 2.4. `KanbanTask.tsx` (19,917 bytes)

**Purpose**: Individual Kanban card with task information.

**Displays**:
- Task title and description (HTML stripped)
- Priority badge (color-coded)
- Due date with deadline awareness
- Assignee avatar
- Progress bar (if > 0%)
- Comment count

---

### 2.5. `CanvasBoard.tsx` (12,468 bytes)

**Purpose**: Excalidraw integration for visual project planning.

**Features**:
- Full Excalidraw drawing canvas
- Auto-save to project description field
- Load from localStorage + API

---

### 2.6. `RichTextEditor.tsx` (11,471 bytes)

**Purpose**: TipTap-based rich text editor for task documentation.

**Features**:
- Bold, italic, underline, strikethrough
- Headings (H1-H6)
- Bullet/ordered lists
- Task lists (checkboxes)
- Image upload (drag-drop, paste, file picker)
  - Client-side compression (1200px max, 80% quality)
  - Stored as base64 in database
- Links
- Text alignment
- Color picker
- Code blocks

---

### 2.7. `CreateTaskDialog.tsx` (9,047 bytes)

**Purpose**: Modal dialog for creating a new task.

**Fields**:
- Title (required)
- Description
- Priority (LOW/MEDIUM/HIGH/CRITICAL)
- Due date
- Estimated hours
- Assignee
- Status column (pre-selected based on context)

---

### 2.8. `ReportPage.tsx` (40,518 bytes)

**Purpose**: Full reporting dashboard with statistics and charts.

**Includes**: Project summaries, task distribution, timeline views, progress metrics.

---

### 2.9. `ProjectReportPage.tsx` (23,130 bytes)

**Purpose**: Detailed report for a specific project.

---

## 3. Base UI Components (`components/ui/`)

Built with **shadcn/ui** + **Radix UI** primitives:

| Component | Package | Description |
|-----------|---------|-------------|
| `Button` | `@radix-ui/react-slot` | Variants: default, destructive, outline, secondary, ghost, link |
| `Card` | Custom | Card, CardHeader, CardTitle, CardContent, CardFooter |
| `Dialog` | `@radix-ui/react-dialog` | Modal dialogs with overlay |
| `Input` | Native | Styled text input |
| `Label` | `@radix-ui/react-label` | Form labels |
| `Progress` | `@radix-ui/react-progress` | Progress bar |
| `Separator` | `@radix-ui/react-separator` | Visual dividers |
| `Toast` | `@radix-ui/react-toast` | Notification toasts |
| `Tooltip` | `@radix-ui/react-tooltip` | Hover tooltips |
| `Avatar` | `@radix-ui/react-avatar` | User avatars with fallback |

---

## 4. Provider Components

### 4.1. `ThemeProvider` (`theme-provider.tsx`)
Manages dark mode state. Currently **dark mode only** — no toggle.

### 4.2. `LayoutProvider` (`layout-provider.tsx`)
Manages layout state (e.g., sidebar collapse, view mode).

---

## 5. Styling Approach

| Aspect | Technology |
|--------|-----------|
| Framework | **Tailwind CSS v4** |
| Color Palette | Slate-950 (dark), Slate-900, Slate-800 |
| Variants | `class-variance-authority` (CVA) |
| Merging | `clsx` + `tailwind-merge` |
| Animations | **Framer Motion** |
| Icons | **Lucide React** |
| Typography | System + custom Google Fonts |

### Dark Theme Colors

```css
--background: slate-950    /* #020617 */
--foreground: slate-50     /* #f8fafc */
--card: slate-900          /* #0f172a */
--border: slate-800        /* #1e293b */
--primary: blue-600        /* #2563eb */
--destructive: red-600     /* #dc2626 */
--muted: slate-800         /* #1e293b */
```
