# Production Login Checklist

## Checklist untuk Memastikan Login Berfungsi di Production Server

### 1. Environment Variables (CRITICAL)

File `.env` di server production harus memiliki:

```env
# Database/API Configuration
USE_SQL_SERVER="true"
API_QUERY_URL="<PRODUCTION_SQL_GATEWAY_URL>"  # Ganti dengan URL production
API_TOKEN="<PRODUCTION_API_TOKEN>"           # Ganti dengan token production

# Development (disable di production)
NODE_ENV="production"
```

**PENTING**: URL `http://10.0.0.110:8001` adalah IP local dan TIDAK akan bekerja di production!

---

### 2. SQL Gateway API Configuration

#### 2.1. Pastikan SQL Gateway API Accessible dari Production

| Kondisi | Action Required |
|---------|-----------------|
| SQL Gateway di server yang sama | Tidak perlu ubah URL |
| SQL Gateway di server berbeda | Ganti ke domain/IP publik yang accessible |
| Menggunakan reverse proxy | Gunakan URL HTTPS lengkap |

**URL Production Examples:**
- `http://sql-gateway.internal:8001` (jika dalam network yang sama)
- `https://api.yourdomain.com` (jika menggunakan domain publik)
- `http://192.168.1.X:8001` (jika menggunakan IP privat lain)

#### 2.2. Test Koneksi dari Production Server

```bash
# Test jika SQL Gateway accessible
curl -X POST http://YOUR_API_URL/health \
  -H "x-api-key: YOUR_API_TOKEN"
```

---

### 3. Cookie Security Configuration

Cookie saat ini dikonfigurasi di `lib/auth.ts:51-57`:

```typescript
cookieStore.set('session', sessionValue, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',  // Auto HTTPS di production
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 1 week
  path: '/'
});
```

**Notes:**
- `httpOnly: true` - Menghindari XSS theft
- `secure: true` saat `NODE_ENV=production` - Hanya kirim via HTTPS
- `sameSite: 'lax'` - Mencegah CSRF

**Jika menggunakan custom domain:**
```typescript
// Tambahkan domain configuration jika perlu
cookieStore.set('session', sessionValue, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  domain: '.yourdomain.com',  // Optional: untuk subdomain
  maxAge: 60 * 60 * 24 * 7,
  path: '/'
});
```

---

### 4. HTTPS/SSL Configuration

| Scenario | Configuration |
|----------|---------------|
| Next.js di belakang reverse proxy (nginx/Apache) | SSL di reverse proxy, Next.js HTTP |
| Next.js langsung dengan SSL | Set `NODE_ENV=production` (auto secure cookies) |

**Reverse Proxy Configuration (nginx example):**
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

### 5. Firewall & Network Ports

Pastikan port berikut open:

| Port | Service | Direction |
|------|----------|------------|
| 3000 (atau custom) | Next.js App | Inbound dari reverse proxy/publik |
| 8001 (atau custom) | SQL Gateway | Outbound dari Next.js server |

---

### 6. Database User Permissions

Pastikan user di SQL Server memiliki permissions:

```sql
-- Untuk login (read user)
GRANT SELECT ON pm_users TO [SERVER_PROFILE_1];

-- Untuk register (create user)
GRANT INSERT ON pm_users TO [SERVER_PROFILE_1];
```

---

### 7. Testing Login di Production

#### 7.1. Test API Gateway Connection

Buat file test `test-api-connection.js`:

```javascript
const apiUrl = process.env.API_QUERY_URL || 'http://10.0.0.110:8001';
const apiToken = process.env.API_TOKEN || 'your-token';

fetch(`${apiUrl}/health`)
  .then(r => r.json())
  .then(data => console.log('Health check:', data))
  .catch(err => console.error('Connection failed:', err));
```

#### 7.2. Test Login Endpoint

```bash
# Test user query
curl -X POST http://localhost:3000/api/user \
  -H "Content-Type: application/json"
```

#### 7.3. Browser Console Test

```javascript
// Cek cookie setelah login
document.cookie

// Cek session cookie
console.log(document.cookie.split(';').find(c => c.includes('session')))
```

---

### 8. Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|----------|----------|
| SQL Gateway tidak accessible | "Failed to fetch" / Network error | Update `API_QUERY_URL` ke production URL |
| Cookie tidak tersimpan | Login redirect kembali ke login page | Cek HTTPS configuration, pastikan `NODE_ENV=production` |
| CORS error | Browser console shows CORS | Setup CORS di SQL Gateway atau gunakan same domain |
| Password verification failed | "Invalid email or password" | Cek bcrypt hashing consistency |
| Session lost after refresh | User logged out suddenly | Cek cookie domain/path configuration |

---

### 9. Pre-Deployment Checklist

- [ ] Environment variables di-set dengan production values
- [ ] `NODE_ENV=production` di-set
- [ ] SQL Gateway API accessible dari production server
- [ ] Firewall allows outbound connection ke SQL Gateway
- [ ] SSL/HTTPS configured (jika required)
- [ ] Test login dengan existing user
- [ ] Test register new user
- [ ] Test logout
- [ ] Test session persistence (close browser, reopen)
- [ ] Cek browser console untuk errors
- [ ] Cek server logs untuk errors

---

### 10. Monitoring & Debugging

#### Enable Debug Mode (temporary)

```bash
# Run dengan verbose logging
NODE_ENV=production DEBUG=* next start
```

#### Check Production Logs

```bash
# PM2 logs (jika menggunakan PM2)
pm2 logs schedule-tracker

# Docker logs (jika menggunakan Docker)
docker logs <container_id>
```

#### SQL Gateway Debug

```typescript
// Di lib/api/sql-gateway.ts, tambahkan logging
async query<T = any>(...) {
  console.log('[SQL Gateway] Query:', sql);
  console.log('[SQL Gateway] Params:', params);
  console.log('[SQL Gateway] URL:', this.baseUrl);

  const response = await fetch(...);
  console.log('[SQL Gateway] Response:', response.status);

  // ... rest of code
}
```

---

## Quick Start Deployment Command

```bash
# 1. Set environment
export NODE_ENV=production
export API_QUERY_URL="http://your-production-gateway-url:8001"
export API_TOKEN="your-production-token"
export USE_SQL_SERVER="true"

# 2. Build
bun run build

# 3. Start
bun run start
```

---

## Contacts & Resources

- SQL Gateway API Docs: `dokumentasi/api_query.md`
- Auth Implementation: `app/actions/auth.ts`
- Auth Library: `lib/auth.ts`
- SQL Gateway Client: `lib/api/sql-gateway.ts`
