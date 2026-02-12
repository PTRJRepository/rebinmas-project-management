import { db } from '@/lib/prisma';

// Mock user for MVP - replace with real auth later
export const MOCK_USER_ID = 'mock-user-1';

export async function getMockUser() {
  let user = await db.user.findUnique({
    where: { id: MOCK_USER_ID },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        id: MOCK_USER_ID,
        username: 'Demo User',
        email: 'demo@example.com',
        role: 'PM',
        password: 'password', // Add a dummy password
        name: 'Demo User',    // Add a dummy name
      },
    });
  }

  return user;
}

export async function getAllUsers() {
  return db.user.findMany({
    orderBy: { username: 'asc' },
  });
}
