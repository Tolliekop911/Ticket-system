import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb, getTicketById } from '@/lib/db.js'

export async function GET(request, { params }) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  const ticket = getTicketById(db, params.id)
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Agents may only access tickets in their group
  if (auth.user.role === 'agent' && ticket.group_id !== auth.user.group_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ ticket })
}

export async function PUT(request, { params }) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(params.id)
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (auth.user.role === 'agent' && ticket.group_id !== auth.user.group_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { status, priority, groupId, assigneeId, subject } = await request.json()
  const now = new Date().toISOString()

  const updates = []
  const values = []
  if (status    !== undefined) { updates.push('status = ?');      values.push(status) }
  if (priority  !== undefined) { updates.push('priority = ?');    values.push(priority) }
  if (subject   !== undefined) { updates.push('subject = ?');     values.push(subject.trim()) }
  if (groupId   !== undefined) { updates.push('group_id = ?');    values.push(groupId) }
  if (assigneeId !== undefined){ updates.push('assignee_id = ?'); values.push(assigneeId) }

  if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  updates.push('updated_at = ?')
  values.push(now, params.id)

  db.prepare(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  return NextResponse.json({ ticket: getTicketById(db, params.id) })
}

export async function DELETE(request, { params }) {
  const auth = await requireAuth(request, ['admin', 'lead'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  const ticket = db.prepare('SELECT id FROM tickets WHERE id = ?').get(params.id)
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  db.prepare('DELETE FROM tickets WHERE id = ?').run(params.id)
  return NextResponse.json({ ok: true })
}
