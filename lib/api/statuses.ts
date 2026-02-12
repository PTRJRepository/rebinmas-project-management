import { db } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function getStatuses(projectId?: string) {
  return db.taskStatus.findMany({
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
  return db.taskStatus.findUnique({
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
  return db.taskStatus.create({
    data,
  });
}

export async function updateStatus(id: string, data: Prisma.TaskStatusUpdateInput) {
  return db.taskStatus.update({
    where: { id },
    data,
  });
}

export async function deleteStatus(id: string) {
  return db.taskStatus.delete({
    where: { id },
  });
}
