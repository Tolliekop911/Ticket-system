import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb } from '@/lib/db.js'

export async function PUT(request, { params }) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  const email = db.prepare('SELECT * FROM emails WHERE id = ?').get(params.id)
  if (!email) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (auth.user.role === 'agent' && email.group_id !== auth.user.group_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { read, starred, groupId } = await request.json()
  const updates = []
  const values = []

  if (read    !== undefined) { updates.push('read = ?');     values.push(read ? 1 : 0) }
  if (starred !== undefined) { updates.push('starred = ?');  values.push(starred ? 1 : 0) }
  if (groupId !== undefined) { updates.push('group_id = ?'); values.push(groupId) }

  if (updates.length > 0) {
    values.push(params.id)
    db.prepare(`UPDATE emails SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  }

  return NextResponse.json({ email: db.prepare('SELECT * FROM emails WHERE id = ?').get(params.id) })
}

export async function DELETE(request, { params }) {
  const auth = await requireAuth(request, ['admin', 'lead'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  const email = db.prepare('SELECT id FROM emails WHERE id = ?').get(params.id)
  if (!email) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  db.prepare('DELETE FROM emails WHERE id = ?').run(params.id)
  return NextResponse.json({ ok: true })
}
