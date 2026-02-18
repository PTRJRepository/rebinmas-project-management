# 🔐 Authentication & Authorization

> **Version**: 1.0  
> **Last Updated**: 2026-02-17

---

## 1. Overview

The application uses a **cookie-based session authentication** system with **bcrypt password hashing**. There is no JWT or third-party OAuth provider — authentication is fully custom-built.

---

## 2. Authentication Flow

### 2.1. Registration Flow

```
┌──────────┐     ┌────────────────┐     ┌───────────────┐     ┌──────────┐
│  Client   │────▶│ register()     │────▶│ getUserByEmail│────▶│ SQL      │
│  Form     │     │ (Server Action)│     │ (check dup)   │     │ Gateway  │
└──────────┘     └────────┬───────┘     └───────────────┘     └──────────┘
                          │
                          ▼
                 ┌────────────────┐
                 │ hashPassword() │  ← bcrypt, 10 salt rounds
                 └────────┬───────┘
                          │
                          ▼
                 ┌────────────────┐     ┌──────────┐
                 │ createUser()   │────▶│ SQL      │
                 │ (insert to DB) │     │ Gateway  │
                 └────────┬───────┘     └──────────┘
                          │
                          ▼
                 ┌────────────────┐
                 │ setSession()   │  ← Set HTTP-only cookie
                 └────────┬───────┘
                          │
                          ▼
                 ┌────────────────┐
                 │ Redirect to    │
                 │ /dashboard     │
                 └────────────────┘
```

### 2.2. Login Flow

```
┌──────────┐     ┌────────────────┐     ┌──────────────────────┐
│  Client   │────▶│ login()        │────▶│ getUserWithEmailFor  │
│  Form     │     │ (Server Action)│     │ Auth (email + pass)  │
└──────────┘     └────────┬───────┘     └──────────┬───────────┘
                          │                         │
                          ▼                         ▼
                 ┌────────────────┐        ┌──────────────┐
                 │ verifyPassword │◀───────│ SQL Gateway  │
                 │ (bcrypt compare)│       │ (query user) │
                 └────────┬───────┘        └──────────────┘
                          │
                    ┌─────┴─────┐
                    │           │
                 ✅ Match    ❌ No Match
                    │           │
                    ▼           ▼
            ┌──────────┐  ┌────────────┐
            │setSession│  │Return Error│
            │(cookie)  │  │"Invalid..."│
            └────┬─────┘  └────────────┘
                 │
                 ▼
            ┌──────────┐
            │ Redirect │
            │/dashboard│
            └──────────┘
```

### 2.3. Session Verification

```
┌────────────┐     ┌──────────────┐     ┌───────────────┐
│ Any Request │────▶│ middleware.ts │────▶│ Check cookie  │
└────────────┘     └──────┬───────┘     │ 'session'     │
                          │              └───────┬───────┘
                          │                      │
                  ┌───────┴────────┐    ┌───────┴───────┐
                  │                │    │               │
           Has Session        No Session          Protected?
                  │                │    │               │
                  ▼                │    │               ▼
           ┌──────────┐           │    │    ┌─────────────┐
           │ Continue  │           │    └───▶│ Redirect to │
           │ to page   │           │        │ /auth/login  │
           └──────────┘           │         └─────────────┘
                                  │
                            Auth Page?
                                  │
                                  ▼
                         ┌──────────────┐
                         │ Redirect to  │
                         │ /dashboard   │
                         └──────────────┘
```

---

## 3. Key Files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | Core auth utilities — hashing, sessions, cookies |
| `app/actions/auth.ts` | Server actions — register, login, logout, getCurrentUser |
| `middleware.ts` | Route protection — redirect unauthenticated users |
| `components/auth/login-form.tsx` | Login UI component |
| `components/auth/register-form.tsx` | Registration UI component |

---

## 4. Session Management

### 4.1. Session Cookie Structure

```json
{
  "token": "random-string-123abc",
  "userId": "clsm1234567890",
  "email": "admin@rebinmas.polda.id",
  "name": "Admin User",
  "role": "ADMIN"
}
```

### 4.2. Cookie Configuration

| Property | Development | Production |
|----------|------------|------------|
| `httpOnly` | `true` | `true` |
| `secure` | `false` | `true` (HTTPS only) |
| `sameSite` | `lax` | `lax` |
| `maxAge` | 7 days | Configurable via `SESSION_MAX_AGE` |
| `path` | `/` | `/` |

### 4.3. Functions

```typescript
// lib/auth.ts

// Hash a password
hashPassword(password: string): Promise<string>  // bcrypt, 10 rounds

// Compare password with hash
verifyPassword(password: string, hash: string): Promise<boolean>

// Store session in cookie
setSession(sessionData: SessionData): Promise<void>

// Read session from cookie
getSession(): Promise<SessionData | null>

// Delete session cookie
clearSession(): Promise<void>

// Validate session exists
validateSession(): Promise<SessionData | null>
```

---

## 5. Middleware (Route Protection)

**File**: `middleware.ts`

### Protected Paths (require authentication):
- `/dashboard`
- `/projects`
- `/settings`

### Auth Paths (redirect to dashboard if already logged in):
- `/login`
- `/register`
- `/auth/login`
- `/auth/register`

### Root Path (`/`):
- Authenticated → redirect to `/dashboard`
- Not authenticated → redirect to `/auth/login`

### Excluded from middleware:
- `/api/*` — API routes handle their own auth
- `/_next/*` — Static assets
- `/favicon.ico`
- Public files

---

## 6. Role-Based Access Control (RBAC)

| Role | Create Project | Edit Own Project | Delete Own Project | Create Task | Manage Users |
|------|:-:|:-:|:-:|:-:|:-:|
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **PM** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **MEMBER** | ✅ | ✅ | ✅ | ✅ | ❌ |

> **Note**: Ownership verification is enforced in Server Actions for update/delete operations. Users can only modify their own projects.

---

## 7. Security Best Practices

| Practice | Implementation |
|----------|---------------|
| **Password Hashing** | bcrypt with 10 salt rounds |
| **HTTP-Only Cookies** | Session cookie not accessible to JavaScript |
| **Secure Flag** | Cookie sent only over HTTPS in production |
| **Parameterized Queries** | SQL injection prevention via SQL Gateway params |
| **No Password Exposure** | `getUserByEmail` returns user without password |
| **Session Validation** | Every mutation checks `getCurrentUser()` |
| **CSRF Protection** | SameSite=Lax cookie policy |
