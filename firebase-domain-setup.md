# Firebase Domain Setup for Google Sign-In

## Production Domain: cookwithlaica.com

This guide covers configuring Firebase Authentication to work with your custom domain.

---

## Part 1: Authorize Your Domain

### Step 1: Add Authorized Domains in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **laica-by-wilson**
3. Navigate to: **Authentication → Settings → Authorized domains**
4. Click **Add domain** and add:
   - `cookwithlaica.com`
   - `www.cookwithlaica.com` (if using www)
   - `auth.cookwithlaica.com` (for custom OAuth domain)
   - `localhost` (for local development)
   - `*.replit.dev` (for Replit development)
   - `*.replit.app` (for Replit deployments)

---

## Part 2: Custom OAuth Domain (Optional)

To show `auth.cookwithlaica.com` instead of `laica-by-wilson.firebaseapp.com` during Google sign-in:

### Step 1: Set Up Firebase Hosting

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Hosting**
2. Click **Get started** (if not already set up)
3. Click **Add custom domain**
4. Enter: `auth.cookwithlaica.com`

### Step 2: Configure DNS

At your domain registrar, add:

| Type | Host/Name | Value |
|------|-----------|-------|
| CNAME | `auth` | `laica-by-wilson.web.app` |

Wait for DNS propagation (usually 15-30 minutes, up to 24 hours).

### Step 3: Verify in Firebase

1. Return to Firebase Console → Hosting
2. Click **Verify** for your custom domain
3. Wait for SSL certificate provisioning (can take up to 24 hours)

### Step 4: Update Google Cloud OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services → Credentials**
3. Edit your **OAuth 2.0 Client ID** (Web client)
4. Add to **Authorized JavaScript origins**:
   - `https://cookwithlaica.com`
   - `https://www.cookwithlaica.com`
   - `https://auth.cookwithlaica.com`
5. Add to **Authorized redirect URIs**:
   - `https://auth.cookwithlaica.com/__/auth/handler`

### Step 5: Update Code

Change `authDomain` in the Firebase config:

```javascript
// Before
authDomain: "laica-by-wilson.firebaseapp.com"

// After
authDomain: "auth.cookwithlaica.com"
```

This change is in `client/src/lib/firebase.ts`.

---

## Troubleshooting

### Error: "This domain is not authorized"
- Add the domain to Firebase Authentication → Settings → Authorized domains
- Wait a few minutes for changes to propagate

### Error: "redirect_uri_mismatch"
- Check that `https://auth.cookwithlaica.com/__/auth/handler` is in Authorized redirect URIs
- Ensure exact URL format (https, no trailing slash)

### DNS not verifying
- Wait up to 24 hours for propagation
- Use [Google DNS Checker](https://toolbox.googleapps.com/apps/dig/) to verify records
- Ensure no conflicting CNAME/A records exist

### SSL certificate pending
- Can take up to 24 hours
- Status shows in Firebase Hosting console
- Firebase auto-renews certificates

---

## Current Status

- [x] Domain `auth.cookwithlaica.com` added to Firebase Hosting
- [ ] DNS CNAME record configured (waiting for propagation)
- [ ] Domain verified in Firebase
- [ ] OAuth credentials updated in Google Cloud Console
- [ ] Code updated to use custom authDomain

---

## Quick Reference

| Service | URL |
|---------|-----|
| Firebase Console | https://console.firebase.google.com/ |
| Google Cloud Console | https://console.cloud.google.com/ |
| DNS Checker | https://toolbox.googleapps.com/apps/dig/ |
| Production App | https://cookwithlaica.com |
