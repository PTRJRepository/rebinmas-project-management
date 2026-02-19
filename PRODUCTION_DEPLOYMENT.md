# 🚀 Production Deployment Guide

## Panduan Deployment untuk Production Server

### ⚠️ PENTING: Masalah Login di Production

Jika Anda mengalami masalah login di production server (berbeda dengan development), ikuti panduan ini.

---

## 📋 Prerequisites

1. **Production server** (Windows/Linux)
2. **Node.js 18+** atau **Bun** terinstall
3. **SQL Gateway API** accessible dari production server
4. **HTTPS** (recommended untuk production)

---

## 🔧 Setup Production

### 1. Clone Repository

```bash
cd "D:\Gawean Rebinmas\Schedule Tracker\schedule-tracker"
git pull origin master
```

### 2. Install Dependencies

```bash
# Menggunakan npm
npm install

# ATAU menggunakan bun
bun install
```

### 3. Setup Environment Variables

```bash
# Copy example file
cp .env.production.example .env.production
```

### 4. Edit `.env.production`

**WAJIB DIUBAH:**

```env
NODE_ENV=production
USE_SQL_SERVER=true

# GANTI ke URL SQL Gateway production Anda
API_QUERY_URL=http://10.0.0.110:8001

# GANTI ke production API token
API_TOKEN=your-production-api-token-here

# PENTING: Set domain untuk cookie session
# Contoh:
COOKIE_DOMAIN=.yourdomain.com
# ATAU untuk IP address:
# COOKIE_DOMAIN=192.168.1.100
```

**OPSIONAL:**

```env
# Session duration (default: 7 days)
SESSION_MAX_AGE=7

# App URL (untuk redirects)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 🔍 Troubleshooting Login Issues

### Masalah Umum & Solusi

#### 1. Login Berhasil Tapi Session Hilang Setelah Redirect

**Penyebab:** Cookie domain tidak di-set dengan benar

**Solusi:**
```env
# Di .env.production
COOKIE_DOMAIN=.yourdomain.com
```

**Contoh:**
- Jika app di `app.yourdomain.com`
- Set `COOKIE_DOMAIN=.yourdomain.com` (dengan titik di depan)
- Cookie akan accessible di semua subdomain

#### 2. Cookie Tidak Tersimpan

**Penyebab:** 
- HTTPS tidak aktif tapi `secure` flag aktif
- Domain mismatch

**Solusi:**
```bash
# Check jika HTTPS aktif
# Di development, gunakan HTTP
# Di production, gunakan HTTPS

# Check cookie di browser:
# F12 > Application > Cookies
# Lihat jika session cookie ada
```

#### 3. SQL Gateway Tidak Terhubung

**Penyebab:**
- API_QUERY_URL salah
- SQL Gateway tidak accessible dari production server

**Solusi:**
```bash
# Test koneksi dari production server
curl http://10.0.0.110:8001/health

# Response yang diharapkan:
# {"status":"ok"}
```

#### 4. API Token Invalid

**Penyebab:** API_TOKEN tidak valid atau expired

**Solusi:**
```bash
# Test API token
curl -X POST http://10.0.0.110:8001/v1/query \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-token" \
  -d '{"sql":"SELECT 1","server":"SERVER_PROFILE_1","database":"extend_db_ptrj"}'
```

---

## 📝 Debugging Steps

### 1. Check Server Logs

Saat running production server, lihat logs untuk:

```
[setSession] Configuration: {...}
[setSession] Session created successfully for: user@example.com
[getSession] Session found for: user@example.com
```

### 2. Check Browser Console

Buka DevTools (F12) dan lihat:

**Console Tab:**
```javascript
// Logs yang diharapkan:
[createTask] Input: {...}
[createTask] Success: {...}
[setSession] Configuration: {...}
```

**Application Tab > Cookies:**
```
Name: session
Value: {"token":"...", "userId":"...", "email":"...", ...}
Domain: .yourdomain.com
Path: /
Secure: true (jika HTTPS)
HttpOnly: true
```

### 3. Test Login Flow

```bash
# 1. Start production server
npm run start
# ATAU
bun run start

# 2. Buka browser ke http://localhost:3000/auth/login

# 3. Login dengan user yang ada

# 4. Check jika redirect ke /projects berhasil

# 5. Check jika user info muncul di header
```

---

## 🔐 Security Best Practices

### 1. Environment Variables

- ✅ JANGAN commit `.env.production` ke git
- ✅ Gunakan strong API token
- ✅ Rotate token secara berkala

### 2. HTTPS

- ✅ Gunakan HTTPS di production
- ✅ Cookie `secure` flag akan otomatis aktif
- ✅ Redirect HTTP ke HTTPS

### 3. Cookie Configuration

```env
# Untuk single domain
COOKIE_DOMAIN=yourdomain.com

# Untuk multiple subdomains
COOKIE_DOMAIN=.yourdomain.com

# Untuk IP address
COOKIE_DOMAIN=192.168.1.100
```

---

## 🚀 Build & Run Production

### Menggunakan Next.js Standalone

```bash
# Build
npm run build

# Start production server
npm run start
```

### Menggunakan PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Build first
npm run build

# Start with PM2
pm2 start npm --name "schedule-tracker" -- start

# Save PM2 config
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Menggunakan Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY .next .next
COPY public public
COPY .env.production .env.production

EXPOSE 3000

CMD ["npm", "start"]
```

---

## 📊 Monitoring

### Check Server Health

```bash
# Check jika server running
curl http://localhost:3000

# Check SQL Gateway
curl http://10.0.0.110:8001/health
```

### Check Logs

```bash
# PM2 logs
pm2 logs schedule-tracker

# Next.js logs (jika run manual)
# Lihat di terminal tempat server running
```

---

## ❓ FAQ

### Q: Login berhasil tapi langsung logout?
**A:** Check `COOKIE_DOMAIN` di `.env.production`. Harus sesuai dengan domain app.

### Q: Error "Failed to fetch" saat login?
**A:** SQL Gateway tidak accessible. Check `API_QUERY_URL` dan network connectivity.

### Q: Session cookie tidak muncul di browser?
**A:** 
1. Check jika `NODE_ENV=production`
2. Check jika menggunakan HTTPS (untuk production)
3. Check browser settings (block third-party cookies?)

### Q: Bagaimana cara test di production tanpa HTTPS?
**A:** 
- Untuk testing saja, set `COOKIE_DOMAIN` ke IP address
- Example: `COOKIE_DOMAIN=192.168.1.100`
- Tapi untuk production WAJIB HTTPS!

---

## 📞 Support

Jika masih ada masalah:

1. **Check logs** - Server logs dan browser console
2. **Test SQL Gateway** - `curl http://API_URL/health`
3. **Verify env vars** - Pastikan `.env.production` sudah benar
4. **Check cookies** - F12 > Application > Cookies

---

**Last Updated:** 19 Februari 2026  
**Version:** 1.0.0
