import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { getDb, getUserById } from './db.js'

const COOKIE = 'wellyx_session'
const EXPIRY = '24h'

export function signToken(payload) {
  const secret = process.env.JWT_SECRET
  if (!secret || secret === 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_STRING') {
    throw new Error('JWT_SECRET env var is not configured. Set it in .env.local or Vercel environment variables.')
  }
  return jwt.sign(payload, secret, { expiresIn: EXPIRY })
}

export function verifyToken(token) {
  try { return jwt.verify(token, process.env.JWT_SECRET) } catch { return null }
}

export function setAuthCookie(res, token) {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
}

export function clearAuthCookie(res) {
  res.cookies.set(COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' })
}

export async function requireAuth(request, allowedRoles = null) {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return { error: 'Unauthenticated', status: 401 }

  const payload = verifyToken(token)
  if (!payload) return { error: 'Invalid or expired session', status: 401 }

  const db = await getDb()
  const user = await getUserById(db, payload.id)
  if (!user || !user.active) return { error: 'User not found or deactivated', status: 401 }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { error: 'Insufficient permissions', status: 403 }
  }

  const { password_hash, ...safeUser } = user
  return { user: safeUser }
}

export async function checkLoginRateLimit(db, username) {
  const window = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const row = await db.queryOne(
    "SELECT COUNT(*) as n FROM login_attempts WHERE username = ? AND success = 0 AND created_at > ?",
    [username, window]
  )
  return Number(row?.n ?? 0) < 10
}

export async function recordLoginAttempt(db, username, ip, success) {
  await db.execute(
    'INSERT INTO login_attempts (username, ip, success) VALUES (?,?,?)',
    [username, ip || 'unknown', success ? 1 : 0]
  )
}
