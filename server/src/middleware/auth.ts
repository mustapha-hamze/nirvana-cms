import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import User from '../models/User.js'
import type { UserDoc } from '../models/User.js'
import { ROLES } from '../constants/roles.js'

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  const token = header.slice(7)

  let payload: jwt.JwtPayload | string
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET as string)
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }

  const sub = typeof payload === 'string' ? payload : payload.sub
  const user = await User.findById(sub).populate('applications', 'name')
  if (!user) return res.status(401).json({ message: 'User no longer exists' })
  if (user.status === 'inactive') return res.status(401).json({ message: 'Account is inactive' })

  req.user = user
  next()
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' })
    }
    next()
  }
}

export const requireSuperAdmin = authorize(ROLES.SUPER_ADMIN)
export const requireAdmin = authorize(ROLES.SUPER_ADMIN, ROLES.WEBSITE_ADMIN)
export const requireStaff = authorize(ROLES.SUPER_ADMIN, ROLES.WEBSITE_ADMIN, ROLES.CONTENT_CREATOR)

// True for SuperAdmin (any application) or a staff user assigned to applicationId.
export function userCanAccessApplication(user: UserDoc, applicationId: unknown): boolean {
  if (user.role === ROLES.SUPER_ADMIN) return true
  if (!applicationId) return false
  return user.applications.some((app: any) => app._id.toString() === applicationId.toString())
}

// Stricter than userCanAccessApplication: true only for SuperAdmin (any application)
// or a WebSiteAdmin assigned to applicationId — excludes ContentCreator/WebsiteUser.
// Use for actions reserved to app admins (delete, publish/unpublish, remove translation).
export function userIsAppAdmin(user: UserDoc, applicationId: unknown): boolean {
  if (user.role === ROLES.SUPER_ADMIN) return true
  if (user.role !== ROLES.WEBSITE_ADMIN) return false
  if (!applicationId) return false
  return user.applications.some((app: any) => app._id.toString() === applicationId.toString())
}

// Allows SuperAdmin (any application) or a staff user assigned to the :id application.
export function requireAppAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !userCanAccessApplication(req.user, req.params.id)) {
    return res.status(403).json({ message: 'Insufficient permissions' })
  }
  next()
}
