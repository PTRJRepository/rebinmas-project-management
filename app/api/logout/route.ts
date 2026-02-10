import { NextResponse } from 'next/server';
import { logout } from '@/app/actions/auth';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    await logout();

    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.delete('session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
