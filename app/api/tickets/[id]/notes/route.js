import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb } from '@/lib/db.js'

export async function POST(request, { params }) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { body } = await request.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Note body required' }, { status: 400 })

  const db = await getDb()
  const ticket = await db.queryOne('SELECT * FROM tickets WHERE id = ?', [params.id])
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  if (auth.user.role === 'agent' && ticket.group_id !== auth.user.group_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date().toISOString()
  const { lastId } = await db.execute(
    'INSERT INTO ticket_notes (ticket_id,author,body,created_at) VALUES (?,?,?,?)',
    [params.id, auth.user.name, body.trim(), now]
  )

  const note = await db.queryOne('SELECT * FROM ticket_notes WHERE id = ?', [lastId])
  return NextResponse.json({ note }, { status: 201 })
}
