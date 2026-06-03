import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb, getGroups } from '@/lib/db.js'

export async function GET(request) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  const groups = getGroups(db)

  // Attach member list to each group
  const withMembers = groups.map(g => ({
    ...g,
    members: db.prepare('SELECT id, name FROM users WHERE group_id = ? AND active = 1 ORDER BY name').all(g.id),
  }))

  return NextResponse.json({ groups: withMembers })
}

export async function POST(request) {
  const auth = await requireAuth(request, ['admin'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { name, color, email } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const db = getDb()
  const result = db.prepare(
    'INSERT INTO groups (name, color, email) VALUES (?,?,?)'
  ).run(name.trim(), color || '#6366f1', email?.trim() || null)

  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(result.lastInsertRowid)
  group.members = []
  return NextResponse.json({ group }, { status: 201 })
}
