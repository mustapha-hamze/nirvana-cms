import type { AuthUser } from '../store/authSlice'

// Mirrors the server's userIsAppAdmin: true only for SuperAdmin (any application)
// or a WebSiteAdmin assigned to applicationId — excludes ContentCreator/WebsiteUser.
// Use to gate actions reserved to app admins (delete, publish/unpublish, remove translation).
export function isAppAdmin(user: AuthUser | null, applicationId: string): boolean {
  if (!user) return false
  if (user.role === 'SuperAdmin') return true
  if (user.role !== 'WebSiteAdmin') return false
  return user.applications.some((a) => a._id === applicationId)
}
