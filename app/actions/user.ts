'use server';

/**
 * User Actions - Using SQL Server via SQL Gateway API
 *
 * All user operations now use the SQL Server database (extend_db_ptrj)
 * via the SQL Gateway API instead of local SQLite.
 */

import { sqlGateway } from '@/lib/api/sql-gateway';
import { hashPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface UserResult {
    success: boolean;
    error?: string;
    user?: any;
}

export interface User {
    id: string;
    name: string;
    email: string;
    username: string;
    role: string;
    createdAt: Date;
    avatarUrl?: string | null;
}

/**
 * Get all users from SQL Server
 */
export async function getUsers() {
    try {
        const result = await sqlGateway.query(
            'SELECT id, name, email, username, role, created_at, avatar_url FROM pm_users ORDER BY created_at DESC'
        );
        
        const users = result.recordset.map((row: any) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            username: row.username,
            role: row.role,
            createdAt: row.created_at,
            avatarUrl: row.avatar_url
        }));
        
        return { success: true, users };
    } catch (error: any) {
        console.error('Failed to fetch users:', error);
        return { success: false, error: 'Failed to fetch users' };
    }
}

/**
 * Create a new user in SQL Server
 */
export async function createUser(formData: FormData): Promise<UserResult> {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string || 'MEMBER';

    // Validation
    if (!name || !email || !password) {
        return { success: false, error: 'Name, email, and password are required' };
    }

    if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
    }

    try {
        // Check if user already exists
        const existingUserResult = await sqlGateway.query(
            'SELECT id FROM pm_users WHERE email = @email',
            { email }
        );

        if (existingUserResult.recordset.length > 0) {
            return { success: false, error: 'Email already registered' };
        }

        // Hash password and create user
        const passwordHash = await hashPassword(password);
        const username = email.split('@')[0];
        const id = `user_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
        const now = new Date();

        await sqlGateway.query(`
            INSERT INTO pm_users (id, name, email, username, password, role, created_at, updated_at)
            VALUES (@id, @name, @email, @username, @password, @role, @createdAt, @updatedAt)
        `, {
            id,
            name,
            email,
            username,
            password: passwordHash,
            role,
            createdAt: now,
            updatedAt: now
        });

        revalidatePath('/users');
        return { 
            success: true, 
            user: {
                id,
                name,
                email,
                username,
                role,
                createdAt: now,
                avatarUrl: null
            }
        };
    } catch (error: any) {
        console.error('Create user error:', error);
        return { success: false, error: 'Failed to create user' };
    }
}

/**
 * Delete a user from SQL Server
 */
export async function deleteUser(userId: string): Promise<UserResult> {
    if (!userId) {
        return { success: false, error: 'User ID is required' };
    }

    try {
        // Delete user (cascades to related records)
        await sqlGateway.query(
            'DELETE FROM pm_users WHERE id = @id',
            { id: userId }
        );

        revalidatePath('/users');
        return { success: true };
    } catch (error: any) {
        console.error('Delete user error:', error);
        return { success: false, error: 'Failed to delete user' };
    }
}
