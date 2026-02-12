'use server';

import { db } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface UserResult {
    success: boolean;
    error?: string;
    user?: any;
}

/**
 * Get all users
 */
export async function getUsers() {
    try {
        const users = await db.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                role: true,
                createdAt: true,
                avatarUrl: true
            }
        });
        return { success: true, users };
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return { success: false, error: 'Failed to fetch users' };
    }
}

/**
 * Create a new user
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
        const existingUser = await db.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return { success: false, error: 'Email already registered' };
        }

        // Hash password and create user
        const passwordHash = await hashPassword(password);
        const username = email.split('@')[0];

        const user = await db.user.create({
            data: {
                name,
                email,
                username,
                password: passwordHash,
                role
            }
        });

        revalidatePath('/users');
        return { success: true, user };
    } catch (error) {
        console.error('Create user error:', error);
        return { success: false, error: 'Failed to create user' };
    }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string): Promise<UserResult> {
    if (!userId) {
        return { success: false, error: 'User ID is required' };
    }

    try {
        await db.user.delete({
            where: { id: userId }
        });

        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        console.error('Delete user error:', error);
        return { success: false, error: 'Failed to delete user' };
    }
}
