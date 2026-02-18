# 📋 Rebinmas Schedule Tracker — Project Overview & PRD

> **Version**: 1.0  
> **Last Updated**: 2026-02-17  
> **Author**: AI-Generated Documentation

---

## 1. Executive Summary

**Rebinmas Schedule Tracker** is a modern, full-featured **Project Management Application** built for the Rebinmas division (Polda). It provides a comprehensive set of tools for managing projects, tracking tasks, and collaborating across teams — all through an elegant dark-mode UI.

The application replaces traditional spreadsheet-based tracking with a professional web-based solution that supports **Kanban boards**, **rich-text documentation**, **visual canvas planning**, and **role-based access control**.

---

## 2. Product Requirements Document (PRD)

### 2.1. Problem Statement

The Rebinmas division needs a centralized project management tool to:
- Track project progress across multiple initiatives
- Assign and monitor tasks with clear ownership
- Provide deadline awareness and priority management
- Enable team collaboration through comments and documentation
- Generate reports for executive review

### 2.2. Target Users

| Role | Description | Permissions |
|------|-------------|-------------|
| **ADMIN** | System administrator | Full access, user management |
| **PM** (Project Manager) | Division leads | Create/manage projects, assign tasks |
| **MEMBER** | Team members | View projects, update assigned tasks |

### 2.3. Core Features

#### 🏗️ Project Management
- Create, edit, and delete projects
- Set project dates (start/end), priority levels, and banner images
- Automatic categorization: **Sekarang** (current), **Rencana** (planned), **Selesai** (completed)
- Manual category override supported
- Project dashboard with sorted overview

#### 📋 Task Management
- Full CRUD operations on tasks
- Drag-and-drop **Kanban Board** with custom status columns
- Task priority levels: LOW, MEDIUM, HIGH, CRITICAL
- Due date tracking and estimated/actual hours
- Task progress tracking (0-100%)
- Task assignment to team members
- Rich-text task documentation with image support

#### 🎨 Canvas View
- **Excalidraw** integration for visual planning
- Draw flowcharts, diagrams, and freeform sketches
- Canvas data persisted per project

#### 💬 Collaboration
- Task-level commenting system
- Rich text editor (TipTap) with:
  - Text styling (bold, italic, underline, colors)
  - Image upload (drag-drop, paste, file picker)
  - Task lists / checklists
  - Link embedding
  - Text alignment and typography

#### 📊 Reporting
- Project reports with statistics
- Dashboard with overview metrics
- Deadline tracking and alerting

#### 🔐 Authentication & Security
- Email/password authentication
- Session-based auth with HTTP-only cookies
- Role-based access control (RBAC)
- Protected routes via middleware
- Password hashing with bcrypt

#### 🌙 Design
- **Dark-mode only** interface (Slate-950 palette)
- Responsive design
- Modern glassmorphism effects
- Animated transitions (Framer Motion)

### 2.4. Non-Functional Requirements

| Requirement | Specification |
|-------------|--------------|
| **Performance** | Page load < 3s, smooth drag-drop |
| **Availability** | Deployed on internal network, PM2 managed |
| **Security** | SQL injection prevention, parameterized queries, RBAC |
| **Browser Support** | Modern browsers (Chrome, Edge, Firefox) |
| **Accessibility** | Skip links, keyboard navigation |

---

## 3. Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.1.6 (App Router) |
| **Language** | TypeScript |
| **Runtime** | Bun |
| **Database** | SQL Server (via SQL Gateway API) |
| **ORM/Fallback** | Prisma (SQLite for local dev) |
| **UI Library** | Tailwind CSS 4, shadcn/ui, Radix UI |
| **Rich Editor** | TipTap v2.27 |
| **Canvas** | Excalidraw |
| **Drag & Drop** | @hello-pangea/dnd |
| **Animations** | Framer Motion |
| **Auth** | Custom session-based (bcryptjs) |

---

## 4. Project Status

| Milestone | Status |
|-----------|--------|
| Core project/task CRUD | ✅ Complete |
| Kanban board with DnD | ✅ Complete |
| Rich text editor | ✅ Complete |
| Canvas view (Excalidraw) | ✅ Complete |
| Authentication system | ✅ Complete |
| SQL Server migration | ✅ Complete |
| Production deployment guide | ✅ Complete |
| Dark mode UI | ✅ Complete |
| Reporting system | ✅ Complete |
| User management | ✅ Complete |

---

## 5. Default Credentials

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@rebinmas.polda.id | admin123 |
| PM | manager@rebinmas.polda.id | manager123 |
| MEMBER | member@rebinmas.polda.id | member123 |

> ⚠️ **Change these credentials in production!**
