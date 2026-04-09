'use client'

// useAuthListener is mounted once at the app root via AuthProvider.
// DO NOT call it here — a second instance sets isLoading=true, which causes
// the admin layout (useAuthGuard) to unmount this page, which triggers the
// useEffect cleanup (cancelled=true), which prevents the finally block from
// ever calling setLoading(false) → permanent loading deadlock.
// Auth gating is handled entirely by app/admin/layout.tsx via useAuthGuard.

import { OrganizationHome } from '@/components/organization/OrganizationHome'

export default function AdminPage() {
  return <OrganizationHome />
}
