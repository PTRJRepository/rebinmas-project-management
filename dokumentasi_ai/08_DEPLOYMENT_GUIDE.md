# 🚀 Deployment Guide

> **Version**: 1.0  
> **Last Updated**: 2026-02-17

---

## 1. Prerequisites

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **Node.js** | 18.x | 20.x |
| **Runtime** | npm | Bun (faster) |
| **Process Manager** | — | PM2 |
| **Reverse Proxy** | — | nginx |
| **SSL** | — | Let's Encrypt |
| **Network** | Access to SQL Gateway | Same network segment |

---

## 2. Environment Variables

### Development (`.env`)

```env
DATABASE_URL="file:../dev.db"
USE_SQL_SERVER="true"
API_TOKEN="2a993486e7a448474de66bfaea4adba7a99784defbcaba420e7f906176b94df6"
API_QUERY_URL="http://10.0.0.110:8001"
```

### Production (`.env.production`)

```env
NODE_ENV=production
USE_SQL_SERVER=true
API_QUERY_URL=http://your-sql-gateway-url:8001
API_TOKEN=your-production-api-token
NEXT_PUBLIC_APP_URL=https://yourdomain.com
SESSION_MAX_AGE=7              # Days
```

> ⚠️ **NEVER** use local IPs (10.x, 192.168.x) in production unless the server and gateway are on the same network.

---

## 3. Build & Run

### Development

```bash
# Install dependencies
bun install

# Start dev server (with Webpack)
bun run dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
bun run build

# Start production server (listens on 0.0.0.0)
bun run start
```

---

## 4. Deployment Methods

### Method 1: PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start node_modules/.bin/next --name rebinmas -- start -p 3000

# Save configuration
pm2 save

# Auto-restart on reboot
pm2 startup

# Useful commands
pm2 status              # Check status
pm2 logs rebinmas       # View logs
pm2 restart rebinmas    # Restart
pm2 stop rebinmas       # Stop
```

### Method 2: systemd Service

Create `/etc/systemd/system/rebinmas.service`:

```ini
[Unit]
Description=Rebinmas Schedule Tracker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/rebinmas-schedule-tracker
EnvironmentFile=/var/www/rebinmas-schedule-tracker/.env.production
ExecStart=/usr/bin/node node_modules/.bin/next start -p 3000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable rebinmas
sudo systemctl start rebinmas
```

### Method 3: Docker

```bash
docker build -f Dockerfile.production -t rebinmas .
docker run -d -p 3000:3000 --env-file .env.production rebinmas
```

---

## 5. nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

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
}
```

---

## 6. Connection Test

```bash
# Test SQL Gateway connectivity
bun run test:prod
# or
npm run test:connection
```

Expected output:
```
✓ PASS - healthCheck
✓ PASS - serverList
✓ PASS - userQuery
✓ PASS - loginFlow
✓ PASS - environment
ALL TESTS PASSED!
```

---

## 7. Security Checklist

- [ ] `NODE_ENV=production` is set
- [ ] HTTPS enabled with SSL certificate
- [ ] API_TOKEN rotated regularly
- [ ] SQL Gateway not publicly accessible without auth
- [ ] Firewall configured
- [ ] Security headers set in nginx
- [ ] Default passwords changed
- [ ] Rate limiting implemented

---

## 8. Monitoring

```bash
# PM2 logs
pm2 logs rebinmas

# systemd logs
journalctl -u rebinmas -f

# Docker logs
docker logs rebinmas -f

# Health check
curl -f http://localhost:3000/api/health
```
