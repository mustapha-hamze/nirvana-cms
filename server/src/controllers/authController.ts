import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import mongoose from 'mongoose'
import type { Request, Response } from 'express'
import User from '../models/User.js'
import RefreshToken from '../models/RefreshToken.js'
import { ROLES } from '../constants/roles.js'

// Same message for every refresh-rejection reason (bad signature, expired,
// revoked, unknown user, inactive user) — a distinct message per case would
// let a caller probe which of those applies to a given token.
const INVALID_REFRESH_MESSAGE = 'Invalid or expired refresh token'

function signAccessToken(userId: unknown, role: string) {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions,
  )
}

function hashRefreshToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Signs a new refresh JWT for userId and persists a hashed, revocable record
// of it (see models/RefreshToken.ts) — the JWT's own signature/expiry isn't
// enough on its own to end a session early (logout, password change,
// deactivation), so every /refresh call is also checked against this record.
async function issueRefreshToken(userId: unknown): Promise<string> {
  const jti = crypto.randomUUID()
  const token = jwt.sign(
    { sub: userId, jti },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions,
  )
  const decoded = jwt.decode(token) as jwt.JwtPayload
  await RefreshToken.create({
    user: userId as mongoose.Types.ObjectId,
    tokenHash: hashRefreshToken(token),
    expiresAt: new Date((decoded.exp as number) * 1000),
  })
  return token
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

  const token = signAccessToken(user._id, user.role)
  const refreshToken = await issueRefreshToken(user._id)

  res.json({ token, refreshToken, user: formatUser(user) })
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body

  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(401).json({ message: INVALID_REFRESH_MESSAGE })
  }

  let payload: jwt.JwtPayload
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as jwt.JwtPayload
  } catch {
    return res.status(401).json({ message: INVALID_REFRESH_MESSAGE })
  }

  const stored = await RefreshToken.findOne({ tokenHash: hashRefreshToken(refreshToken) })
  if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
    return res.status(401).json({ message: INVALID_REFRESH_MESSAGE })
  }

  const user = await User.findById(payload.sub).populate('applications', 'name')
  if (!user || user.status === 'inactive') {
    return res.status(401).json({ message: INVALID_REFRESH_MESSAGE })
  }

  // Rotate: this refresh token is single-use. Revoking it here means a
  // leaked-and-replayed refresh token stops working the moment the
  // legitimate client refreshes again.
  stored.revokedAt = new Date()
  await stored.save()

  const newAccessToken = signAccessToken(user._id, user.role)
  const newRefreshToken = await issueRefreshToken(user._id)

  res.json({ token: newAccessToken, refreshToken: newRefreshToken })
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body

  if (refreshToken && typeof refreshToken === 'string') {
    await RefreshToken.updateOne(
      { tokenHash: hashRefreshToken(refreshToken) },
      { $set: { revokedAt: new Date() } },
    )
  }

  res.status(204).send()
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

  // A changed password should invalidate every existing session's refresh
  // token, not just issue a new access token for this one request — otherwise
  // a device that leaked the old password could keep silently refreshing.
  await RefreshToken.updateMany(
    { user: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  )

  const token = signAccessToken(user._id, user.role)
  const refreshToken = await issueRefreshToken(user._id)

  res.json({ message: 'Password updated', token, refreshToken })
}
