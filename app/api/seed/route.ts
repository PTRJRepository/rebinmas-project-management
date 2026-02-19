import { NextResponse } from 'next/server';
import { sqlGateway } from '@/lib/api/sql-gateway';
import { hashPassword } from '@/lib/auth';

export async function GET() {
    try {
        console.log('Starting seed to SQL Server...');
        
        const now = new Date();
        const passwordHash = await hashPassword('demo123456');

        // Check if demo user exists
        const existingUserResult = await sqlGateway.query(
            'SELECT id FROM pm_users WHERE email = @email',
            { email: 'demo@example.com' }
        );

        let userId;
        if (existingUserResult.recordset.length > 0) {
            userId = existingUserResult.recordset[0].id;
            console.log('Using existing demo user');
        } else {
            // Create demo user
            userId = `user_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
            await sqlGateway.query(`
                INSERT INTO pm_users (id, email, username, name, password, role, avatar_url, created_at, updated_at)
                VALUES (@id, @email, @username, @name, @password, @role, @avatarUrl, @createdAt, @updatedAt)
            `, {
                id: userId,
                email: 'demo@example.com',
                username: 'demo',
                name: 'Demo User',
                password: passwordHash,
                role: 'PM',
                avatarUrl: 'https://github.com/shadcn.png',
                createdAt: now,
                updatedAt: now
            });
            console.log('Created new demo user');
        }

        // Create demo project
        const projectId = `proj_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
        await sqlGateway.query(`
            INSERT INTO pm_projects (id, name, description, owner_id, start_date, end_date, priority, created_at, updated_at)
            VALUES (@id, @name, @description, @ownerId, @startDate, @endDate, @priority, @createdAt, @updatedAt)
        `, {
            id: projectId,
            name: 'Jira Clone Development',
            description: 'Building a Jira-like tool with Next.js and SQL Server',
            ownerId: userId,
            startDate: now,
            endDate: new Date(now.setDate(now.getDate() + 30)),
            priority: 'MEDIUM',
            createdAt: now,
            updatedAt: now
        });

        // Create task statuses
        const statuses = ['To Do', 'In Progress', 'Done'];
        for (let i = 0; i < statuses.length; i++) {
            const statusId = `status_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
            await sqlGateway.query(`
                INSERT INTO pm_task_statuses (id, name, [order], project_id, created_at, updated_at)
                VALUES (@id, @name, @order, @projectId, @createdAt, @updatedAt)
            `, {
                id: statusId,
                name: statuses[i],
                order: i,
                projectId: projectId,
                createdAt: now,
                updatedAt: now
            });
        }

        // Get To Do status
        const todoStatusResult = await sqlGateway.query(
            'SELECT id FROM pm_task_statuses WHERE project_id = @projectId AND name = @name',
            { projectId, name: 'To Do' }
        );

        if (todoStatusResult.recordset.length > 0) {
            const todoStatusId = todoStatusResult.recordset[0].id;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 1);

            // Create sample task
            const taskId = `task_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
            await sqlGateway.query(`
                INSERT INTO pm_tasks (id, title, description, priority, estimated_hours, project_id, status_id, assignee_id, due_date, progress, created_at, updated_at)
                VALUES (@id, @title, @description, @priority, @estimatedHours, @projectId, @statusId, @assigneeId, @dueDate, @progress, @createdAt, @updatedAt)
            `, {
                id: taskId,
                title: 'Setup Database',
                description: 'Configure SQL Server connection',
                priority: 'HIGH',
                estimatedHours: 2,
                projectId,
                statusId: todoStatusId,
                assigneeId: userId,
                dueDate,
                progress: 0,
                createdAt: now,
                updatedAt: now
            });
        }

        // Add user as project member (OWNER)
        const memberId = `member_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
        await sqlGateway.query(`
            INSERT INTO pm_project_members (id, project_id, user_id, role, joined_at, added_by)
            VALUES (@id, @projectId, @userId, 'OWNER', @joinedAt, @addedBy)
        `, {
            id: memberId,
            projectId,
            userId,
            joinedAt: now,
            addedBy: userId
        });

        return NextResponse.json({ 
            success: true, 
            userId, 
            projectId,
            message: 'Database seeded successfully to SQL Server'
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message, 
            stack: error.stack 
        }, { status: 500 });
    }
}
