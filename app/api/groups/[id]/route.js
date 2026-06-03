import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb } from '@/lib/db.js'

export async function PUT(request, { params }) {
  const auth = await requireAuth(request, ['admin'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  const group = db.prepare('SELECT id FROM groups WHERE id = ?').get(params.id)
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, color, email } = await request.json()
  const updates = []
  const values = []

  if (name  !== undefined) { updates.push('name = ?');  values.push(name.trim()) }
  if (color !== undefined) { updates.push('color = ?'); values.push(color) }
  if (email !== undefined) { updates.push('email = ?'); values.push(email?.trim() || null) }

  if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  values.push(params.id)
  db.prepare(`UPDATE groups SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  const updated = db.prepare('SELECT * FROM groups WHERE id = ?').get(params.id)
  updated.members = db.prepare('SELECT id, name FROM users WHERE group_id = ? AND active = 1').all(params.id)
  return NextResponse.json({ group: updated })
}

export async function DELETE(request, { params }) {
  const auth = await requireAuth(request, ['admin'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  const group = db.prepare('SELECT id FROM groups WHERE id = ?').get(params.id)
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Unassign users and customers before deleting
  db.prepare('UPDATE users SET group_id = NULL WHERE group_id = ?').run(params.id)
  db.prepare('UPDATE customers SET group_id = NULL WHERE group_id = ?').run(params.id)
  db.prepare('DELETE FROM groups WHERE id = ?').run(params.id)
  return NextResponse.json({ ok: true })
}
