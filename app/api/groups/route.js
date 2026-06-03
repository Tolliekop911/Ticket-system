import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb, getGroups } from '@/lib/db.js'

export async function GET(request) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = await getDb()
  const groups = await getGroups(db)

  const withMembers = await Promise.all(groups.map(async g => ({
    ...g,
    members: await db.query('SELECT id, name FROM users WHERE group_id = ? AND active = 1 ORDER BY name', [g.id]),
  })))

  return NextResponse.json({ groups: withMembers })
}

export async function POST(request) {
  const auth = await requireAuth(request, ['admin'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { name, color, email } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const db = await getDb()
  const { lastId } = await db.execute(
    'INSERT INTO groups (name,color,email) VALUES (?,?,?)',
    [name.trim(), color || '#6366f1', email?.trim() || null]
  )

  const group = await db.queryOne('SELECT * FROM groups WHERE id = ?', [lastId])
  group.members = []
  return NextResponse.json({ group }, { status: 201 })
}
