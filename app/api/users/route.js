import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAuth } from '@/lib/auth.js'
import { getDb, getUsers } from '@/lib/db.js'

export async function GET(request) {
  const auth = await requireAuth(request, ['admin', 'lead'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  return NextResponse.json({ users: getUsers(db) })
}

export async function POST(request) {
  const auth = await requireAuth(request, ['admin'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id, name, role, groupId, password, email } = await request.json()

  if (!id?.trim() || !name?.trim() || !password) {
    return NextResponse.json({ error: 'id, name and password are required' }, { status: 400 })
  }
  if (!['admin', 'lead', 'agent'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (!cleanId) return NextResponse.json({ error: 'Invalid username' }, { status: 400 })

  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(cleanId)
  if (existing) return NextResponse.json({ error: 'Username already exists' }, { status: 409 })

  const hash = await bcrypt.hash(String(password).slice(0, 256), 10)
  db.prepare(
    'INSERT INTO users (id, name, role, group_id, password_hash, email) VALUES (?,?,?,?,?,?)'
  ).run(cleanId, name.trim(), role, groupId || null, hash, email?.trim() || null)

  const user = db.prepare('SELECT id,name,role,group_id,email,active,created_at FROM users WHERE id = ?').get(cleanId)
  return NextResponse.json({ user }, { status: 201 })
}
