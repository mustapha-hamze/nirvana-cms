import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { ROLES } from '../constants/roles.js'

export async function authenticate(req, res, next) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  const token = header.slice(7)

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }

  const user = await User.findById(payload.sub).populate('applications', 'name')
  if (!user) return res.status(401).json({ message: 'User no longer exists' })
  if (user.status === 'inactive') return res.status(401).json({ message: 'Account is inactive' })

  req.user = user
  next()
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' })
    }
    next()
  }
}

export const requireSuperAdmin = authorize(ROLES.SUPER_ADMIN)
export const requireAdmin = authorize(ROLES.SUPER_ADMIN, ROLES.WEBSITE_ADMIN)
export const requireStaff = authorize(ROLES.SUPER_ADMIN, ROLES.WEBSITE_ADMIN, ROLES.CONTENT_CREATOR)

// True for SuperAdmin (any application) or a staff user assigned to applicationId.
export function userCanAccessApplication(user, applicationId) {
  if (user.role === ROLES.SUPER_ADMIN) return true
  if (!applicationId) return false
  return user.applications.some((app) => app._id.toString() === applicationId.toString())
}

// Stricter than userCanAccessApplication: true only for SuperAdmin (any application)
// or a WebSiteAdmin assigned to applicationId — excludes ContentCreator/WebsiteUser.
// Use for actions reserved to app admins (delete, publish/unpublish, remove translation).
export function userIsAppAdmin(user, applicationId) {
  if (user.role === ROLES.SUPER_ADMIN) return true
  if (user.role !== ROLES.WEBSITE_ADMIN) return false
  if (!applicationId) return false
  return user.applications.some((app) => app._id.toString() === applicationId.toString())
}

// Allows SuperAdmin (any application) or a staff user assigned to the :id application.
export function requireAppAccess(req, res, next) {
  if (!userCanAccessApplication(req.user, req.params.id)) {
    return res.status(403).json({ message: 'Insufficient permissions' })
  }
  next()
}
