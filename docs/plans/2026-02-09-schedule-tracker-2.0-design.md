# Schedule Tracker 2.0 - Complete Redesign Document

**Date:** 2026-02-09
**Status:** Ready for Implementation
**Designer:** Claude AI

---

## Executive Summary

Complete redesign of Schedule Tracker application to address:
1. Unclear workflow and status transitions
2. Basic, non-professional UI
3. Lack of documentation capabilities
4. Missing deadline monitoring
5. Poor readability

**Target Style:** Professional Corporate (Jira/Asana-like)
**Key Additions:** Block-based editor (Notion-style), Deadline alerts, Progress monitoring

---

## 1. Visual Identity & Style Guide

### 1.1 Color Palette

```css
/* Primary Colors - Professional Blue Theme */
--primary: #0052CC;          /* Jira Blue - main CTAs, links */
--primary-hover: #0065FF;    /* Brighter blue - hover states */
--primary-light: #DEEBFF;    /* Light blue - backgrounds */

/* Secondary Colors */
--secondary: #42526E;        /* Neutral gray - secondary text */
--secondary-light: #DFE1E6;  /* Light gray - borders */

/* Backgrounds */
--bg-app: #F4F5F7;           /* App background */
--bg-surface: #FFFFFF;       /* Card/surface background */
--bg-hover: #EBECF0;         /* Hover background */

/* Status Colors (Flat, Professional) */
--status-backlog: #42526E;   /* Gray - Neutral */
--status-progress: #0052CC;  /* Blue - Active */
--status-review: #6554C0;    /* Purple - In review */
--status-done: #36B37E;      /* Green - Complete */

/* Priority Colors */
--priority-critical: #DE350B; /* Red */
--priority-high: #FF991F;     /* Orange */
--priority-medium: #FFAB00;   /* Yellow */
--priority-low: #36B37E;      /* Green */

/* Alert Colors */
--alert-error: #DE350B;       /* Error/Overdue */
--alert-warning: #FF991F;     /* Warning/Upcoming */
--alert-success: #36B37E;     /* Success */
--alert-info: #0052CC;        /* Info */
```

### 1.2 Typography

```css
/* Font Family */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Type Scale */
--text-xs: 11px;     /* Labels, badges */
--text-sm: 13px;     /* Body text, metadata */
--text-base: 15px;   /* Default */
--text-md: 16px;     /* Card titles */
--text-lg: 18px;     /* Section headers */
--text-xl: 24px;     /* Page titles */
--text-2xl: 32px;    /* Hero titles */

/* Font Weights */
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

### 1.3 Spacing System

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

### 1.4 Border Radius

```css
--radius-sm: 4px;    /* Small elements, badges */
--radius-md: 8px;    /* Cards, buttons */
--radius-lg: 12px;   /* Large containers */
--radius-full: 9999px; /* Pills, avatars */
```

---

## 2. Component Specifications

### 2.1 Kanban Board

**Layout:**
- Horizontal scrollable columns
- Fixed width columns: 320px each
- Gap between columns: 24px
- Min height: 600px

**Column Header:**
```
┌────────────────────────────────────────┐
│  BACKLOG                    [12]       │
│  ─────────────────────────────────────  │  ← 4px colored top border
└────────────────────────────────────────┘
```
- Height: 48px
- Top border: 4px solid (status color)
- Title: Uppercase, 13px, semibold
- Count badge: pill, status color background

**Column Background:**
- Default: `#FAFBFC`
- Drag over: `#E3F8FF` (light blue highlight)
- Border: 1px dashed `#C1C7D0` when empty

### 2.2 Task Card (Redesigned for Readability)

```
┌─────────────────────────────────────────────────────────┐
│ 🔴 HIGH  │  Fix authentication bug              👤 JD   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Users report login failures when clicking              │
│ the login button on Chrome browser...                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ 📅 Feb 15  │  ⏱️ 4h  │  💬 3  │  ━━━━ 60% Complete   │
├─────────────────────────────────────────────────────────┤
│                    [→ Move to Review]                   │
└─────────────────────────────────────────────────────────┘
```

**Specs:**
- Width: 100% (max 320px)
- Padding: 16px
- Border radius: 8px
- Box shadow: 0 1px 2px rgba(0,0,0,0.1)
- Border left: 4px solid (priority color)

**States:**
- Default: White background
- Hover: Shadow 0 4px 8px rgba(0,0,0,0.15)
- Dragging: Scale 1.02, rotate 3deg, shadow 0 8px 16px
- Overdue: Background `#FFF1F0`, border `#FF4D4F`

**Typography:**
- Title: 15px, semibold, text-gray-900, max 2 lines
- Description: 13px, text-gray-600, max 2 lines
- Labels: 11px, text-gray-500 uppercase

### 2.3 Deadline Alert Bar

**Position:** Fixed at top of main content (below navbar)

```
┌────────────────────────────────────────────────────────────────────┐
│ 🔔 DEADLINE ALERTS                                                   │
│                                                                     │
│  🔴 3 tasks overdue today    │    🟡 5 tasks due in next 3 days     │
│                    [View Tasks]                                      │
└────────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Height: 56px
- Background: Gradient from `#FF4D4F` to `#FF991F`
- Text: White, 14px
- Dismissible with × button
- Click "View Tasks" filters board to show only deadline tasks

### 2.4 Toast Notifications

**Position:** Bottom-right, fixed

**Types:**
```
Success: [✓] Task moved to Review
Error:   [✕] Failed to save changes
Info:    [i] 3 tasks due this week
```

**Specs:**
- Width: 320px
- Height: auto, min 56px
- Border radius: 8px
- Animation: Slide in from right (300ms)
- Auto-dismiss: 4000ms

---

## 3. Block-Based Editor Specification

### 3.1 Library Choice

**Selected:** `novel` (Built on Tiptap)
- Mature, well-maintained
- Notion-like out of the box
- Slash commands built-in
- Image support with upload
- Collaborative ready

**Installation:**
```bash
npm install novel @tiptap/react @tiptap/starter-kit
npm install @tiptap/extension-image @tiptap/extension-placeholder
```

### 3.2 Supported Blocks

| Command | Block Type | Icon | Description |
|---------|-----------|------|-------------|
| `/text` | Paragraph | Aa | Plain text block |
| `/h1` | Heading 1 | H1 | Large heading |
| `/h2` | Heading 2 | H2 | Medium heading |
| `/h3` | Heading 3 | H3 | Small heading |
| `/bullet` | Bullet List | • | Bullet list |
| `/ordered` | Numbered List | 1. | Numbered list |
| `/todo` | Checkbox | ☐ | Todo checkbox |
| `/quote` | Quote | " | Block quote |
| `/code` | Code Block | <> | Code snippet |
| `/divider` | Divider | — | Horizontal line |
| `/image` | Image | 🖼️ | Image upload |

### 3.3 Markdown Shortcuts

- `# ` + space → H1
- `## ` + space → H2
- `### ` + space → H3
- `- ` + space → Bullet list
- `1. ` + space → Numbered list
- `[] ` + space → Todo
- `>` + space → Quote
- `---` + enter → Divider
- ``` → Code block

### 3.4 Image Handling

**Features:**
- Drag & drop images
- Paste from clipboard
- Click to upload button
- Max file size: 5MB
- Allowed formats: JPG, PNG, GIF, WebP
- Auto-resize: Max width 100%
- Optional caption
- Alt text required (accessibility)

**Storage:** Vercel Blob / Local fallback

### 3.5 Editor UI

```
┌─────────────────────────────────────────────────────────────┐
│  Type '/' for commands...                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## Problem Description                                     │
│  Users report login failures when clicking the             │
│  login button...                                            │
│                                                             │
│  [Screenshot: error-message.png]                            │
│  △ Error dialog showing "Authentication failed"             │
│                                                             │
│  ## Steps to Reproduce                                      │
│  ☐ Navigate to login page                                   │
│  ☐ Enter valid credentials                                  │
│  ☐ Click "Login" button                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Workflow Improvements

### 4.1 Status Flow

**Basic Workflow (4 statuses):**
```
Backlog → In Progress → Review → Done
```

**Visual Indicators:**
1. **Progress Bar** above board showing current position
2. **Arrows** between columns (→)
3. **"Move to Next"** button on each card
4. **Tooltip** showing: "Current: In Progress → Next: Review"

### 4.2 Quick Actions

**Task Card Hover Actions:**
- Edit title (click on title)
- Delete (trash icon, with confirmation)
- Duplicate (clone icon)
- Move to next (arrow icon, primary action)

**Keyboard Shortcuts:**
- `Enter` on card → Open task detail
- `Delete` on selected card → Delete task
- `N` → New task quick add
- `/` → Open slash menu (in editor)
- `Ctrl/Cmd + S` → Save

### 4.3 Enhanced Empty States

**Per Column:**

| Column | Icon | Title | Subtitle | Action |
|--------|------|-------|----------|--------|
| Backlog | 📄 | No tasks yet | Tasks start here | + Create Task |
| In Progress | 🔄 | Nothing in progress | Move from Backlog | Drag tasks here |
| Review | 👀 | No reviews pending | Completed tasks go here | - |
| Done | ✅ | No completed tasks | Finished tasks appear here | - |

---

## 5. Task Detail Page (New)

### 5.1 Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Back                    Fix authentication bug    [Move to Next]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Metadata Bar:                                                      │
│  📁 Schedule Tracker  │  🔴 HIGH  │  📅 Due: Feb 15, 2026            │
│  👤 Assigned: John D.  │  ⏱️ 4h estimate  │  ✅ Completed by: Jane   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   DOCUMENTATION                             │   │
│  │  [Editor Content]                                           │   │
│  │                                                             │   │
│  │  ## Problem Description                                     │   │
│  │  Users cannot login...                                      │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Activity & Comments:                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  👩 Jane Smith  2 hours ago                                  │   │
│  │  Added reproduction steps                                   │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  👨 John Doe  1 hour ago                                     │   │
│  │  I'll investigate this issue                                │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  💬 Add a comment...                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 URL Structure

```
/projects/{projectId}/board/{taskId}
```

---

## 6. Folder Structure (New)

```
schedule-tracker/
├── app/
│   ├── projects/
│   │   └── [id]/
│   │       ├── page.tsx                  # Project dashboard
│   │       ├── board/
│   │       │   ├── page.tsx              # Kanban board
│   │       │   └── [taskId]/
│   │       │       └── page.tsx          # Task detail (NEW)
│   │       └── tasks/
│   │           └── [taskId]/
│   │               └── page.tsx          # Alternative routing
│   ├── dashboard/
│   │   └── page.tsx                      # Dashboard with alerts
│   └── layout.tsx
│
├── components/
│   ├── editor/                           # NEW - Block editor
│   │   ├── BlockEditor.tsx
│   │   ├── extensions/
│   │   │   ├── CustomImage.tsx
│   │   │   └── CustomTodo.tsx
│   │   ├── SlashMenu.tsx
│   │   └── FloatingMenu.tsx
│   │
│   ├── kanban/                           # Reorganized
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx              # NEW
│   │   ├── KanbanTask.tsx                # Redesigned
│   │   └── KanbanHeader.tsx              # NEW
│   │
│   ├── task/                             # NEW
│   │   ├── TaskDetailHeader.tsx
│   │   ├── TaskMetadata.tsx
│   │   ├── TaskProgress.tsx
│   │   └── TaskComments.tsx
│   │
│   ├── notifications/                    # NEW
│   │   ├── ToastProvider.tsx
│   │   ├── DeadlineAlertBar.tsx
│   │   └── Toast.tsx
│   │
│   ├── ui/                               # Existing shadcn
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   └── ...
│   │
│   └── AppShell.tsx
│
├── lib/
│   ├── editor-utils.ts                   # NEW - Editor helpers
│   ├── deadline-utils.ts                 # NEW - Deadline calculations
│   └── utils.ts
│
├── prisma/
│   └── schema.prisma                     # Update for documentation
│
└── public/
    └── uploads/                          # NEW - Image storage
```

---

## 7. Database Schema Updates

### 7.1 New Fields for Task Model

```prisma
model Task {
  id          String    @id @default(cuid())
  title       String
  description String?   @db.Text

  // NEW - Rich text documentation
  documentation  Json?    // Store blocks as JSON

  // Existing
  priority    String    @default("MEDIUM")
  statusId    String
  dueDate     DateTime?
  estimatedHours Float?

  // NEW - Progress tracking
  progress    Int       @default(0)  // 0-100

  // NEW - Deadline alerts
  lastAlertSent DateTime?

  // Existing
  assigneeId  String?
  projectId   String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  status      Status    @relation(fields: [statusId], references: [id])
  project     Project   @relation(fields: [projectId], references: [id])
  assignee    User?     @relation(fields: [assigneeId], references: [id])

  // NEW - Attachments
  attachments Attachment[]
}

// NEW - Attachments model
model Attachment {
  id        String   @id @default(cuid())
  taskId    String
  fileName  String
  fileUrl   String
  fileType  String   // image, document
  fileSize  Int
  createdAt DateTime @default(now())

  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

// NEW - Comments model
model Comment {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])
}
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Update color system and global styles
- [ ] Install dependencies (novel, @hello-pangea/dnd updates)
- [ ] Update Prisma schema with new fields
- [ ] Run migrations
- [ ] Create base folder structure

### Phase 2: Kanban Redesign (Week 1-2)
- [ ] Redesign KanbanColumn component
- [ ] Redesign KanbanTask component (readability focus)
- [ ] Add status flow indicators
- [ ] Implement "Move to Next" quick action
- [ ] Enhanced empty states
- [ ] Update drag-and-drop animations

### Phase 3: Notifications (Week 2)
- [ ] Create ToastProvider context
- [ ] Implement Toast component
- [ ] Create DeadlineAlertBar component
- [ ] Add deadline calculation utilities
- [ ] Dashboard integration

### Phase 4: Task Detail & Editor (Week 2-3)
- [ ] Setup Novel/Tiptap editor
- [ ] Configure slash commands
- [ ] Implement image upload
- [ ] Create TaskDetail page
- [ ] Create task-related components (metadata, comments)
- [ ] Add comment functionality

### Phase 5: Polish & Testing (Week 3-4)
- [ ] Add keyboard shortcuts
- [ ] Implement animations
- [ ] Mobile responsiveness
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Testing (unit, integration)

### Phase 6: Deployment (Week 4)
- [ ] Environment configuration
- [ ] Image storage setup
- [ ] Production build
- [ ] Deploy to Vercel
- [ ] Monitoring setup

---

## 9. Success Criteria

### Visual
- [ ] Consistent Professional Corporate style throughout
- [ ] Clear visual hierarchy with proper spacing
- [ ] Accessible color contrast (WCAG AA minimum)
- [ ] Smooth animations (60fps)

### Functionality
- [ ] Block editor with all specified features working
- [ ] Image upload functional
- [ ] Deadline alerts triggering correctly
- [ ] Progress tracking accurate
- [ ] Comments/Activity feed functional

### User Experience
- [ ] Clear workflow indication at all times
- [ ] < 3 clicks to complete any common action
- [ ] Feedback provided for all actions
- [ ] No page feels "empty" or "broken"
- [ ] Mobile-usable

### Performance
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Smooth drag-and-drop (no lag)
- [ ] Editor typing responsive

---

## 10. Dependencies

```json
{
  "dependencies": {
    "novel": "^0.5.0",
    "@tiptap/react": "^2.5.0",
    "@tiptap/starter-kit": "^2.5.0",
    "@tiptap/extension-image": "^2.5.0",
    "@tiptap/extension-placeholder": "^2.5.0",
    "@tiptap/extension-task-list": "^2.5.0",
    "@tiptap/extension-task-item": "^2.5.0",
    "@radix-ui/react-toast": "^1.2.0",
    "date-fns": "^4.1.0",
    "framer-motion": "^11.0.0"
  }
}
```

---

## 11. References & Inspiration

- **Jira:** Color scheme, status workflow
- **Notion:** Block editor design, slash commands
- **Linear:** Minimal aesthetic, smooth animations
- **Asana:** Task card layout, progress indicators

---

**Document Status:** ✅ Complete - Ready for Implementation
