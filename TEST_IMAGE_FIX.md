# Image Loading Fix

## Problem
Images from `http://localhost:4000/assets/barter/a_wood_fire.png` were not loading in the dashboard.

## Solution Applied

1. **Disabled Content-Security-Policy** in Helmet to allow images to load
2. **Added CORS headers** to static file serving
3. **Verified static file serving** is correctly configured

## Changes Made

### `qafela-backend/src/index.ts`
- Disabled CSP: `contentSecurityPolicy: false`
- Disabled CORP: `crossOriginResourcePolicy: false`
- Added CORS headers to static assets middleware

## Action Required

**You need to restart the backend server** for changes to take effect:

```bash
# If using ts-node-dev, it should auto-restart
# Otherwise, stop and restart your server
```

## Testing

After restart, test the image URL:
```bash
curl -I http://localhost:4000/assets/barter/a_wood_fire.png
```

Should return HTTP 200 with proper headers.

## If Images Still Don't Work

1. Check browser console for errors
2. Verify `NEXT_PUBLIC_API_URL` in dashboard `.env.local` is set to `http://localhost:4000`
3. Check if backend server is running on port 4000
4. Verify file exists: `ls assets/barter/a_wood_fire.png`


