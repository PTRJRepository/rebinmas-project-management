'use server'

import { sqlGateway } from '@/lib/api/sql-gateway'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(userId: string, newRole: string) {
    const session = await getSession()
    
    // Strict RBAC Verification
    if (!session || session.role !== 'ADMIN') {
        return { success: false, error: 'Unauthorized: Only Administrators can modify roles' }
    }
    
    // Prevent locking out the last admin or changing self (optional, but good practice)
    if (userId === session.userId && newRole !== 'ADMIN') {
        return { success: false, error: 'Cannot demote yourself directly' }
    }
    
    try {
        await sqlGateway.query(`
            UPDATE pm_users SET role = @newRole WHERE id = @userId
        `, { newRole, userId })
        
        revalidatePath('/admin')
        return { success: true }
    } catch (e: any) {
        console.error("updateUserRole error:", e.message)
        return { success: false, error: 'Database update failed' }
    }
}
