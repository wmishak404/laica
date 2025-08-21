# Firebase Domain Setup for Google Sign-In

## Current Error
The Firebase authorized domain error occurs because your current Replit domain is not added to Firebase's authorized domains list.

## Quick Fix

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**
3. **Navigate to**: Authentication → Settings → Authorized domains
4. **Add these domains**:
   - `localhost` (for local development)
   - Your current Replit domain (shown in the browser URL)
   - `*.replit.dev` (for Replit development)
   - `*.replit.app` (for deployed apps)

## Your Current Domain
The current domain is: **`[YOUR_REPLIT_DOMAIN]`**

## Step-by-Step Instructions

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project from the list
3. In the left sidebar, click **Authentication**
4. Click the **Settings** tab (gear icon)
5. Scroll down to **Authorized domains**
6. Click **Add domain**
7. Enter your current domain (visible in browser URL bar)
8. Click **Add**
9. Refresh your app and try Google sign-in again

## Additional Domains to Add
For full functionality, also add:
- `localhost`
- `*.replit.dev`
- `*.replit.app`

This will ensure Google sign-in works in development and production environments.