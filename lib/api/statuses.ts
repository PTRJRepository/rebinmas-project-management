import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function getStatuses(projectId?: string) {
  return prisma.taskStatus.findMany({
    where: projectId ? { projectId } : undefined,
    include: {
      _count: {
        select: { tasks: true },
      },
    },
    orderBy: { order: 'asc' },
  });
}

export async function getStatusById(id: string) {
  return prisma.taskStatus.findUnique({
    where: { id },
    include: {
      tasks: {
        include: {
          assignee: true,
        },
      },
    },
  });
}

export async function createStatus(data: {
  name: string;
  order: number;
  projectId: string;
}) {
  return prisma.taskStatus.create({
    data,
  });
}

export async function updateStatus(id: string, data: Prisma.TaskStatusUpdateInput) {
  return prisma.taskStatus.update({
    where: { id },
    data,
  });
}

export async function deleteStatus(id: string) {
  return prisma.taskStatus.delete({
    where: { id },
  });
}
