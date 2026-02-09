import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function getTasks(filters?: { projectId?: string; statusId?: string; assigneeId?: string }) {
  return prisma.task.findMany({
    where: filters,
    include: {
      project: true,
      status: true,
      assignee: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      project: true,
      status: true,
      assignee: true,
      comments: {
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority: string;
  dueDate?: Date;
  estimatedHours?: number;
  projectId: string;
  statusId: string;
  assigneeId?: string;
}) {
  return prisma.task.create({
    data,
    include: {
      status: true,
      assignee: true,
    },
  });
}

export async function updateTask(id: string, data: Prisma.TaskUpdateInput) {
  return prisma.task.update({
    where: { id },
    data,
    include: {
      status: true,
      assignee: true,
    },
  });
}

export async function updateTaskStatus(id: string, statusId: string) {
  return prisma.task.update({
    where: { id },
    data: { statusId },
    include: {
      status: true,
      assignee: true,
    },
  });
}

export async function deleteTask(id: string) {
  return prisma.task.delete({
    where: { id },
  });
}
