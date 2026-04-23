### 🏆 THE GAFFER — Modern PWA Sports Management
This README now includes the correct environment variable setup for your new **DigitalOcean Backend** and the **Vercel Frontend**.

```markdown
# 🏆 THE GAFFER — PWA Sports Management
> **Dominate the field.** A high-performance, premium sports management platform built with **Next.js 14**, **Firebase Auth**, and a dedicated **DigitalOcean Backend**.

---

## 🚀 Deployment Status
| Layer | Environment | URL |
| :--- | :--- | :--- |
| **Frontend** | Vercel (PWA) | `https://the-gaffer.com.ng` |
| **Backend** | DigitalOcean (Node/Express) | `https://api.the-gaffer.com.ng` |
| **Database** | MongoDB (Self-Hosted) | Private |
| **Cache** | Redis (Self-Hosted) | Private |

---

## ⚡ Tech Stack
- **Frontend Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Framer Motion (Micro-animations)
- **State Management:** Zustand (Immutable Store)
- **Authentication:** Firebase Auth
- **Validation:** Zod (Type-safe schemas)
- **Form Handling:** React Hook Form
- **PWA:** Custom Service Worker + Manifest.json

---

## 🛠️ Local Development

### 1. Prerequisite Setup
```bash
# Clone the repository
git clone https://github.com/Adefolabi/The-Gaffer--frontend.git
cd the-gaffer-frontend

# Install dependencies
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
# Firebase Config (Get from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Backend Connection
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```

---

## 🏗️ Project Architecture

```
/app
  ├── /auth           # Authentication flows (Login, Signup, Recovery)
  ├── /onboarding     # User entry (Splash, Welcome, Role Selection)
  ├── /app            # Main PWA Dashboard (Protected)
  ├── /admin          # Organization/Club management
  └── layout.tsx      # Global PWA & Font Providers
/components
  ├── /ui             # Premium UI components (GradientButtons, Inputs)
  ├── PWAProvider.tsx # Service Worker & Installation Logic
  └── GafferLogo.tsx  # Brand animations
/store
  └── authStore.ts    # Centralized auth and user profile state
/lib
  ├── firebase.ts     # Firebase initialization
  └── api.ts          # Axios wrapper for backend calls
```

---

## 📱 Progressive Web App (PWA) Features
The GAFFER is designed to be **Installed**, not just visited.
- **Standalone Mode:** Custom navigation bars and layouts for mobile devices.
- **Service Worker:** Offline asset caching for instant load times.
- **Install Flow:** Automatic detection for iOS (Safari) and Android (Chrome) with step-by-step guidance.

---

## 🔒 Security
- **JWT Authentication:** Secure handshakes between Frontend and Node.js backend.
- **CSRF Protection:** Secure cookie handling for refresh tokens.
- **CORS Restricted:** Backend only accepts requests from allowed production domains.

---

## 🎨 Brand Identity
| Element | Hex Code |
| :--- | :--- |
| **Primary Orange** | `#FF6B00` |
| **Deep Red** | `#E53000` |
| **Dark Onyx** | `#0A0C10` |
| **Card Surface** | `#1A1F2E` |

---

Built with ❤️ for **The GAFFER** by **4orge Tech**