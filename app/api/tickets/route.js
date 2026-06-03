import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb, getTickets, nextTicketId } from '@/lib/db.js'

export async function GET(request) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  const groupId = auth.user.role === 'agent' ? auth.user.group_id : null
  const tickets = getTickets(db, groupId)

  // Attach messages and notes to each ticket
  const withDetails = tickets.map(t => ({
    ...t,
    messages: db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at').all(t.id),
    notes:    db.prepare('SELECT * FROM ticket_notes    WHERE ticket_id = ? ORDER BY created_at').all(t.id),
  }))

  return NextResponse.json({ tickets: withDetails })
}

export async function POST(request) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const { subject, customer, customerId, fromEmail, groupId, priority, assigneeId, message } = body

  if (!subject?.trim()) return NextResponse.json({ error: 'Subject required' }, { status: 400 })

  const db = getDb()
  const id = nextTicketId(db)
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO tickets (id, subject, customer, customer_id, from_email, group_id, status, priority, assignee_id, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, subject.trim(), customer || null, customerId || null, fromEmail || null,
    groupId || null, 'open', priority || 'medium', assigneeId || null, now, now)

  if (message) {
    db.prepare('INSERT INTO ticket_messages (ticket_id, from_email, body, created_at) VALUES (?,?,?,?)')
      .run(id, fromEmail || 'unknown', message, now)
  }

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id)
  ticket.messages = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ?').all(id)
  ticket.notes    = []

  return NextResponse.json({ ticket }, { status: 201 })
}
