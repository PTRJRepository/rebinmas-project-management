
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // 1. Create a default User
    const user = await prisma.user.upsert({
        where: { email: 'demo@example.com' },
        update: {},
        create: {
            email: 'demo@example.com',
            username: 'Demo User',
            role: 'PM',
            avatarUrl: 'https://github.com/shadcn.png',
        },
    })

    console.log('User created:', user)

    // 2. Create a default Project
    const project = await prisma.project.create({
        data: {
            name: 'Jira Clone Development',
            description: 'Building a Jira-like tool with Next.js and Prisma',
            ownerId: user.id,
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
        },
    })

    console.log('Project created:', project)

    // 3. Create Task Statuses for the Project
    const statuses = ['To Do', 'In Progress', 'Done']
    for (let i = 0; i < statuses.length; i++) {
        await prisma.taskStatus.create({
            data: {
                name: statuses[i],
                order: i,
                projectId: project.id,
            },
        })
    }
    console.log('Statuses created')

    // 4. Create a sample Task
    const todoStatus = await prisma.taskStatus.findFirst({
        where: { projectId: project.id, name: 'To Do' },
    })

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
        })
        console.log('Sample task created')
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
