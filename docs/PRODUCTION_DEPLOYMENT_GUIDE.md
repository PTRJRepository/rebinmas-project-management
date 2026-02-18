# Panduan Deployment Production - Rebinmas Schedule Tracker

## Ringkasan

Dokumen ini menjelaskan cara men-deploy aplikasi Rebinmas Schedule Tracker ke production server dengan memastikan fungsi login berkerja dengan baik.

---

## Daftar Isi

1. [Prerequisites](#prerequisites)
2. [Persiapan Environment Variables](#persiapan-environment-variables)
3. [Build Application](#build-application)
4. [Testing Koneksi](#testing-koneksi)
5. [Deployment](#deployment)
6. [Verifikasi Login](#verifikasi-login)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Software yang Dibutuhkan di Production Server:

- Node.js (v18 atau higher)
- Bun (opsional, lebih cepat)
- PM2 atau process manager lain
- nginx atau Apache (untuk reverse proxy)
- SSL Certificate (untuk HTTPS)

### Network Requirements:

- Akses outbound ke SQL Gateway API
- Port 3000 (atau custom) untuk Next.js
- SQL Gateway harus accessible dari production server

---

## Persiapan Environment Variables

### 1. Copy file example environment:

```bash
cp .env.production.example .env.production
```

### 2. Edit `.env.production` dengan nilai production:

```env
# CRITICAL: Ganti nilai-nilai berikut!
NODE_ENV=production
USE_SQL_SERVER=true

# GANTI INI - URL SQL Gateway Production Anda
API_QUERY_URL=http://your-sql-gateway-url:8001

# GANTI INI - API Token Production Anda
API_TOKEN=your-production-api-token-here

# Optional: App URL untuk links
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3. Pastikan SQL Gateway URL Production

**JANGAN gunakan IP local seperti `10.0.0.110` di production!**

Ganti dengan salah satu:
- `http://sql-gateway.yourdomain.com:8001`
- `https://api.yourdomain.com/sql-gateway`
- `http://192.168.1.X:8001` (jika network yang sama)

---

## Build Application

### 1. Install dependencies:

```bash
bun install
# atau
npm install
```

### 2. Build untuk production:

```bash
NODE_ENV=production bun run build
# atau
NODE_ENV=production npm run build
```

### 3. Verifikasi build berhasil:

Folder `.next/` seharusnya sudah dibuat.

---

## Testing Koneksi

Sebelum deploy, test koneksi ke SQL Gateway:

```bash
# Set environment variables untuk testing
export NODE_ENV=production
export API_QUERY_URL="http://your-gateway-url:8001"
export API_TOKEN="your-token"

# Jalankan test script
bun run test:prod
# atau
npm run test:connection
```

**Expected Output:**
```
===================================
PRODUCTION CONNECTION TEST
===================================

✓ PASS - healthCheck
✓ PASS - serverList
✓ PASS - userQuery
✓ PASS - loginFlow
✓ PASS - environment

ALL TESTS PASSED!
```

Jika ada test yang gagal, lihat [Troubleshooting](#troubleshooting).

---

## Deployment

### Method 1: PM2 (Recommended)

#### Install PM2:

```bash
npm install -g pm2
```

#### Create ecosystem file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'rebinmas-schedule-tracker',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    instances: 1,
    exec_mode: 'fork',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
```

#### Deploy dengan PM2:

```bash
# Load environment variables
source .env.production

# Start aplikasi
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

#### PM2 Commands:

```bash
pm2 status           # Cek status
pm2 logs rebinmas    # Lihat logs
pm2 restart rebinmas # Restart
pm2 stop rebinmas    # Stop
pm2 delete rebinmas   # Remove
```

---

### Method 2: systemd Service

Create file `/etc/systemd/system/rebinmas-schedule-tracker.service`:

```ini
[Unit]
Description=Rebinmas Schedule Tracker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/rebinmas-schedule-tracker
Environment=NODE_ENV=production
EnvironmentFile=/var/www/rebinmas-schedule-tracker/.env.production
ExecStart=/usr/bin/node node_modules/.bin/next start -p 3000
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable dan start service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable rebinmas-schedule-tracker
sudo systemctl start rebinmas-schedule-tracker
sudo systemctl status rebinmas-schedule-tracker
```

---

### Method 3: Docker

Create `Dockerfile.production`:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN corepack enable && corepack prepare bun@latest --activate
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

Build dan run:

```bash
# Build image
docker build -f Dockerfile.production -t rebinmas-schedule-tracker .

# Run container
docker run -d \
  --name rebinmas-schedule-tracker \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  rebinmas-schedule-tracker
```

---

## Reverse Proxy Configuration (nginx)

### Setup nginx untuk HTTPS:

Create file `/etc/nginx/sites-available/rebinmas-schedule-tracker`:

```nginx
# HTTP Redirect - Redirect semua ke HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    return 301 https://$server_name$request_uri;
}

# HTTPS - Main application
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy ke Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Caching (optional)
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support (jika needed)
    location /_next/webpack-hmr {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable dan restart nginx:

```bash
sudo ln -s /etc/nginx/sites-available/rebinmas-schedule-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Verifikasi Login

### 1. Test Koneksi SQL Gateway

```bash
curl -f http://localhost:3000/api/health
# atau
curl -f https://yourdomain.com/api/health
```

### 2. Test Login Page

Buka browser dan akses:
- `https://yourdomain.com/auth/login`

### 3. Test Login dengan User Existing

1. Masukkan email dan password
2. Klik "SIGN IN"
3. Seharusnya redirect ke `/dashboard`

### 4. Cek Browser Console

```javascript
// Cek session cookie
document.cookie

// Pastikan session cookie ada
document.cookie.includes('session')
```

### 5. Test Session Persistence

1. Login berhasil
2. Close browser
3. Reopen browser
4. Akses aplikasi lagi
5. Seharusnya masih login (session tersimpan)

---

## Troubleshooting

### Problem: "Failed to fetch" / Network Error

**Cause:** SQL Gateway tidak accessible

**Solution:**
1. Check apakah URL benar:
   ```bash
   echo $API_QUERY_URL
   ```

2. Test koneksi manual:
   ```bash
   curl http://your-gateway-url:8001/health
   ```

3. Check firewall rules

4. Jika menggunakan IP privat (10.x, 192.168.x), pastikan production server dan SQL Gateway di network yang sama

---

### Problem: Cookie tidak tersimpan

**Cause:** HTTPS/SSL issue

**Solution:**
1. Pastikan `NODE_ENV=production`
2. Pastikan menggunakan HTTPS
3. Check nginx configuration untuk SSL
4. Cek browser console untuk cookie errors

---

### Problem: "Invalid email or password"

**Cause:** Password hashing atau query error

**Solution:**
1. Test user query manual:
   ```bash
   node scripts/test-production-connection.js
   ```

2. Check apakah password hash ada di database

3. Cek bcrypt version compatibility

---

### Problem: Session lost after refresh

**Cause:** Cookie configuration issue

**Solution:**
1. Check cookie domain configuration
2. Pastikan `path: '/'` di-set
3. Check sameSite cookie policy

---

### Problem: SQL Gateway returns 401/403

**Cause:** API Token invalid atau expired

**Solution:**
1. Verify API_TOKEN is correct
2. Generate new token jika needed
3. Check SQL Gateway logs

---

## Monitoring & Maintenance

### Check Logs

```bash
# PM2 logs
pm2 logs rebinmas

# systemd service logs
sudo journalctl -u rebinmas-schedule-tracker -f

# Docker logs
docker logs rebinmas-schedule-tracker -f
```

### Health Check

Buat script `health-check.sh`:

```bash
#!/bin/bash
curl -f http://localhost:3000/api/health || exit 1
```

### Backup Database

```bash
# Backup SQL Server database via SQL Gateway API
curl -X POST http://your-gateway-url:8001/v1/backup \
  -H "x-api-key: YOUR_TOKEN"
```

---

## Security Checklist

- [ ] `NODE_ENV=production` di-set
- [ ] HTTPS enabled dengan SSL certificate
- [ ] API_TOKEN dirotasi secara regular
- [ ] SQL Gateway tidak accessible dari publik tanpa authentication
- [ ] Firewall configured dengan benar
- [ ] Browser security headers di-set (di nginx)
- [ ] SQL injection protection (parameterized queries)
- [ ] Rate limiting diimplementasikan
- [ ] Log monitoring di-setup

---

## Contact & Support

- SQL Gateway API Docs: `dokumentasi/api_query.md`
- Login Checklist: `PRODUCTION_LOGIN_CHECKLIST.md`
- Test Connection Script: `scripts/test-production-connection.js`

---

## Version History

| Version | Date | Changes |
|---------|------|----------|
| 1.0 | 2026-02-14 | Initial documentation |
