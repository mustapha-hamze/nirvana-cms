import jwt from 'jsonwebtoken'
import type { Request, Response } from 'express'
import User from '../models/User.js'
import { ROLES } from '../constants/roles.js'

function signToken(userId: unknown, role: string) {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions,
  )
}

function formatUser(user: any) {
  const obj = user.toObject ? user.toObject() : { ...user }
  delete obj.password
  return obj
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' })
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select('+password')
    .populate('applications', 'name')

  if (!user) return res.status(401).json({ message: 'Invalid credentials' })

  if (user.role === ROLES.WEBSITE_USER) {
    return res.status(403).json({ message: 'Access denied' })
  }

  if (user.status === 'inactive') {
    return res.status(403).json({ message: 'Account is inactive' })
  }

  const valid = await user.comparePassword(password)
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' })

  const token = signToken(user._id, user.role)

  res.json({ token, user: formatUser(user) })
}

export async function me(req: Request, res: Response) {
  res.json(formatUser(req.user))
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'currentPassword and newPassword are required' })
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'newPassword must be at least 8 characters' })
  }

  const user = await User.findById(req.user!._id).select('+password')
  if (!user) return res.status(404).json({ message: 'User not found' })

  const valid = await user.comparePassword(currentPassword)
  if (!valid) return res.status(401).json({ message: 'Current password is incorrect' })

  user.password = newPassword
  await user.save()

  const token = signToken(user._id, user.role)

  res.json({ message: 'Password updated', token })
}
