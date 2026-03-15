# 🏆 THE GAFFER — PWA Sports Management App

> Dominate the field. Built with Next.js 14, Firebase, and Framer Motion.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up Firebase credentials
cp .env.example .env.local
# → Edit .env.local with your Firebase config

# 3. Run in development
npm run dev

# 4. Build for production (generates service worker)
npm run build && npm start
```

---

## 🔥 Firebase Setup (Required)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project → **"gaffer-app"**
3. Enable **Authentication** → Sign-in methods:
   - ✅ Email/Password
   - ✅ Google
4. Go to **Project Settings → Your Apps → Web App**
5. Copy the config object into your `.env.local`

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## 📁 Project Structure

```
/app
  /page.tsx                    ← Landing page (browser-only, shows install CTA)
  /layout.tsx                  ← Root layout with fonts + PWAProvider
  /globals.css                 ← Global styles + Tailwind

  /onboarding
    /splash/page.tsx           ← Splash screen (auto-transitions after 2s)
    /welcome/page.tsx          ← Hero screen ("DOMINATE THE FIELD")
    /role-select/page.tsx      ← Personal vs Organization card selection

  /auth
    /login/page.tsx            ← Sign In (email + Google)
    /signup/page.tsx           ← Sign Up (email + Google + gender)
    /forgot-password/page.tsx  ← Password reset

  /app
    /layout.tsx                ← Protected PWA layout + bottom nav
    /dashboard/page.tsx        ← Personal dashboard
    /profile/page.tsx          ← User profile
    /settings/page.tsx         ← App settings

  /admin/page.tsx              ← Organization admin dashboard

/components
  GafferLogo.tsx               ← Animated orange gradient logo
  GradientButton.tsx           ← Primary/outline/ghost/google buttons
  AuthInput.tsx                ← Dark input with password toggle
  SelectInput.tsx              ← Styled dropdown
  RoleCard.tsx                 ← Glassmorphism role selection card
  AuthLayout.tsx               ← Layout wrapper for auth screens
  AccountInfoModal.tsx         ← Role info bottom sheet modal
  IOSInstallModal.tsx          ← iOS step-by-step install instructions
  PWAProvider.tsx              ← SW registration + install prompt capture

/hooks
  useAuthListener.ts           ← Syncs Firebase auth to Zustand store
  usePWAInstall.ts             ← PWA install prompt management
  usePWASetup.ts               ← Service worker registration

/lib
  firebase.ts                  ← Firebase app init + auth helpers
  pwa.ts                       ← isStandalone() + install utilities
  schemas.ts                   ← Zod validation schemas

/store
  authStore.ts                 ← Zustand auth state + actions

/types
  index.ts                     ← TypeScript type definitions

/public
  manifest.json                ← PWA manifest
  sw.js                        ← Custom service worker
  /icons                       ← PWA icons (all sizes)
```

---

## 📱 PWA Architecture

### Standalone Detection
```typescript
// lib/pwa.ts
export const isStandalone = (): boolean => {
  const css = window.matchMedia('(display-mode: standalone)').matches
  const ios = (navigator as any).standalone === true
  const android = document.referrer.includes('android-app://')
  return css || ios || android
}
```

### Guard Pattern (used in every protected page)
```typescript
useEffect(() => {
  if (!isStandalone()) router.replace('/')   // → Landing page
}, [router])
```

### User Flow
```
Browser Visit
└── Landing Page (/ )
    ├── Install CTA → [User installs PWA]
    └── PWA Opens → /onboarding/splash
        └── /onboarding/welcome
            ├── Get Started → /onboarding/role-select
            │   └── Select Role → /auth/signup → /app/dashboard OR /admin
            └── Login → /auth/login → /app/dashboard OR /admin
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#0A0C10` |
| Surface | `#131720` |
| Card | `#1A1F2E` |
| Border | `#252D3D` |
| Orange | `#FF6B00` |
| Red | `#E53000` |
| Gradient | `#FF6B00 → #CC2200` |
| Font Display | Barlow Condensed (700–900) |
| Font Body | Barlow (400–600) |

---

## 🖼️ Required Images

Place these in `/public/images/`:

| File | Usage |
|------|-------|
| `hero-bg.jpg` | Welcome screen background (portrait, dark) |
| `personal-card.jpg` | Personal role card image |
| `org-card.jpg` | Organization role card image |
| `personal-preview.jpg` | Personal account modal preview |
| `org-preview.jpg` | Organization account modal preview |

> **Tip:** Use the provided `WhatsApp_Image_2026-03-14_at_5_48_30_PM.jpeg` as `hero-bg.jpg`

---

## 🚀 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard:
# Project → Settings → Environment Variables
# Add all NEXT_PUBLIC_FIREBASE_* vars
```

> ⚠️ PWA service workers only work in production (`npm run build`).
> In development (`npm run dev`), the SW is disabled to avoid caching issues.

---

## 🔒 Security Notes

- Firebase Auth handles all token management
- Zustand store persists only `role` to localStorage (not the user object)
- Firebase SDK reads the session from IndexedDB automatically
- All protected routes double-check both `isStandalone()` and `isAuthenticated`

---

## 🧩 Adding Real Images

```bash
# Copy the uploaded hero image to public
cp /path/to/your/image.jpg public/images/hero-bg.jpg
```

Or update the CSS background-image in `welcome/page.tsx` to use any sports image.

---

Built with ❤️ for The GAFFER
