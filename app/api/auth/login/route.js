import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb, getUserById } from '@/lib/db.js'
import { signToken, setAuthCookie, checkLoginRateLimit, recordLoginAttempt } from '@/lib/auth.js'

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    const cleanUsername = String(username).toLowerCase().trim().slice(0, 64)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const db = getDb()

    if (!checkLoginRateLimit(db, cleanUsername, ip)) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please wait 15 minutes.' },
        { status: 429 }
      )
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ? AND active = 1').get(cleanUsername)
    const valid = user && await bcrypt.compare(String(password).slice(0, 256), user.password_hash)

    recordLoginAttempt(db, cleanUsername, ip, !!valid)

    if (!valid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    const token = signToken({ id: user.id, role: user.role })
    const { password_hash, ...safeUser } = user

    const res = NextResponse.json({ user: safeUser })
    setAuthCookie(res, token)
    return res
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
