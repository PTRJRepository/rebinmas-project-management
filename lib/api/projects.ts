import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function getProjects() {
  return prisma.project.findMany({
    include: {
      owner: true,
      _count: {
        select: { tasks: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      owner: true,
      statuses: {
        orderBy: { order: 'asc' },
      },
      tasks: {
        include: {
          status: true,
          assignee: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function createProject(data: {
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  ownerId: string;
}) {
  const project = await prisma.project.create({
    data: {
      ...data,
      statuses: {
        create: [
          { name: 'Backlog', order: 0 },
          { name: 'To Do', order: 1 },
          { name: 'In Progress', order: 2 },
          { name: 'Review', order: 3 },
          { name: 'Done', order: 4 },
        ],
      },
    },
    include: {
      statuses: true,
    },
  });

  return project;
}

export async function updateProject(id: string, data: Prisma.ProjectUpdateInput) {
  return prisma.project.update({
    where: { id },
    data,
  });
}



export async function deleteProject(id: string) {
  // Manual cascade delete since schema doesn't have onDelete: Cascade
  // 1. Delete all tasks (this will cascade to comments and attachments if those have onDelete: Cascade)
  await prisma.task.deleteMany({
    where: { projectId: id },
  });

  // 2. Delete all task statuses
  await prisma.taskStatus.deleteMany({
    where: { projectId: id },
  });

  // 3. Delete the project
  return prisma.project.delete({
    where: { id },
  });
}

export async function getProjectDashboardStats(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        include: { status: true },
      },
    },
  });

  if (!project) return null;

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(t => t.status.name === 'Done').length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const overdueTasks = project.tasks.filter(
    t => t.dueDate && t.dueDate < now && t.status.name !== 'Done'
  ).length;

  const dueSoonTasks = project.tasks.filter(
    t => t.dueDate && t.dueDate >= now && t.dueDate <= tomorrow && t.status.name !== 'Done'
  ).length;

  const tasksByStatus = project.tasks.reduce((acc, task) => {
    const statusName = task.status.name;
    acc[statusName] = (acc[statusName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalTasks,
    completedTasks,
    progressPercentage,
    overdueTasks,
    dueSoonTasks,
    tasksByStatus: Object.entries(tasksByStatus).map(([status, count]) => ({ status, count })),
  };
}
