import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb, getTicketById } from '@/lib/db.js'

export async function GET(request, { params }) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = await getDb()
  const ticket = await getTicketById(db, params.id)
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (auth.user.role === 'agent' && ticket.group_id !== auth.user.group_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json({ ticket })
}

export async function PUT(request, { params }) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = await getDb()
  const ticket = await db.queryOne('SELECT * FROM tickets WHERE id = ?', [params.id])
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (auth.user.role === 'agent' && ticket.group_id !== auth.user.group_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { status, priority, groupId, assigneeId, subject } = await request.json()
  const updates = [], values = []
  const now = new Date().toISOString()

  if (status     !== undefined) { updates.push('status = ?');      values.push(status) }
  if (priority   !== undefined) { updates.push('priority = ?');    values.push(priority) }
  if (subject    !== undefined) { updates.push('subject = ?');     values.push(subject.trim()) }
  if (groupId    !== undefined) { updates.push('group_id = ?');    values.push(groupId) }
  if (assigneeId !== undefined) { updates.push('assignee_id = ?'); values.push(assigneeId) }

  if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  updates.push('updated_at = ?')
  values.push(now, params.id)

  await db.execute(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`, values)
  return NextResponse.json({ ticket: await getTicketById(db, params.id) })
}

export async function DELETE(request, { params }) {
  const auth = await requireAuth(request, ['admin', 'lead'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = await getDb()
  const ticket = await db.queryOne('SELECT id FROM tickets WHERE id = ?', [params.id])
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.execute('DELETE FROM tickets WHERE id = ?', [params.id])
  return NextResponse.json({ ok: true })
}
