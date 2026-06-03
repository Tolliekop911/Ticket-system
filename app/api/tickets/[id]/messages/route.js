import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb } from '@/lib/db.js'

export async function POST(request, { params }) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { body } = await request.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Message body required' }, { status: 400 })

  const db = getDb()
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(params.id)
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  if (auth.user.role === 'agent' && ticket.group_id !== auth.user.group_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date().toISOString()
  const fromEmail = `${auth.user.id}@wellyx.com`

  const result = db.prepare(
    'INSERT INTO ticket_messages (ticket_id, from_email, body, created_at) VALUES (?,?,?,?)'
  ).run(params.id, fromEmail, body.trim(), now)

  db.prepare('UPDATE tickets SET updated_at = ? WHERE id = ?').run(now, params.id)

  const message = db.prepare('SELECT * FROM ticket_messages WHERE id = ?').get(result.lastInsertRowid)
  return NextResponse.json({ message }, { status: 201 })
}
