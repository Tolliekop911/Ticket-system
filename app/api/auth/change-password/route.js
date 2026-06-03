import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAuth } from '@/lib/auth.js'
import { getDb } from '@/lib/db.js'

export async function POST(request) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { currentPassword, newPassword } = await request.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both current and new password required' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  }

  const db = await getDb()
  const user = await db.queryOne('SELECT * FROM users WHERE id = ?', [auth.user.id])
  const valid = await bcrypt.compare(String(currentPassword), user.password_hash)
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })

  const hash = await bcrypt.hash(String(newPassword).slice(0, 256), 10)
  await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, auth.user.id])
  return NextResponse.json({ ok: true })
}
