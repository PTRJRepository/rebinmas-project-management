# Production Login Troubleshooting Checklist

If you are experiencing login issues when the app is running on a production server or accessed from a different computer, please check the following:

## 1. HTTPS vs HTTP (Cookie Security)
By default, production apps often try to set "Secure" cookies which **only work over HTTPS**.
- **Issue**: If your production server uses `http://` (not `https://`), the browser will reject the session cookie.
- **Fix**: In your `.env` file, ensure `SESSION_SECURE=false`.
- **Note**: I have updated `lib/auth.ts` to respect this setting.

## 2. API Gateway Accessibility
The app connects to SQL Server via `http://10.0.0.110:8001`.
- **Issue**: Your production server might not have network access to this IP address (different VLAN, firewall, etc.).
- **Test**: From your production server terminal, run: `ping 10.0.0.110` or `curl http://10.0.0.110:8001/health`.
- **Fix**: Ensure the production server can reach the API Gateway.

## 3. Environment Variables
Ensure these are set correctly in your production `.env`:
```env
# Must be accessible from the SERVER where the app is running
API_QUERY_URL="http://10.0.0.110:8001"
API_TOKEN="2a993486e7a448474de66bfaea4adba7a99784defbcaba420e7f906176b94df6"

# Set to false if NOT using HTTPS in production
SESSION_SECURE=false

# Leave EMPTY if accessing via IP address or different subdomains
# COOKIE_DOMAIN=
```

## 4. Browser "SameSite" Policy
If you are accessing the app via an IP address (e.g., `http://192.168.1.50:3000`), some browsers are strict about cookies.
- I have set `sameSite: 'lax'` in `lib/auth.ts` which is the most compatible setting for cross-origin/IP access.

## 5. Check Server Logs
Check the terminal where the app is running. Look for:
- `[setSession] Configuration`: Check if `secure` is `true` while you are using `http`.
- `SqlGatewayError`: This means the app cannot talk to the database.
