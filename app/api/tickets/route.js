import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb, getTickets, nextTicketId } from '@/lib/db.js'

export async function GET(request) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = await getDb()
  const groupId = auth.user.role === 'agent' ? auth.user.group_id : null
  const tickets = await getTickets(db, groupId)

  const withDetails = await Promise.all(tickets.map(async t => ({
    ...t,
    messages: await db.query('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at', [t.id]),
    notes:    await db.query('SELECT * FROM ticket_notes    WHERE ticket_id = ? ORDER BY created_at', [t.id]),
  })))

  return NextResponse.json({ tickets: withDetails })
}

export async function POST(request) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const { subject, customer, customerId, fromEmail, groupId, priority, assigneeId, message } = body
  if (!subject?.trim()) return NextResponse.json({ error: 'Subject required' }, { status: 400 })

  const db = await getDb()
  const id  = await nextTicketId(db)
  const now = new Date().toISOString()

  await db.execute(
    'INSERT INTO tickets (id,subject,customer,customer_id,from_email,group_id,status,priority,assignee_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [id, subject.trim(), customer || null, customerId || null, fromEmail || null, groupId || null, 'open', priority || 'medium', assigneeId || null, now, now]
  )

  if (message) {
    await db.execute(
      'INSERT INTO ticket_messages (ticket_id,from_email,body,created_at) VALUES (?,?,?,?)',
      [id, fromEmail || 'unknown', message, now]
    )
  }

  const ticket = await db.queryOne('SELECT * FROM tickets WHERE id = ?', [id])
  ticket.messages = await db.query('SELECT * FROM ticket_messages WHERE ticket_id = ?', [id])
  ticket.notes    = []

  return NextResponse.json({ ticket }, { status: 201 })
}
