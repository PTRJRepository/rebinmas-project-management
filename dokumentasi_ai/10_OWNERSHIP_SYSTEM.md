# Ownership System Documentation

## Overview

The Ownership System implements Project-Based Access Control (PBAC) where users can only see and interact with projects they own or are assigned to as members.

## Architecture

### Role Hierarchy

| Role | Level | Permissions |
|------|-------|-------------|
| OWNER | 3 | Full control: edit, delete, manage members, transfer ownership |
| PM | 2 | Create/edit tasks, view reports, manage task assignments |
| MEMBER | 1 | View project, create/edit own tasks, comment |
| ADMIN | - | System-wide access to all projects (override) |

### Database Schema

#### pm_project_members Table

```sql
CREATE TABLE pm_project_members (
    id NVARCHAR(255) PRIMARY KEY,
    project_id NVARCHAR(255) NOT NULL,
    user_id NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) DEFAULT 'MEMBER',
    joined_at DATETIME DEFAULT GETDATE(),
    added_by NVARCHAR(255),
    FOREIGN KEY (project_id) REFERENCES pm_projects(id),
    FOREIGN KEY (user_id) REFERENCES pm_users(id),
    UNIQUE (project_id, user_id)
);
```

### API Layer

#### Access Control Functions (`lib/api/project-members.ts`)

- **`checkProjectAccess(projectId, userId, requiredRole?)`**
  - Returns `{ hasAccess: boolean, role?: string }`
  - Checks if user has access to a project
  - Optional `requiredRole` parameter for role-based checks

- **`getAccessibleProjects(userId, userRole)`**
  - Returns list of projects user can access
  - ADMIN users get all projects
  - Regular users get owned + member projects

- **`canPerformAction(action, projectId, userId)`**
  - Actions: `edit_project`, `delete_project`, `manage_members`
  - Returns boolean

- **`addProjectMember(data)`**
  - Adds a user to a project with specified role
  - Prevents duplicate memberships

- **`removeProjectMember(projectId, userId)`**
  - Removes a member from a project
  - Cannot remove the owner

- **`updateMemberRole(projectId, userId, newRole)`**
  - Updates a member's role
  - Cannot change owner's role

- **`transferOwnership(projectId, newOwnerId, currentOwnerId)`**
  - Transfers project ownership
  - Demotes current owner to PM role

### Server Actions (`app/actions/project.ts`)

All project actions now include access control:

- **`getProjects()`** - Returns only accessible projects
- **`getProject(projectId)`** - Checks access before returning
- **`updateProjectAction()`** - OWNER/ADMIN only
- **`deleteProject()`** - OWNER/ADMIN only
- **`getProjectMembersAction()`** - Requires project access
- **`addProjectMemberAction()`** - OWNER/ADMIN only
- **`removeProjectMemberAction()`** - OWNER/ADMIN only
- **`updateMemberRoleAction()`** - OWNER/ADMIN only
- **`transferOwnershipAction()`** - OWNER/ADMIN only

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/members` | Get project members |
| POST | `/api/projects/[id]/members` | Add member to project |
| DELETE | `/api/projects/[id]/members/[userId]` | Remove member |
| PATCH | `/api/projects/[id]/members/[userId]` | Update member role |

### UI Components

#### ProjectMembersDialog

Located at `components/project/ProjectMembersDialog.tsx`

Features:
- View all project members with roles
- Add new members (OWNER/ADMIN only)
- Remove members (OWNER/ADMIN only)
- Role badges with icons

Usage:
```tsx
import { ProjectMembersDialog } from '@/components/project/ProjectMembersDialog'

<ProjectMembersDialog
  projectId="project-id"
  projectName="My Project"
  currentUserId="user-id"
  currentUserRole="OWNER"
/>
```

### Access Denied Page

Located at `app/forbidden/page.tsx`

Users are redirected here when they attempt to access a project they don't have permission for.

## Migration Guide

### Step 1: Run Database Migration

Execute the SQL migration script:

```bash
# Run the migration on SQL Server
sqlcmd -S your-server -d extend_db_ptrj -i prisma/migrations/20260217_add_project_ownership.sql
```

Or run via the sync API:

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"action": "migrate-ownership"}'
```

### Step 2: Verify Migration

Check that:
1. `pm_project_members` table exists
2. Existing project owners are added as OWNER members
3. `created_by` column exists in `pm_projects`

### Step 3: Test Access Control

1. Login as different users
2. Verify each user only sees their own projects
3. Test adding members to a project
4. Test access denied scenarios

## Security Considerations

1. **Server-Side Validation**: All access control is enforced server-side
2. **API Protection**: All API endpoints check permissions
3. **SQL Injection Prevention**: Parameterized queries used throughout
4. **Session Validation**: User session verified on every request

## Troubleshooting

### User can't see their project

1. Check if user is in `pm_project_members` table
2. Verify `project_id` and `user_id` match
3. Check if user is the owner (`owner_id` in `pm_projects`)

### Member can't access project

1. Verify member record exists in `pm_project_members`
2. Check member's role is not NULL
3. Ensure project exists and is not deleted

### ADMIN still sees all projects

This is expected behavior. ADMIN role has system-wide access override.

## Future Enhancements

1. **Bulk Member Import**: Add multiple members at once
2. **Team Support**: Group users into teams for easier management
3. **Permission Templates**: Predefined permission sets
4. **Audit Log**: Track all permission changes
5. **Invitation System**: Email invitations for new members
