import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb } from '@/lib/db.js'

export async function POST(request, { params }) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { body } = await request.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Message body required' }, { status: 400 })

  const db = await getDb()
  const ticket = await db.queryOne('SELECT * FROM tickets WHERE id = ?', [params.id])
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  if (auth.user.role === 'agent' && ticket.group_id !== auth.user.group_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date().toISOString()
  const fromEmail = `${auth.user.id}@wellyx.com`

  const { lastId } = await db.execute(
    'INSERT INTO ticket_messages (ticket_id,from_email,body,created_at) VALUES (?,?,?,?)',
    [params.id, fromEmail, body.trim(), now]
  )
  await db.execute('UPDATE tickets SET updated_at = ? WHERE id = ?', [now, params.id])

  const message = await db.queryOne('SELECT * FROM ticket_messages WHERE id = ?', [lastId])
  return NextResponse.json({ message }, { status: 201 })
}
