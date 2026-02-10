# Schedule Tracker 2.0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete redesign of Schedule Tracker application with Professional Corporate UI, block-based editor (Notion-style), deadline monitoring, and improved workflow clarity.

**Architecture:** Next.js 16 with App Router, Prisma ORM, React 19, Tailwind CSS 4. Component architecture using shadcn/ui patterns with custom components. Block editor using Novel (Tiptap wrapper). State management via React hooks and Server Actions.

**Tech Stack:** Next.js 16, React 19, TypeScript, Prisma, Tailwind CSS 4, Novel (Tiptap), @hello-pangea/dnd, Radix UI, date-fns

---

## Phase 1: Foundation & Dependencies

### Task 1.1: Install Required Dependencies

**Files:**
- Modify: `schedule-tracker/package.json`

**Step 1: Install Novel editor and Tiptap dependencies**

```bash
cd schedule-tracker
npm install novel @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-placeholder @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/extension-typography @tiptap/extension-link
```

**Step 2: Install additional UI and utility dependencies**

```bash
npm install @radix-ui/react-toast framer-motion @tiptap/pm @tiptap/extension-underline @tiptap/extension-text-align @tiptap/extension-color
```

**Step 3: Verify installations**

Run: `npm list novel @tiptap/react @radix-ui/react-toast framer-motion`
Expected: All packages listed with versions

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install novel editor and additional dependencies for 2.0 redesign"
```

---

### Task 1.2: Update Prisma Schema for New Features

**Files:**
- Modify: `schedule-tracker/prisma/schema.prisma`

**Step 1: Add new fields to Task model**

Open `prisma/schema.prisma` and update the Task model:

```prisma
model Task {
  id          String    @id @default(cuid())
  title       String
  description String?   @db.Text

  // NEW - Rich text documentation
  documentation  Json?    // Store blocks as JSON from Novel editor

  // Existing fields
  priority    String    @default("MEDIUM")
  statusId    String
  dueDate     DateTime?
  estimatedHours Float?

  // NEW - Progress tracking
  progress    Int       @default(0)  // 0-100 percentage

  // NEW - Deadline alerts tracking
  lastAlertSent DateTime?

  // Existing
  assigneeId  String?
  projectId   String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  status      Status    @relation(fields: [statusId], references: [id])
  project     Project   @relation(fields: [projectId], references: [id])
  assignee    User?     @relation(fields: [assigneeId], references: [id])

  // NEW relations
  attachments Attachment[]
  comments    Comment[]
}

// NEW - Attachments model
model Attachment {
  id        String   @id @default(cuid())
  taskId    String
  fileName  String
  fileUrl   String
  fileType  String   // 'image', 'document'
  fileSize  Int      // Size in bytes
  createdAt DateTime @default(now())

  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
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

  @@index([taskId])
  @@index([userId])
}
```

**Step 2: Add comments relation to User model**

Find the User model and add:

```prisma
model User {
  id            String    @id @default(cuid())
  username      String    @unique
  // ... existing fields

  // Add this line:
  comments      Comment[]
}
```

**Step 3: Generate Prisma client**

```bash
npx prisma generate
```

**Step 4: Create migration**

```bash
npx prisma migrate dev --name add_documentation_attachments_comments
```

**Step 5: Verify migration**

Run: `npx prisma migrate status`
Expected: Shows latest migration applied

**Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add documentation, attachments, and comments to task model"
```

---

### Task 1.3: Create Global Styles & Color System

**Files:**
- Modify: `schedule-tracker/app/globals.css`

**Step 1: Update globals.css with Professional Corporate color system**

Replace the content of `app/globals.css` with:

```css
@import "tailwindcss";

/* ============================================
   Schedule Tracker 2.0 - Color System
   Professional Corporate Theme (Jira/Asana-like)
   ============================================ */

:root {
  /* Primary Colors - Professional Blue Theme */
  --color-primary: 0 82 204;          /* #0052CC - Jira Blue */
  --color-primary-hover: 0 101 255;   /* #0065FF */
  --color-primary-light: 222 235 255; /* #DEEBFF */

  /* Secondary Colors */
  --color-secondary: 66 82 110;       /* #42526E - Neutral gray */
  --color-secondary-light: 223 225 230; /* #DFE1E6 */

  /* Status Colors (Flat, Professional) */
  --status-backlog: 66 82 110;        /* #42526E - Gray */
  --status-progress: 0 82 204;        /* #0052CC - Blue */
  --status-review: 101 84 192;        /* #6554C0 - Purple */
  --status-done: 54 179 126;          /* #36B37E - Green */

  /* Priority Colors */
  --priority-critical: 222 53 11;     /* #DE350B - Red */
  --priority-high: 255 153 31;        /* #FF991F - Orange */
  --priority-medium: 255 171 0;       /* #FFAB00 - Yellow */
  --priority-low: 54 179 126;         /* #36B37E - Green */

  /* Alert Colors */
  --alert-error: 222 53 11;           /* #DE350B */
  --alert-warning: 255 153 31;        /* #FF991F */
  --alert-success: 54 179 126;        /* #36B37E */
  --alert-info: 0 82 204;             /* #0052CC */

  /* Backgrounds */
  --bg-app: 244 245 247;              /* #F4F5F7 */
  --bg-surface: 255 255 255;          /* #FFFFFF */
  --bg-hover: 235 236 240;            /* #EBECF0 */
}

@theme inline {
  --color-background: var(--bg-surface);
  --color-foreground: var(--color-secondary);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

/* ============================================
   Base Styles
   ============================================ */

body {
  background: rgb(var(--bg-app));
  color: rgb(var(--color-secondary));
  font-family: var(--font-geist-sans), 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ============================================
   Typography Scale
   ============================================ */

.text-xs { font-size: 11px; }
.text-sm { font-size: 13px; }
.text-base { font-size: 15px; }
.text-md { font-size: 16px; }
.text-lg { font-size: 18px; }
.text-xl { font-size: 24px; }
.text-2xl { font-size: 32px; }

/* ============================================
   Accessibility: Focus Indicators
   ============================================ */

*:focus {
  outline: none;
}

*:focus-visible {
  outline: 2px solid rgb(var(--color-primary));
  outline-offset: 2px;
  border-radius: 4px;
}

button:focus-visible,
a:focus-visible {
  outline: 2px solid rgb(var(--color-primary));
  outline-offset: 2px;
}

input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid rgb(var(--color-primary));
  outline-offset: 0;
  border-color: rgb(var(--color-primary));
}

/* ============================================
   Skip Links
   ============================================ */

.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 9999;
  padding: 0.75rem 1.5rem;
  background: rgb(var(--color-primary));
  color: white;
  text-decoration: none;
  font-weight: 600;
  border-radius: 0 0 4px 0;
}

.skip-link:focus {
  left: 0;
}

/* ============================================
   Screen Reader Only
   ============================================ */

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* ============================================
   Custom Scrollbar
   ============================================ */

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(var(--color-secondary-light));
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--color-secondary));
}

/* ============================================
   Animations
   ============================================ */

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-up {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes scale-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.fade-in {
  animation: fade-in 0.2s ease-out;
}

.slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}

.slide-up {
  animation: slide-up 0.2s ease-out;
}

.scale-in {
  animation: scale-in 0.2s ease-out;
}

/* ============================================
   Accessibility: Reduced Motion
   ============================================ */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Step 2: Commit**

```bash
git add app/globals.css
git commit -m "style: update global styles with Professional Corporate color system"
```

---

### Task 1.4: Create Folder Structure

**Files:**
- Create: `schedule-tracker/components/editor/`
- Create: `schedule-tracker/components/kanban/`
- Create: `schedule-tracker/components/task/`
- Create: `schedule-tracker/components/notifications/`
- Create: `schedule-tracker/lib/editor-utils.ts`
- Create: `schedule-tracker/lib/deadline-utils.ts`
- Create: `schedule-tracker/public/uploads/`

**Step 1: Create all directories**

```bash
cd schedule-tracker
mkdir -p components/editor/components
mkdir -p components/kanban
mkdir -p components/task
mkdir -p components/notifications
mkdir -p lib
mkdir -p public/uploads
```

**Step 2: Create placeholder files**

```bash
touch components/editor/.gitkeep
touch components/kanban/.gitkeep
touch components/task/.gitkeep
touch components/notifications/.gitkeep
touch lib/editor-utils.ts
touch lib/deadline-utils.ts
```

**Step 3: Verify structure**

Run: `ls -la components/ lib/`
Expected: All directories created

**Step 4: Commit**

```bash
git add components/ lib/ public/uploads/
git commit -m "chore: create folder structure for 2.0 redesign"
```

---

## Phase 2: Toast Notifications System

### Task 2.1: Create Toast Component

**Files:**
- Create: `schedule-tracker/components/ui/toast.tsx`
- Create: `schedule-tracker/components/ui/use-toast.ts`
- Create: `schedule-tracker/components/ui/toaster.tsx`

**Step 1: Install required dependencies**

```bash
npm install @radix-ui/react-toast
```

**Step 2: Create toast component**

Create `components/ui/toast.tsx`:

```tsx
"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
    variant?: "default" | "destructive" | "success" | "warning" | "info"
  }
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
        variant === "destructive" &&
          "border-red-500 bg-red-50 text-red-900",
        variant === "success" &&
          "border-green-500 bg-green-50 text-green-900",
        variant === "warning" &&
          "border-orange-500 bg-orange-50 text-orange-900",
        variant === "info" &&
          "border-blue-500 bg-blue-50 text-blue-900",
        variant === "default" &&
          "border-gray-200 bg-white text-gray-900",
        className
      )}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-gray-500 opacity-0 transition-opacity hover:text-gray-900 focus:opacity-100 focus:outline-none group-hover:opacity-100",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
```

**Step 3: Create useToast hook**

Create `components/ui/use-toast.ts`:

```tsx
"use client"

import * as React from "react"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 4000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
```

**Step 4: Create toaster component**

Create `components/ui/toaster.tsx`:

```tsx
"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
```

**Step 5: Update root layout to include Toaster**

Modify `app/layout.tsx` to add the Toaster:

```tsx
import { Toaster } from "@/components/ui/toaster"

// In the body, after SkipLink:
<Toaster />
```

**Step 6: Commit**

```bash
git add components/ui/toast.tsx components/ui/use-toast.ts components/ui/toaster.tsx app/layout.tsx
git commit -m "feat: add toast notification system with variants"
```

---

## Phase 3: Deadline Alert System

### Task 3.1: Create Deadline Utilities

**Files:**
- Modify: `schedule-tracker/lib/deadline-utils.ts`

**Step 1: Write deadline utility functions**

Replace content of `lib/deadline-utils.ts` with:

```typescript
import { addDays, differenceInDays, isAfter, isBefore, isToday, isTomorrow, startOfDay } from 'date-fns'

export interface DeadlineInfo {
  isOverdue: boolean
  isDueToday: boolean
  isDueTomorrow: boolean
  daysUntilDue: number | null
  urgency: 'critical' | 'warning' | 'normal' | 'none'
}

export interface DeadlineAlert {
  overdueCount: number
  dueTodayCount: number
  dueThisWeekCount: number
  upcomingTasks: Array<{
    id: string
    title: string
    dueDate: Date
    projectId: string
    urgency: 'critical' | 'warning' | 'normal'
  }>
}

/**
 * Calculate deadline information for a single task
 */
export function getDeadlineInfo(dueDate: Date | null | undefined): DeadlineInfo {
  if (!dueDate) {
    return {
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      daysUntilDue: null,
      urgency: 'none',
    }
  }

  const today = startOfDay(new Date())
  const due = startOfDay(dueDate)
  const daysUntil = differenceInDays(due, today)

  const isOverdue = isBefore(due, today)
  const isDueToday = isToday(due)
  const isDueTomorrow = isTomorrow(due)

  let urgency: DeadlineInfo['urgency'] = 'normal'
  if (isOverdue) {
    urgency = 'critical'
  } else if (daysUntil <= 2) {
    urgency = 'warning'
  } else if (daysUntil <= 7) {
    urgency = 'normal'
  }

  return {
    isOverdue,
    isDueToday,
    isDueTomorrow,
    daysUntilDue: daysUntil,
    urgency,
  }
}

/**
 * Calculate deadline alerts for all tasks
 */
export function getDeadlineAlerts(
  tasks: Array<{ id: string; title: string; dueDate: Date | null; projectId: string }>
): DeadlineAlert {
  const today = startOfDay(new Date())
  const weekFromNow = addDays(today, 7)

  const overdueTasks: DeadlineAlert['upcomingTasks'] = []
  const dueTodayTasks: DeadlineAlert['upcomingTasks'] = []
  const dueThisWeekTasks: DeadlineAlert['upcomingTasks'] = []

  for (const task of tasks) {
    if (!task.dueDate) continue

    const info = getDeadlineInfo(task.dueDate)

    if (info.isOverdue) {
      overdueTasks.push({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        projectId: task.projectId,
        urgency: 'critical',
      })
    } else if (info.isDueToday) {
      dueTodayTasks.push({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        projectId: task.projectId,
        urgency: 'critical',
      })
    } else if (info.daysUntilDue !== null && info.daysUntilDue <= 7) {
      dueThisWeekTasks.push({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        projectId: task.projectId,
        urgency: info.urgency,
      })
    }
  }

  return {
    overdueCount: overdueTasks.length + dueTodayTasks.length,
    dueTodayCount: dueTodayTasks.length,
    dueThisWeekCount: dueThisWeekTasks.length,
    upcomingTasks: [...overdueTasks, ...dueTodayTasks, ...dueThisWeekTasks],
  }
}

/**
 * Get CSS classes for deadline display
 */
export function getDeadlineClasses(info: DeadlineInfo): string {
  if (info.isOverdue) {
    return 'bg-red-50 text-red-700 border-red-200'
  }
  if (info.isDueToday) {
    return 'bg-orange-50 text-orange-700 border-orange-200'
  }
  if (info.isDueTomorrow || (info.daysUntilDue !== null && info.daysUntilDue <= 3)) {
    return 'bg-yellow-50 text-yellow-700 border-yellow-200'
  }
  return 'bg-gray-50 text-gray-600 border-gray-200'
}

/**
 * Format deadline date for display
 */
export function formatDeadline(dueDate: Date | null | undefined): string | null {
  if (!dueDate) return null

  const info = getDeadlineInfo(dueDate)

  if (info.isOverdue) {
    const daysOverdue = Math.abs(differenceInDays(startOfDay(new Date()), startOfDay(dueDate)))
    return `Overdue by ${daysOverdue}d`
  }
  if (info.isDueToday) return 'Today'
  if (info.isDueTomorrow) return 'Tomorrow'
  if (info.daysUntilDue !== null && info.daysUntilDue <= 7) {
    return `In ${info.daysUntilDue}d`
  }

  return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Check if alert should be sent (avoid spamming)
 */
export function shouldSendAlert(
  lastAlertSent: Date | null,
  urgency: 'critical' | 'warning' | 'normal'
): boolean {
  if (!lastAlertSent) return true

  const now = new Date()
  const hoursSinceLastAlert = (now.getTime() - lastAlertSent.getTime()) / (1000 * 60 * 60)

  // Critical: alert every 4 hours
  // Warning: alert every 12 hours
  // Normal: alert every 24 hours
  const threshold = urgency === 'critical' ? 4 : urgency === 'warning' ? 12 : 24

  return hoursSinceLastAlert >= threshold
}
```

**Step 2: Commit**

```bash
git add lib/deadline-utils.ts
git commit -m "feat: add deadline utility functions for alerts and calculations"
```

---

### Task 3.2: Create DeadlineAlertBar Component

**Files:**
- Create: `schedule-tracker/components/notifications/DeadlineAlertBar.tsx`

**Step 1: Create DeadlineAlertBar component**

Create `components/notifications/DeadlineAlertBar.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Clock, X, AlertTriangle } from 'lucide-react'
import { getDeadlineAlerts, formatDeadline } from '@/lib/deadline-utils'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  dueDate: Date | null
  projectId: string
}

interface DeadlineAlertBarProps {
  tasks: Task[]
  onFilterTasks?: (taskIds: string[]) => void
}

export function DeadlineAlertBar({ tasks, onFilterTasks }: DeadlineAlertBarProps) {
  const [alerts, setAlerts] = useState(getDeadlineAlerts(tasks))
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setAlerts(getDeadlineAlerts(tasks))
  }, [tasks])

  // Hide if no alerts or dismissed
  if (alerts.overdueCount === 0 || dismissed) {
    return null
  }

  const hasOverdue = alerts.overdueCount > 0
  const hasUpcoming = alerts.dueThisWeekCount > 0

  const handleFilterClick = () => {
    const urgentTaskIds = alerts.upcomingTasks.map(t => t.id)
    onFilterTasks?.(urgentTaskIds)
  }

  return (
    <div
      className={cn(
        "sticky top-0 z-40 w-full border-b shadow-sm slide-down",
        hasOverdue ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-orange-400 to-yellow-400"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="bg-white/20 p-2 rounded-lg">
              {hasOverdue ? (
                <AlertCircle className="h-5 w-5 text-white" />
              ) : (
                <Clock className="h-5 w-5 text-white" />
              )}
            </div>

            {/* Alert Messages */}
            <div className="flex items-center gap-4 text-white">
              {hasOverdue && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{alerts.overdueCount}</span>
                  <span className="text-sm">
                    {alerts.dueTodayCount > 0 ? 'task' : 'task'}{alerts.overdueCount !== 1 ? 's' : ''} overdue today
                  </span>
                </div>
              )}

              {hasOverdue && hasUpcoming && (
                <div className="w-px h-4 bg-white/30" />
              )}

              {hasUpcoming && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{alerts.dueThisWeekCount}</span>
                  <span className="text-sm">
                    due in next 7 days
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleFilterClick}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
            >
              View Tasks
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 hover:bg-white/20 text-white rounded-lg transition-colors"
              aria-label="Dismiss alerts"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/notifications/DeadlineAlertBar.tsx
git commit -m "feat: add DeadlineAlertBar component with filter functionality"
```

---

## Phase 4: Kanban Board Redesign

### Task 4.1: Create KanbanColumn Component

**Files:**
- Create: `schedule-tracker/components/kanban/KanbanColumn.tsx`
- Create: `schedule-tracker/components/kanban/KanbanHeader.tsx`

**Step 1: Create KanbanHeader component**

Create `components/kanban/KanbanHeader.tsx`:

```tsx
'use client'

import { cn } from '@/lib/utils'

interface KanbanHeaderProps {
  name: string
  count: number
  statusColor: string
}

export function KanbanHeader({ name, count, statusColor }: KanbanHeaderProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        {/* Column name with status indicator */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-1 h-5 rounded-full",
              statusColor === 'backlog' && 'bg-gray-600',
              statusColor === 'progress' && 'bg-blue-600',
              statusColor === 'review' && 'bg-purple-600',
              statusColor === 'done' && 'bg-green-600'
            )}
          />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {name}
          </h3>
        </div>

        {/* Task count badge */}
        <div
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-semibold",
            statusColor === 'backlog' && 'bg-gray-100 text-gray-700',
            statusColor === 'progress' && 'bg-blue-100 text-blue-700',
            statusColor === 'review' && 'bg-purple-100 text-purple-700',
            statusColor === 'done' && 'bg-green-100 text-green-700'
          )}
        >
          {count}
        </div>
      </div>

      {/* Top border accent */}
      <div
        className={cn(
          "h-0.5 rounded-full",
          statusColor === 'backlog' && 'bg-gray-400',
          statusColor === 'progress' && 'bg-blue-500',
          statusColor === 'review' && 'bg-purple-500',
          statusColor === 'done' && 'bg-green-500'
        )}
      />
    </div>
  )
}
```

**Step 2: Create KanbanColumn component**

Create `components/kanban/KanbanColumn.tsx`:

```tsx
'use client'

import { Droppable, DroppableProvided, DroppableStateSnapshot } from '@hello-pangea/dnd'
import { cn } from '@/lib/utils'
import { KanbanHeader } from './KanbanHeader'
import { Circle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface KanbanColumnProps {
  status: {
    id: string
    name: string
  }
  tasks: Array<{
    id: string
    title: string
    description?: string | null
    priority: string
    dueDate?: Date | null
    estimatedHours?: number | null
    assignee?: {
      id: string
      username: string
      avatarUrl?: string | null
    } | null
  }>
  index: number
  totalColumns: number
  onAddTask?: (statusId: string) => void
  children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactNode
}

function getStatusColor(statusName: string): 'backlog' | 'progress' | 'review' | 'done' {
  const name = statusName.toLowerCase()
  if (name.includes('backlog') || name.includes('todo')) return 'backlog'
  if (name.includes('progress') || name.includes('doing')) return 'progress'
  if (name.includes('review') || name.includes('test')) return 'review'
  if (name.includes('done') || name.includes('complete')) return 'done'
  return 'backlog'
}

export function KanbanColumn({
  status,
  tasks,
  index,
  totalColumns,
  onAddTask,
  children
}: KanbanColumnProps) {
  const statusColor = getStatusColor(status.name)
  const isEmpty = tasks.length === 0

  return (
    <div className="flex-shrink-0 w-80 flex flex-col">
      {/* Column Header */}
      <KanbanHeader
        name={status.name}
        count={tasks.length}
        statusColor={statusColor}
      />

      {/* Droppable Area */}
      <Droppable droppableId={status.id}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={cn(
              "flex-1 rounded-xl p-3 min-h-[500px] transition-colors duration-200",
              snapshot.isDraggingOver
                ? "bg-blue-50/50 ring-2 ring-blue-300 ring-inset"
                : "bg-gray-50/50",
              isEmpty && !snapshot.isDraggingOver && "border-2 border-dashed border-gray-200"
            )}
          >
            {children(provided, snapshot)}

            {provided.placeholder}

            {/* Empty State */}
            {isEmpty && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <div
                  className={cn(
                    "p-3 rounded-full mb-3",
                    statusColor === 'backlog' && 'bg-gray-100',
                    statusColor === 'progress' && 'bg-blue-50',
                    statusColor === 'review' && 'bg-purple-50',
                    statusColor === 'done' && 'bg-green-50'
                  )}
                >
                  <Circle className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-gray-500">No tasks yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  {statusColor === 'backlog' && 'Tasks start here'}
                  {statusColor === 'progress' && 'Move from Backlog'}
                  {statusColor === 'review' && 'Completed tasks go here'}
                  {statusColor === 'done' && 'Finished tasks appear here'}
                </p>
              </div>
            )}

            {/* Quick Add Button */}
            {onAddTask && (
              <Button
                variant="ghost"
                className="w-full mt-2 text-gray-500 hover:text-gray-900 justify-start hover:bg-gray-200/50"
                onClick={() => onAddTask(status.id)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add components/kanban/KanbanHeader.tsx components/kanban/KanbanColumn.tsx
git commit -m "feat: add KanbanColumn and KanbanHeader components with professional styling"
```

---

### Task 4.2: Redesign KanbanTask Component

**Files:**
- Modify: `schedule-tracker/components/KanbanTask.tsx`

**Step 1: Replace KanbanTask with new design**

Replace entire content of `components/KanbanTask.tsx` with:

```tsx
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, AlertCircle, ArrowUp, ArrowDown, Minus, ArrowRight, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { updateTask } from '@/app/actions/task'
import { getDeadlineInfo, getDeadlineClasses, formatDeadline } from '@/lib/deadline-utils'
import { toast } from '@/components/ui/use-toast'

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  statusId: string
  status?: {
    id: string
    name: string
  }
  dueDate?: Date | null
  estimatedHours?: number | null
  progress?: number | null
  assignee?: {
    id: string
    username: string
    avatarUrl?: string | null
  } | null
}

interface KanbanTaskProps {
  task: Task
  index: number
  projectId: string
  statuses: Array<{ id: string; name: string }>
  onMoveToNext?: (taskId: string, currentStatusId: string) => void
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'CRITICAL':
    case 'HIGH':
      return <ArrowUp className="w-3 h-3 mr-1" />
    case 'MEDIUM':
      return <Minus className="w-3 h-3 mr-1" />
    case 'LOW':
      return <ArrowDown className="w-3 h-3 mr-1" />
    default:
      return null
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'CRITICAL':
      return 'border-l-red-500'
    case 'HIGH':
      return 'border-l-orange-500'
    case 'MEDIUM':
      return 'border-l-yellow-500'
    case 'LOW':
      return 'border-l-green-500'
    default:
      return 'border-l-gray-400'
  }
}

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'HIGH':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'LOW':
      return 'bg-green-100 text-green-700 border-green-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function getNextStatus(currentStatusId: string, statuses: Array<{ id: string; name: string }>): string | null {
  const currentIndex = statuses.findIndex(s => s.id === currentStatusId)
  if (currentIndex === -1 || currentIndex === statuses.length - 1) return null
  return statuses[currentIndex + 1].id
}

export function KanbanTask({ task, index, projectId, statuses, onMoveToNext }: KanbanTaskProps) {
  const deadlineInfo = getDeadlineInfo(task.dueDate)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const nextStatusId = getNextStatus(task.statusId, statuses)
  const nextStatusName = nextStatusId ? statuses.find(s => s.id === nextStatusId)?.name : null

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (!title.trim() || title === task.title) {
      setIsEditing(false)
      setTitle(task.title)
      return
    }

    setIsEditing(false)
    const result = await updateTask(task.id, { title }, projectId)

    if (result.success) {
      toast({
        title: "Task updated",
        description: "Title has been saved",
        variant: "default",
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setTitle(task.title)
    }
  }

  const handleMoveToNext = async () => {
    if (!nextStatusId || !onMoveToNext) return

    onMoveToNext(task.id, nextStatusId)

    toast({
      title: "Task moved",
      description: `Moved to ${nextStatusName}`,
      variant: "success",
    })
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn("mb-3", snapshot.isDragging && "z-50")}
          style={{
            ...provided.draggableProps.style,
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform} rotate(2deg) scale(1.02)`
              : provided.draggableProps.style?.transform,
            transition: snapshot.isDragging ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Card
            className={cn(
              "border-l-4 transition-all duration-200 bg-white",
              snapshot.isDragging
                ? "shadow-2xl ring-2 ring-blue-500/20"
                : "shadow-sm hover:shadow-md",
              getPriorityColor(task.priority),
              deadlineInfo.isOverdue && "bg-red-50/30"
            )}
          >
            <div className="p-4 space-y-3">
              {/* Header: Priority & Title */}
              <div className="flex items-start justify-between gap-2">
                {/* Priority Badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={cn("text-[10px] px-1.5 py-0.5 border font-medium", getPriorityBadgeColor(task.priority))}>
                    <span className="flex items-center">
                      {getPriorityIcon(task.priority)}
                      {task.priority}
                    </span>
                  </Badge>
                </div>

                {/* Assignee Avatar */}
                {task.assignee && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-6 w-6 border-2 border-white shadow-sm flex-shrink-0">
                          <AvatarImage src={task.assignee.avatarUrl || undefined} />
                          <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-600 font-medium">
                            {task.assignee.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        <p>Assigned to {task.assignee.username}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Title */}
              {isEditing ? (
                <Input
                  ref={inputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  className="h-8 text-sm px-2 py-1 border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              ) : (
                <h4
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsEditing(true)
                  }}
                  className="font-semibold text-sm text-gray-900 leading-snug line-clamp-2 cursor-text hover:text-blue-600 transition-colors"
                  title="Click to edit"
                >
                  {task.title}
                </h4>
              )}

              {/* Description Preview */}
              {task.description && (
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              )}

              {/* Progress Bar */}
              {task.progress !== undefined && task.progress !== null && task.progress > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>Progress</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Footer: Metadata */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {/* Due Date */}
                  {task.dueDate && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors",
                            getDeadlineClasses(deadlineInfo)
                          )}>
                            <Calendar className="w-3 h-3" />
                            <span className="font-medium">
                              {formatDeadline(task.dueDate)}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          {deadlineInfo.isOverdue && "This task is overdue!"}
                          {deadlineInfo.isDueToday && "Due today"}
                          {deadlineInfo.isDueTomorrow && "Due tomorrow"}
                          {!deadlineInfo.isOverdue && !deadlineInfo.isDueToday && !deadlineInfo.isDueTomorrow && `Due ${task.dueDate.toLocaleDateString()}`}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Estimate */}
                  {task.estimatedHours && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                            <Clock className="w-3 h-3" />
                            <span>{task.estimatedHours}h</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          Estimated: {task.estimatedHours} hours
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                {/* Overdue Badge */}
                {deadlineInfo.isOverdue && (
                  <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0">
                    OVERDUE
                  </Badge>
                )}
              </div>

              {/* Move to Next Button */}
              {nextStatusId && onMoveToNext && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveToNext()
                        }}
                        className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                      >
                        <span>Move to {nextStatusName}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      Press Enter or click to move to {nextStatusName}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </Card>
        </div>
      )}
    </Draggable>
  )
}
```

**Step 2: Commit**

```bash
git add components/KanbanTask.tsx
git commit -m "feat: redesign KanbanTask with improved readability, progress bar, and move to next action"
```

---

### Task 4.3: Update KanbanBoard Component

**Files:**
- Modify: `schedule-tracker/components/KanbanBoard.tsx`

**Step 1: Update KanbanBoard to use new components**

Replace entire content of `components/KanbanBoard.tsx` with:

```tsx
'use client'

import { useState } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { updateTaskStatus } from '@/app/actions/task'
import { createTask } from '@/app/actions/task'
import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import { KanbanTask } from '@/components/KanbanTask'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  statusId: string
  dueDate?: Date | null
  estimatedHours?: number | null
  progress?: number | null
  assignee?: {
    id: string
    username: string
    avatarUrl?: string | null
  } | null
}

interface Status {
  id: string
  name: string
}

interface KanbanBoardProps {
  initialTasks: Task[]
  statuses: Status[]
  projectId: string
}

export default function KanbanBoard({ initialTasks, statuses, projectId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [addingToStatusId, setAddingToStatusId] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [filteredTaskIds, setFilteredTaskIds] = useState<string[] | null>(null)

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatusId = destination.droppableId
    const sourceStatusName = statuses.find(s => s.id === source.droppableId)?.name
    const destStatusName = statuses.find(s => s.id === newStatusId)?.name

    // Optimistic update
    const updatedTasks = tasks.map(task =>
      task.id === draggableId ? { ...task, statusId: newStatusId } : task
    )
    setTasks(updatedTasks)

    // Show success toast
    toast({
      title: "Task moved",
      description: `Moved from ${sourceStatusName} to ${destStatusName}`,
      variant: "default",
    })

    // Server update
    await updateTaskStatus(draggableId, newStatusId, projectId)
  }

  const handleCreateTask = async (statusId: string) => {
    if (!newTaskTitle.trim()) return

    setIsCreating(true)
    const formData = new FormData()
    formData.append('title', newTaskTitle)
    formData.append('projectId', projectId)
    formData.append('statusId', statusId)
    formData.append('priority', 'MEDIUM')

    const result = await createTask(formData)

    if (result.success && result.data) {
      setTasks([result.data as Task, ...tasks])
      setNewTaskTitle('')
      setAddingToStatusId(null)

      toast({
        title: "Task created",
        description: "New task has been added to the board",
        variant: "success",
      })
    }
    setIsCreating(false)
  }

  const handleMoveToNext = async (taskId: string, currentStatusId: string) => {
    const nextStatusIndex = statuses.findIndex(s => s.id === currentStatusId) + 1
    if (nextStatusIndex >= statuses.length) return

    const nextStatusId = statuses[nextStatusIndex].id

    // Optimistic update
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, statusId: nextStatusId } : task
    )
    setTasks(updatedTasks)

    // Server update
    await updateTaskStatus(taskId, nextStatusId, projectId)
  }

  const cancelAdd = () => {
    setAddingToStatusId(null)
    setNewTaskTitle('')
  }

  const getTasksByStatus = (statusId: string) => {
    let statusTasks = tasks.filter(task => task.statusId === statusId)

    // Apply filter if active
    if (filteredTaskIds) {
      statusTasks = statusTasks.filter(task => filteredTaskIds.includes(task.id))
    }

    return statusTasks
  }

  const handleFilterTasks = (taskIds: string[]) => {
    setFilteredTaskIds(taskIds)
  }

  const clearFilter = () => {
    setFilteredTaskIds(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter indicator */}
      {filteredTaskIds && (
        <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <p className="text-sm text-blue-700">
            Showing {filteredTaskIds.length} tasks with upcoming deadlines
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilter}
            className="text-blue-700 hover:text-blue-900"
          >
            Clear filter
          </Button>
        </div>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex h-full gap-6 overflow-x-auto pb-6">
          {statuses.map((status) => {
            const statusTasks = getTasksByStatus(status.id)
            const isAdding = addingToStatusId === status.id

            return (
              <KanbanColumn
                key={status.id}
                status={status}
                tasks={statusTasks}
                index={statuses.indexOf(status)}
                totalColumns={statuses.length}
                onAddTask={setAddingToStatusId}
              >
                {(provided, snapshot) => (
                  <div className="flex flex-col">
                    {statusTasks.map((task, index) => (
                      <KanbanTask
                        key={task.id}
                        task={task}
                        index={index}
                        projectId={projectId}
                        statuses={statuses}
                        onMoveToNext={handleMoveToNext}
                      />
                ))}
                    {provided.placeholder}

                    {/* Quick Add Interface */}
                    {isAdding && (
                      <div className="mt-2 p-3 bg-white rounded-lg shadow-sm border border-blue-200 scale-in">
                        <Input
                          autoFocus
                          placeholder="What needs to be done?"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateTask(status.id)
                            if (e.key === 'Escape') cancelAdd()
                          }}
                          className="mb-2"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleCreateTask(status.id)}
                            disabled={isCreating}
                          >
                            {isCreating && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelAdd}
                            disabled={isCreating}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </KanbanColumn>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/KanbanBoard.tsx
git commit -m "feat: update KanbanBoard with new components and filtering"
```

---

## Phase 5: Block Editor Implementation

### Task 5.1: Setup Novel Editor

**Files:**
- Create: `schedule-tracker/components/editor/BlockEditor.tsx`

**Step 1: Create BlockEditor component**

Create `components/editor/BlockEditor.tsx`:

```tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import { cn } from '@/lib/utils'

interface BlockEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

export function BlockEditor({
  content = '',
  onChange,
  placeholder = "Type '/' for commands...",
  editable = true,
  className
}: BlockEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3",
          "prose-headings:font-semibold prose-headings:text-gray-900",
          "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
          "prose-p:text-gray-700 prose-p:leading-relaxed",
          "prose-ul:list-disc prose-ol:list-decimal",
          "prose-li:marker:text-gray-400",
          "prose-strong:text-gray-900 prose-strong:font-semibold",
          "prose-code:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs",
          "prose-pre:bg-gray-900 prose-pre:text-gray-100",
          "prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic",
          "prose-img:rounded-lg prose-img:shadow-md",
          "prose-hr:border-gray-200",
          "[data-placeholder]:text-gray-400"
        ),
      },
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className={cn("border rounded-lg bg-white", className)}>
      <EditorContent editor={editor} />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/editor/BlockEditor.tsx
git commit -m "feat: add basic BlockEditor component with Tiptap"
```

---

### Task 5.2: Create Enhanced BlockEditor with Novel

**Files:**
- Create: `schedule-tracker/components/editor/NovelEditor.tsx`
- Create: `schedule-tracker/components/editor/EditorMenuBar.tsx`

**Step 1: Create NovelEditor component**

Create `components/editor/NovelEditor.tsx`:

```tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Typography from '@tiptap/extension-typography'
import { cn } from '@/lib/utils'
import { EditorMenuBar } from './EditorMenuBar'

interface NovelEditorProps {
  content?: string
  onChange?: (content: string, json?: any) => void
  placeholder?: string
  editable?: boolean
  className?: string
  showMenuBar?: boolean
}

export function NovelEditor({
  content = '',
  onChange,
  placeholder = "Type '/' for commands...",
  editable = true,
  className,
  showMenuBar = true
}: NovelEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose pl-2',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-start my-1',
        },
        nested: true,
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Typography,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const json = editor.getJSON()
      onChange?.(html, json)
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3",
          "prose-headings:font-semibold prose-headings:text-gray-900",
          "prose-h1:text-2xl prose-h1:font-bold prose-h1:mt-6 prose-h1:mb-4",
          "prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-5 prose-h2:mb-3",
          "prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2",
          "prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-2",
          "prose-ul:list-disc prose-ol:list-decimal prose-ul:my-2 prose-ol:my-2",
          "prose-li:marker:text-gray-400 prose-li:my-1",
          "prose-strong:text-gray-900 prose-strong:font-semibold",
          "prose-code:text-gray-900 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono",
          "prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:my-4",
          "prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:my-4",
          "prose-img:rounded-lg prose-img:shadow-md prose-img:my-4",
          "prose-hr:border-gray-200 prose-hr:my-6",
          "prose-a:text-blue-600 prose-a:underline prose-a:no-underline hover:prose-a:underline",
          "[data-placeholder]:text-gray-400 before:content-[attr(data-placeholder)] before:absolute before:pointer-events-none before:left-4 before-top-3",
          "is-editor-empty:before:content-[attr(data-placeholder)]"
        ),
      },
    },
  })

  if (!editor) {
    return (
      <div className={cn("border rounded-lg bg-gray-50", className)}>
        <div className="p-4 text-center text-gray-400">
          Loading editor...
        </div>
      </div>
    )
  }

  return (
    <div className={cn("border rounded-lg bg-white overflow-hidden", className)}>
      {showMenuBar && editable && <EditorMenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}

// Export a hook to get editor instance
export function useEditorContent() {
  return useEditor({
    extensions: [
      StarterKit,
      Placeholder,
      TaskList,
      TaskItem,
      Image,
    ],
  })
}
```

**Step 2: Create EditorMenuBar component**

Create `components/editor/EditorMenuBar.tsx`:

```tsx
'use client'

import { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  RemoveFormatting,
  Undo,
  Redo,
  Image as ImageIcon,
  Link as LinkIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface EditorMenuBarProps {
  editor: Editor | null
}

export function EditorMenuBar({ editor }: EditorMenuBarProps) {
  if (!editor) {
    return null
  }

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    children,
    tooltip
  }: {
    onClick: () => void
    active?: boolean
    disabled?: boolean
    children: React.ReactNode
    tooltip?: string
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-8 w-8 p-0",
        active && "bg-gray-200"
      )}
      title={tooltip}
    >
      {children}
    </Button>
  )

  const addImage = () => {
    const url = window.prompt('Enter image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="border-b border-gray-200 p-2 flex items-center gap-1 flex-wrap bg-gray-50">
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        tooltip="Undo"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        tooltip="Redo"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        tooltip="Bold"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        tooltip="Italic"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        tooltip="Underline"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        tooltip="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        tooltip="Code"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        tooltip="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        tooltip="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        tooltip="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        tooltip="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        tooltip="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        active={editor.isActive('taskList')}
        tooltip="Checklist"
      >
        <CheckSquare className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Other */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        tooltip="Quote"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={addImage}
        tooltip="Add Image"
      >
        <ImageIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={addLink}
        active={editor.isActive('link')}
        tooltip="Add Link"
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Clear Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        tooltip="Clear Formatting"
      >
        <RemoveFormatting className="h-4 w-4" />
      </ToolbarButton>
    </div>
  )
}
```

**Step 3: Create Separator component if not exists**

Create `components/ui/separator.tsx`:

```tsx
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-gray-200",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
```

**Step 4: Install missing dependency**

```bash
npm install @radix-ui/react-separator
```

**Step 5: Commit**

```bash
git add components/editor/NovelEditor.tsx components/editor/EditorMenuBar.tsx components/ui/separator.tsx
git commit -m "feat: add NovelEditor with menu bar and formatting options"
```

---

## Phase 6: Task Detail Page

### Task 6.1: Create Task Detail Page Structure

**Files:**
- Create: `schedule-tracker/app/projects/[id]/board/[taskId]/page.tsx`
- Create: `schedule-tracker/components/task/TaskDetailHeader.tsx`
- Create: `schedule-tracker/components/task/TaskMetadata.tsx`
- Create: `schedule-tracker/app/actions/task.ts` (if doesn't exist with getTask function)

**Step 1: Create getTask action**

Check if `app/actions/task.ts` exists and add getTask function if missing:

```typescript
// Add to app/actions/task.ts
export async function getTask(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: true,
      status: true,
      project: true,
      attachments: true,
      comments: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!task) {
    return { success: false, error: 'Task not found' }
  }

  return { success: true, data: task }
}
```

**Step 2: Create TaskDetailHeader component**

Create `components/task/TaskDetailHeader.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { ArrowLeft, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TaskDetailHeaderProps {
  projectId: string
  task: {
    id: string
    title: string
    status: {
      id: string
      name: string
    }
  }
  isEditing?: boolean
  onEdit?: () => void
}

export function TaskDetailHeader({ projectId, task, isEditing, onEdit }: TaskDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}/board`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-medium text-gray-700">{task.status.name}</span>
          </p>
        </div>
      </div>

      {!isEditing && (
        <Button onClick={onEdit} variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit Task
        </Button>
      )}
    </div>
  )
}
```

**Step 3: Create TaskMetadata component**

Create `components/task/TaskMetadata.tsx`:

```tsx
'use client'

import { Calendar, Clock, User, Briefcase, Flag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getDeadlineInfo, formatDeadline, getDeadlineClasses } from '@/lib/deadline-utils'

interface TaskMetadataProps {
  task: {
    project: {
      id: string
      name: string
    }
    priority: string
    dueDate: Date | null
    estimatedHours: number | null
    assignee: {
      id: string
      username: string
      avatarUrl?: string | null
    } | null
    progress?: number | null
  }
}

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'HIGH':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'LOW':
      return 'bg-green-100 text-green-700 border-green-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function TaskMetadata({ task }: TaskMetadataProps) {
  const deadlineInfo = getDeadlineInfo(task.dueDate)

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      {/* Project */}
      <div className="flex items-center gap-2 text-sm">
        <Briefcase className="h-4 w-4 text-gray-400" />
        <span className="text-gray-600">Project:</span>
        <span className="font-medium text-gray-900">{task.project.name}</span>
      </div>

      {/* Priority & Assignee */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Flag className="h-4 w-4 text-gray-400" />
          <Badge className={cn("text-xs", getPriorityBadgeColor(task.priority))}>
            {task.priority}
          </Badge>
        </div>

        {task.assignee && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Assigned to:</span>
            <span className="font-medium text-gray-900">{task.assignee.username}</span>
          </div>
        )}
      </div>

      {/* Due Date & Estimate */}
      <div className="flex items-center gap-4">
        {task.dueDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Due:</span>
            <div className={cn("px-2 py-0.5 rounded border text-xs font-medium", getDeadlineClasses(deadlineInfo))}>
              {formatDeadline(task.dueDate) || task.dueDate.toLocaleDateString()}
            </div>
          </div>
        )}

        {task.estimatedHours && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Estimate:</span>
            <span className="font-medium text-gray-900">{task.estimatedHours}h</span>
          </div>
        )}
      </div>

      {/* Progress */}
      {task.progress !== undefined && task.progress !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{task.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 4: Create Task detail page**

Create `app/projects/[id]/board/[taskId]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { getTask } from '@/app/actions/task'
import { TaskDetailHeader } from '@/components/task/TaskDetailHeader'
import { TaskMetadata } from '@/components/task/TaskMetadata'
import { NovelEditor } from '@/components/editor/NovelEditor'

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>
}) {
  const { id: projectId, taskId } = await params
  const { success, data: task } = await getTask(taskId)

  if (!success || !task) {
    notFound()
  }

  return (
    <div className="max-w-5xl mx-auto">
      <TaskDetailHeader
        projectId={projectId}
        task={task}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Documentation Section */}
          <div className="bg-white rounded-lg border">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Documentation</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add details, steps, and notes about this task
              </p>
            </div>
            <div className="p-6">
              <NovelEditor
                content={(task.documentation as any)?.html || task.description || ''}
                placeholder="Start writing... Type '/' for commands"
                onChange={(html, json) => {
                  // Handle save
                }}
              />
            </div>
          </div>

          {/* Activity Section */}
          <div className="bg-white rounded-lg border">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Activity & Comments</h2>
            </div>
            <div className="p-6">
              {task.comments && task.comments.length > 0 ? (
                <div className="space-y-4">
                  {task.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        {comment.user.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">
                            {comment.user.username}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <TaskMetadata task={task} />
        </div>
      </div>
    </div>
  )
}
```

**Step 5: Commit**

```bash
git add app/projects/\[id\]/board/\[taskId\]/page.tsx components/task/TaskDetailHeader.tsx components/task/TaskMetadata.tsx
git commit -m "feat: add task detail page with documentation editor and metadata"
```

---

## Phase 7: Integration & Polish

### Task 7.1: Update Dashboard with Deadline Alerts

**Files:**
- Modify: `schedule-tracker/app/dashboard/page.tsx` (if exists)
- Modify: `schedule-tracker/app/projects/[id]/board/page.tsx`

**Step 1: Update project board page to include DeadlineAlertBar**

Modify `app/projects/[id]/board/page.tsx`:

```tsx
import { getProjectTasks, getProjectStatuses } from '@/app/actions/task'
import { KanbanBoard } from '@/components/KanbanBoard'
import { DeadlineAlertBar } from '@/components/notifications/DeadlineAlertBar'

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tasksData = await getProjectTasks(id)
  const statuses = await getProjectStatuses(id)

  return (
    <div className="h-full flex flex-col">
      <DeadlineAlertBar tasks={tasksData.data || []} />
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          initialTasks={tasksData.data || []}
          statuses={statuses}
          projectId={id}
        />
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/projects/\[id\]/board/page.tsx
git commit -m "feat: add deadline alerts to project board page"
```

---

### Task 7.2: Add Slide-Down Animation

**Files:**
- Modify: `schedule-tracker/app/globals.css`

**Step 1: Add slide-down animation**

Add to `app/globals.css` in the Animations section:

```css
@keyframes slide-down {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-down {
  animation: slide-down 0.3s ease-out;
}
```

**Step 2: Commit**

```bash
git add app/globals.css
git commit -m "style: add slide-down animation for alerts"
```

---

## Phase 8: Final Polish & Testing

### Task 8.1: Add Loading States

**Files:**
- Create: `schedule-tracker/components/ui/skeleton.tsx`

**Step 1: Create Skeleton component**

Create `components/ui/skeleton.tsx`:

```tsx
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

**Step 2: Commit**

```bash
git add components/ui/skeleton.tsx
git commit -m "feat: add skeleton component for loading states"
```

---

### Task 8.2: Update Sidebar with New Style

**Files:**
- Modify: `schedule-tracker/components/Sidebar.tsx`

**Step 1: Update Sidebar with Professional Corporate colors**

Modify the Sidebar component to use the new color scheme:

Key changes:
- Update gradient to use `#0052CC` primary blue
- Update hover states to use `#EBECF0`
- Update active states to use `#DEEBFF` background

**Step 2: Commit**

```bash
git add components/Sidebar.tsx
git commit -m "style: update sidebar with Professional Corporate colors"
```

---

## Testing Checklist

### Visual Testing
- [ ] All colors match the Professional Corporate theme
- [ ] Typography hierarchy is clear and readable
- [ ] Spacing is consistent (16px padding on cards)
- [ ] Border radius is consistent (8px for cards)
- [ ] Shadows are appropriate (not too heavy)

### Functionality Testing
- [ ] Drag and drop works smoothly
- [ ] "Move to Next" buttons work correctly
- [ ] Toast notifications appear on actions
- [ ] Deadline alerts show when tasks are overdue
- [ ] Empty states display correctly
- [ ] Editor toolbar buttons work
- [ ] Editor supports markdown shortcuts
- [ ] Task detail page loads correctly

### Workflow Testing
- [ ] Status flow is clear (Backlog → Progress → Review → Done)
- [ ] Progress indicators show correct position
- [ ] Filter by deadline works
- [ ] Inline editing saves correctly

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Focus indicators are visible
- [ ] ARIA labels are present
- [ ] Color contrast meets WCAG AA
- [ ] Reduced motion is respected

### Performance Testing
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] No console errors
- [ ] Smooth animations (60fps)

---

## Deployment Checklist

### Pre-deployment
- [ ] All tests pass
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Image storage configured (Vercel Blob or local)
- [ ] Prisma generated

### Deployment
- [ ] Build production bundle: `npm run build`
- [ ] Deploy to Vercel
- [ ] Run database migrations on production
- [ ] Test all features in production

### Post-deployment
- [ ] Monitor error logs
- [ ] Check analytics
- [ ] Verify image uploads work
- [ ] Test all user flows

---

## End of Implementation Plan

**Total Estimated Tasks:** 30+
**Total Estimated Time:** 3-4 weeks
**Dependencies:** Novel, Tiptap, Radix UI, Framer Motion, date-fns

**Next Steps:**
1. Review this plan
2. Set up git worktree for isolated development
3. Begin implementation using superpowers:executing-plans
