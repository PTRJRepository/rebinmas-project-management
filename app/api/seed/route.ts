import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function GET() {
    try {
        console.log('Starting seed...');
        // 1. Create a default User
        const passwordHash = await hashPassword('demo123456');

        // Check if user exists first (SQL Gateway client doesn't support upsert)
        const existingUser = await db.user.findUnique({
            where: { email: 'demo@example.com' }
        });

        let user;
        if (existingUser) {
            user = existingUser;
            console.log('Use existing demo user');
        } else {
            user = await db.user.create({
                data: {
                    email: 'demo@example.com',
                    username: 'demo',
                    name: 'Demo User',
                    password: passwordHash,
                    role: 'PM',
                    avatarUrl: 'https://github.com/shadcn.png',
                }
            });
            console.log('Created new demo user');
        }

        // 2. Create a default Project
        const project = await db.project.create({
            data: {
                name: 'Jira Clone Development',
                description: 'Building a Jira-like tool with Next.js and Prisma',
                ownerId: user.id,
                startDate: new Date(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
            },
        });

        // 3. Create Task Statuses for the Project
        const statuses = ['To Do', 'In Progress', 'Done'];
        for (let i = 0; i < statuses.length; i++) {
            await db.taskStatus.create({
                data: {
                    name: statuses[i],
                    order: i,
                    projectId: project.id,
                }
            });
        }

        // 4. Create a sample Task
        const allStatuses = await db.taskStatus.findMany({
            where: { projectId: project.id },
        });
        const todoStatus = allStatuses.find((s: any) => s.name === 'To Do');

        if (todoStatus) {
            await db.task.create({
                data: {
                    title: 'Setup Database',
                    description: 'Configure Prisma and SQLite',
                    priority: 'HIGH',
                    estimatedHours: 2,
                    projectId: project.id,
                    statusId: todoStatus.id,
                    assigneeId: user.id,
                    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
                },
            });
        }

        return NextResponse.json({ success: true, user, project });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
    }
}
