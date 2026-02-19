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

  // IMPORTANT for production on different servers/IPs:
  // 1. If not using HTTPS, 'secure' must be false
  // 2. If using IP address instead of domain, 'domain' should usually be omitted
  const sessionSecure = process.env.SESSION_SECURE === 'true'; // Allow explicit override
  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
  
  console.log('[setSession] Configuration:', {
    isProduction,
    domain: cookieDomain,
    secure: sessionSecure || (isProduction && false), // Default to false unless explicitly true
    path: '/',
    sameSite: 'lax',
    maxAge: `${maxAge} seconds`
  });

  cookieStore.set('session', sessionValue, {
    httpOnly: true,
    // If you are using HTTP (not HTTPS) in production, secure must be false
    // otherwise the browser will refuse to save the cookie
    secure: sessionSecure, 
    sameSite: 'lax', // Use 'lax' for better compatibility across different IPs/domains
    maxAge,
    path: '/',
    // If cookieDomain is not set, it defaults to the host that set it
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });

  console.log('[setSession] Session created successfully for:', sessionData.email);
}

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    console.log('[getSession] No session cookie found');
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    console.log('[getSession] Session found for:', session.email);
    return {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role
    };
  } catch (error) {
    console.error('[getSession] Failed to parse session:', error);
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
