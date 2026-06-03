import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb } from '@/lib/db.js'

export async function PUT(request, { params }) {
  const auth = await requireAuth(request, ['admin'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = await getDb()
  if (!await db.queryOne('SELECT id FROM groups WHERE id = ?', [params.id])) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { name, color, email } = await request.json()
  const updates = [], values = []

  if (name  !== undefined) { updates.push('name = ?');  values.push(name.trim()) }
  if (color !== undefined) { updates.push('color = ?'); values.push(color) }
  if (email !== undefined) { updates.push('email = ?'); values.push(email?.trim() || null) }

  if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  values.push(params.id)
  await db.execute(`UPDATE groups SET ${updates.join(', ')} WHERE id = ?`, values)

  const group = await db.queryOne('SELECT * FROM groups WHERE id = ?', [params.id])
  group.members = await db.query('SELECT id, name FROM users WHERE group_id = ? AND active = 1', [params.id])
  return NextResponse.json({ group })
}

export async function DELETE(request, { params }) {
  const auth = await requireAuth(request, ['admin'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = await getDb()
  if (!await db.queryOne('SELECT id FROM groups WHERE id = ?', [params.id])) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.execute('UPDATE users SET group_id = NULL WHERE group_id = ?', [params.id])
  await db.execute('UPDATE customers SET group_id = NULL WHERE group_id = ?', [params.id])
  await db.execute('DELETE FROM groups WHERE id = ?', [params.id])
  return NextResponse.json({ ok: true })
}
