/**
 * Project Members API - Ownership-based Access Control
 *
 * This module provides functions for managing project membership
 * and checking access rights based on ownership and role.
 *
 * @module lib/api/project-members
 */

import { sqlGateway } from './sql-gateway';

// ==================================================
// TYPES
// ==================================================

export type ProjectRole = 'OWNER' | 'PM' | 'MEMBER';
export type UserRole = 'ADMIN' | 'PM' | 'MEMBER';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: Date;
  addedBy: string | null;
  user?: {
    id: string;
    username: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
  };
}

export interface AccessCheckResult {
  hasAccess: boolean;
  role?: ProjectRole | 'ADMIN';
  reason?: string;
}

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<ProjectRole, number> = {
  'OWNER': 3,
  'PM': 2,
  'MEMBER': 1,
};

// ==================================================
// HELPER FUNCTIONS
// ==================================================

/**
 * Generate a unique ID for project members
 */
function generateId(prefix: string = 'pm'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}${random}`;
}

// ==================================================
// ACCESS CONTROL FUNCTIONS
// ==================================================

/**
 * Check if a user has access to a specific project
 *
 * @param projectId - The project ID to check access for
 * @param userId - The user ID to check access for
 * @param requiredRole - Optional minimum role required
 * @returns Access check result with role information
 *
 * @example
 * ```ts
 * const access = await checkProjectAccess('proj_123', 'user_456', 'PM');
 * if (!access.hasAccess) {
 *   throw new Error('Access denied');
 * }
 * ```
 */
export async function checkProjectAccess(
  projectId: string,
  userId: string,
  requiredRole?: ProjectRole
): Promise<AccessCheckResult> {
  try {
    // First check if user is ADMIN (has access to everything)
    const userResult = await sqlGateway.query<{ role: UserRole }>(
      'SELECT role FROM pm_users WHERE id = @userId',
      { userId }
    );

    if (userResult.recordset.length === 0) {
      return { hasAccess: false, reason: 'User not found' };
    }

    const userRole = userResult.recordset[0].role;
    if (userRole === 'ADMIN') {
      return { hasAccess: true, role: 'ADMIN' };
    }

    // Check project membership
    const memberResult = await sqlGateway.query<{ role: ProjectRole }>(
      `SELECT role FROM pm_project_members 
       WHERE project_id = @projectId AND user_id = @userId`,
      { projectId, userId }
    );

    if (memberResult.recordset.length === 0) {
      return { hasAccess: false, reason: 'Not a member of this project' };
    }

    const memberRole = memberResult.recordset[0].role;

    // If no specific role required, just being a member is enough
    if (!requiredRole) {
      return { hasAccess: true, role: memberRole };
    }

    // Check if user's role meets the required level
    const userLevel = ROLE_HIERARCHY[memberRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

    if (userLevel >= requiredLevel) {
      return { hasAccess: true, role: memberRole };
    }

    return {
      hasAccess: false,
      role: memberRole,
      reason: `Requires ${requiredRole} role, but user has ${memberRole} role`,
    };
  } catch (error) {
    console.error('Error checking project access:', error);
    return { hasAccess: false, reason: 'Error checking access' };
  }
}

/**
 * Get all projects accessible by a user
 *
 * @param userId - The user ID
 * @param userRole - The user's system role (for ADMIN override)
 * @returns Array of accessible projects with member role
 *
 * @example
 * ```ts
 * const projects = await getAccessibleProjects('user_123', 'PM');
 * // Returns projects where user is owner, member, or all if ADMIN
 * ```
 */
export async function getAccessibleProjects(
  userId: string,
  userRole?: UserRole
): Promise<any[]> {
  try {
    // ADMIN sees all projects
    if (userRole === 'ADMIN') {
      const result = await sqlGateway.query(
        `SELECT 
          p.id, p.name, p.description, p.start_date, p.end_date, 
          p.priority, p.banner_image, p.status, p.owner_id, 
          p.created_at, p.updated_at,
          u.id as user_id, u.username as owner_username,
          u.email as owner_email, u.name as owner_name,
          (SELECT COUNT(*) FROM pm_tasks t WHERE t.project_id = p.id) as task_count,
          'ADMIN' as member_role
        FROM pm_projects p
        LEFT JOIN pm_users u ON p.owner_id = u.id
        ORDER BY p.created_at DESC`,
        {}
      );

      return result.recordset.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        startDate: row.start_date,
        endDate: row.end_date,
        priority: row.priority,
        bannerImage: row.banner_image,
        status: row.status,
        ownerId: row.owner_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        owner: {
          id: row.user_id,
          username: row.owner_username,
          email: row.owner_email,
          name: row.owner_name,
        },
        _count: { tasks: row.task_count },
        memberRole: 'ADMIN',
      }));
    }

    // Non-ADMIN users see only projects they have access to
    const result = await sqlGateway.query(
      `SELECT DISTINCT
        p.id, p.name, p.description, p.start_date, p.end_date, 
        p.priority, p.banner_image, p.status, p.owner_id, 
        p.created_at, p.updated_at,
        u.id as user_id, u.username as owner_username,
        u.email as owner_email, u.name as owner_name,
        (SELECT COUNT(*) FROM pm_tasks t WHERE t.project_id = p.id) as task_count,
        COALESCE(pm.role, 'OWNER') as member_role
      FROM pm_projects p
      LEFT JOIN pm_users u ON p.owner_id = u.id
      LEFT JOIN pm_project_members pm ON p.id = pm.project_id AND pm.user_id = @userId
      WHERE 
        pm.user_id = @userId           -- User is a member
        OR p.owner_id = @userId        -- User is the owner
      ORDER BY p.created_at DESC`,
      { userId }
    );

    return result.recordset.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      priority: row.priority,
      bannerImage: row.banner_image,
      status: row.status,
      ownerId: row.owner_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      owner: {
        id: row.user_id,
        username: row.owner_username,
        email: row.owner_email,
        name: row.owner_name,
      },
      _count: { tasks: row.task_count },
      memberRole: row.member_role,
    }));
  } catch (error) {
    console.error('Error getting accessible projects:', error);
    return [];
  }
}

// ==================================================
// MEMBER MANAGEMENT FUNCTIONS
// ==================================================

/**
 * Get all members of a project
 *
 * @param projectId - The project ID
 * @returns Array of project members with user details
 */
export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  try {
    const result = await sqlGateway.query(
      `SELECT 
        pm.id, pm.project_id, pm.user_id, pm.role, pm.joined_at, pm.added_by,
        u.username, u.email, u.name, u.avatar_url
      FROM pm_project_members pm
      JOIN pm_users u ON pm.user_id = u.id
      WHERE pm.project_id = @projectId
      ORDER BY 
        CASE pm.role 
          WHEN 'OWNER' THEN 1 
          WHEN 'PM' THEN 2 
          ELSE 3 
        END,
        u.name`,
      { projectId }
    );

    return result.recordset.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      userId: row.user_id,
      role: row.role,
      joinedAt: row.joined_at,
      addedBy: row.added_by,
      user: {
        id: row.user_id,
        username: row.username,
        email: row.email,
        name: row.name,
        avatarUrl: row.avatar_url,
      },
    }));
  } catch (error) {
    console.error('Error getting project members:', error);
    return [];
  }
}

/**
 * Add a member to a project
 *
 * @param data - Member data including projectId, userId, role, and addedBy
 * @returns The created project member
 */
export async function addProjectMember(data: {
  projectId: string;
  userId: string;
  role: 'PM' | 'MEMBER';
  addedBy: string;
}): Promise<ProjectMember> {
  const id = generateId('member');
  const now = new Date();

  await sqlGateway.query(
    `INSERT INTO pm_project_members (id, project_id, user_id, role, joined_at, added_by)
     VALUES (@id, @projectId, @userId, @role, @joinedAt, @addedBy)`,
    {
      id,
      projectId: data.projectId,
      userId: data.userId,
      role: data.role,
      joinedAt: now,
      addedBy: data.addedBy,
    }
  );

  // Fetch the created member with user details
  const members = await getProjectMembers(data.projectId);
  const newMember = members.find(m => m.id === id);

  if (!newMember) {
    throw new Error('Failed to retrieve created member');
  }

  return newMember;
}

/**
 * Remove a member from a project
 *
 * @param projectId - The project ID
 * @param userId - The user ID to remove
 * @returns True if successful
 */
export async function removeProjectMember(
  projectId: string,
  userId: string
): Promise<boolean> {
  try {
    // Check if user is the owner (cannot remove owner)
    const memberResult = await sqlGateway.query<{ role: string }>(
      `SELECT role FROM pm_project_members 
       WHERE project_id = @projectId AND user_id = @userId`,
      { projectId, userId }
    );

    if (memberResult.recordset.length === 0) {
      return false; // Member not found
    }

    if (memberResult.recordset[0].role === 'OWNER') {
      throw new Error('Cannot remove the project owner. Transfer ownership first.');
    }

    await sqlGateway.query(
      `DELETE FROM pm_project_members 
       WHERE project_id = @projectId AND user_id = @userId`,
      { projectId, userId }
    );

    return true;
  } catch (error) {
    console.error('Error removing project member:', error);
    throw error;
  }
}

/**
 * Update a member's role in a project
 *
 * @param projectId - The project ID
 * @param userId - The user ID to update
 * @param newRole - The new role to assign
 * @returns True if successful
 */
export async function updateMemberRole(
  projectId: string,
  userId: string,
  newRole: ProjectRole
): Promise<boolean> {
  try {
    // Cannot change owner role through this function
    if (newRole === 'OWNER') {
      throw new Error('Use transferOwnership to change project owner');
    }

    // Check if target is the owner
    const memberResult = await sqlGateway.query<{ role: string }>(
      `SELECT role FROM pm_project_members 
       WHERE project_id = @projectId AND user_id = @userId`,
      { projectId, userId }
    );

    if (memberResult.recordset.length === 0) {
      return false; // Member not found
    }

    if (memberResult.recordset[0].role === 'OWNER') {
      throw new Error('Cannot change owner role. Transfer ownership first.');
    }

    await sqlGateway.query(
      `UPDATE pm_project_members 
       SET role = @newRole
       WHERE project_id = @projectId AND user_id = @userId`,
      { projectId, userId, newRole }
    );

    return true;
  } catch (error) {
    console.error('Error updating member role:', error);
    throw error;
  }
}

/**
 * Transfer project ownership to another user
 *
 * @param projectId - The project ID
 * @param newOwnerId - The new owner's user ID
 * @param currentOwnerId - The current owner's user ID (for verification)
 * @returns True if successful
 */
export async function transferOwnership(
  projectId: string,
  newOwnerId: string,
  currentOwnerId: string
): Promise<boolean> {
  try {
    // Verify current owner
    const ownerResult = await sqlGateway.query<{ role: string }>(
      `SELECT role FROM pm_project_members 
       WHERE project_id = @projectId AND user_id = @currentOwnerId`,
      { projectId, currentOwnerId }
    );

    if (
      ownerResult.recordset.length === 0 ||
      ownerResult.recordset[0].role !== 'OWNER'
    ) {
      throw new Error('Current user is not the project owner');
    }

    // Check if new owner is already a member
    const newOwnerResult = await sqlGateway.query<{ role: string }>(
      `SELECT role FROM pm_project_members 
       WHERE project_id = @projectId AND user_id = @newOwnerId`,
      { projectId, newOwnerId }
    );

    // Use batch query for atomic update
    const queries: Array<{ sql: string; params: Record<string, any> }> = [
      // Update project owner_id
      {
        sql: 'UPDATE pm_projects SET owner_id = @newOwnerId WHERE id = @projectId',
        params: { projectId, newOwnerId },
      },
      // Demote current owner to PM
      {
        sql: `UPDATE pm_project_members SET role = 'PM'
              WHERE project_id = @projectId AND user_id = @currentOwnerId`,
        params: { projectId, currentOwnerId },
      },
    ];

    // If new owner is already a member, update their role
    if (newOwnerResult.recordset.length > 0) {
      queries.push({
        sql: `UPDATE pm_project_members SET role = 'OWNER'
              WHERE project_id = @projectId AND user_id = @newOwnerId`,
        params: { projectId, newOwnerId },
      });
    } else {
      // New owner is not a member, add them as owner
      const id = generateId('member');
      queries.push({
        sql: `INSERT INTO pm_project_members (id, project_id, user_id, role, joined_at, added_by)
              VALUES (@id, @projectId, @newOwnerId, 'OWNER', GETDATE(), @currentOwnerId)`,
        params: { id, projectId, newOwnerId, currentOwnerId },
      });
    }

    // Execute all queries
    for (const query of queries) {
      await sqlGateway.query(query.sql, query.params);
    }

    return true;
  } catch (error) {
    console.error('Error transferring ownership:', error);
    throw error;
  }
}

/**
 * Get member count for a project
 *
 * @param projectId - The project ID
 * @returns Number of members
 */
export async function getProjectMemberCount(projectId: string): Promise<number> {
  try {
    const result = await sqlGateway.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM pm_project_members WHERE project_id = @projectId',
      { projectId }
    );
    return result.recordset[0]?.count || 0;
  } catch (error) {
    console.error('Error getting member count:', error);
    return 0;
  }
}

/**
 * Check if a user can perform a specific action on a project
 *
 * @param action - The action to check
 * @param projectId - The project ID
 * @param userId - The user ID
 * @returns True if the user can perform the action
 */
export async function canPerformAction(
  action: 'edit_project' | 'delete_project' | 'create_task' | 'assign_task' | 'manage_members' | 'edit_any_task',
  projectId: string,
  userId: string
): Promise<boolean> {
  const access = await checkProjectAccess(projectId, userId);

  if (!access.hasAccess) {
    return false;
  }

  // ADMIN can do everything
  if (access.role === 'ADMIN') {
    return true;
  }

  // Check specific permissions based on role
  const permissions: Record<string, ProjectRole[]> = {
    'edit_project': ['OWNER'],
    'delete_project': ['OWNER'],
    'create_task': ['OWNER', 'PM'],
    'assign_task': ['OWNER', 'PM'],
    'manage_members': ['OWNER'],
    'edit_any_task': ['OWNER', 'PM'],
  };

  const allowedRoles = permissions[action] || [];
  return allowedRoles.includes(access.role as ProjectRole);
}