import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb, getEmails } from '@/lib/db.js'

export async function GET(request) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  const groupId = auth.user.role === 'agent' ? auth.user.group_id : null
  const emails = getEmails(db, groupId)
  return NextResponse.json({ emails })
}

export async function POST(request) {
  const auth = await requireAuth(request, ['admin', 'lead'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const { fromEmail, fromName, subject, emailBody, groupId, customerId, threadId } = body

  if (!fromEmail?.trim() || !subject?.trim()) {
    return NextResponse.json({ error: 'fromEmail and subject required' }, { status: 400 })
  }

  const db = getDb()
  const id = `e-${Date.now()}`
  const now = new Date().toISOString()
  const preview = (emailBody || '').slice(0, 120)

  db.prepare(`
    INSERT INTO emails (id, read, starred, from_email, from_name, subject, preview, body, group_id, customer_id, thread_id, received_at)
    VALUES (?,0,0,?,?,?,?,?,?,?,?,?)
  `).run(id, fromEmail.trim(), fromName || fromEmail.trim(), subject.trim(), preview,
    emailBody || '', groupId || null, customerId || null, threadId || `th-${Date.now()}`, now)

  const email = db.prepare('SELECT * FROM emails WHERE id = ?').get(id)
  return NextResponse.json({ email }, { status: 201 })
}
