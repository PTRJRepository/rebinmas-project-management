import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function GET() {
    try {
        console.log('Starting seed...');
        // 1. Create a default User
        const passwordHash = await hashPassword('demo123456');
        const user = await prisma.user.upsert({
            where: { email: 'demo@example.com' },
            update: {},
            create: {
                email: 'demo@example.com',
                username: 'demo',
                name: 'Demo User',
                password: passwordHash,
                role: 'PM',
                avatarUrl: 'https://github.com/shadcn.png',
            },
        });

        // 2. Create a default Project
        const project = await prisma.project.create({
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
            await prisma.taskStatus.create({
                data: {
                    name: statuses[i],
                    order: i,
                    projectId: project.id,
                }
            });
        }

        // 4. Create a sample Task
        const todoStatus = await prisma.taskStatus.findFirst({
            where: { projectId: project.id, name: 'To Do' },
        });

        if (todoStatus) {
            await prisma.task.create({
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
