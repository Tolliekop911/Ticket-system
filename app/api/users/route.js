import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb, getUsers, createUser } from '@/lib/db.js'

export async function GET(request) {
  const auth = await requireAuth(request, ['admin', 'lead'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = await getDb()
  return NextResponse.json({ users: await getUsers(db) })
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

  const db = await getDb()
  if (await db.queryOne('SELECT id FROM users WHERE id = ?', [cleanId])) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
  }

  const user = await createUser(db, { id: cleanId, name: name.trim(), role, groupId: groupId || null, password, email: email?.trim() || null })
  return NextResponse.json({ user }, { status: 201 })
}
