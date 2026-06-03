import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb } from '@/lib/db.js'

export async function POST(request, { params }) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { body } = await request.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Note body required' }, { status: 400 })

  const db = getDb()
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(params.id)
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  if (auth.user.role === 'agent' && ticket.group_id !== auth.user.group_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date().toISOString()
  const result = db.prepare(
    'INSERT INTO ticket_notes (ticket_id, author, body, created_at) VALUES (?,?,?,?)'
  ).run(params.id, auth.user.name, body.trim(), now)

  const note = db.prepare('SELECT * FROM ticket_notes WHERE id = ?').get(result.lastInsertRowid)
  return NextResponse.json({ note }, { status: 201 })
}
