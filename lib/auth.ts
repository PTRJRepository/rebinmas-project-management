import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a session token
 */
export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Session data structure
 */
export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Set session cookie
 */
export async function setSession(sessionData: SessionData): Promise<void> {
  const cookieStore = await cookies();
  const token = generateSessionToken();

  // Store session data in cookie (simple approach)
  // In production, you'd want to store this in a database or Redis
  const sessionValue = JSON.stringify({
    token,
    ...sessionData
  });

  // Cookie configuration for production
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAge = parseInt(process.env.SESSION_MAX_AGE || '7', 10) * 60 * 60 * 24;

  cookieStore.set('session', sessionValue, {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: 'lax',
    maxAge,
    path: '/',
    // Optional: Set domain if using custom domain (e.g., .yourdomain.com)
    // domain: isProduction ? '.yourdomain.com' : undefined,
  });
}

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    return {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role
    };
  } catch {
    return null;
  }
}

/**
 * Clear session (logout)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

/**
 * Validate session and redirect if not authenticated
 */
export async function validateSession(): Promise<SessionData | null> {
  const session = await getSession();
  return session;
}
