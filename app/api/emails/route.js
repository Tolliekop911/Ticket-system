import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb, getEmails } from '@/lib/db.js'

export async function GET(request) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = await getDb()
  const groupId = auth.user.role === 'agent' ? auth.user.group_id : null
  return NextResponse.json({ emails: await getEmails(db, groupId) })
}

export async function POST(request) {
  const auth = await requireAuth(request, ['admin', 'lead'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const { fromEmail, fromName, subject, emailBody, groupId, customerId, threadId } = body
  if (!fromEmail?.trim() || !subject?.trim()) {
    return NextResponse.json({ error: 'fromEmail and subject required' }, { status: 400 })
  }

  const db  = await getDb()
  const id  = `e-${Date.now()}`
  const now = new Date().toISOString()

  await db.execute(
    'INSERT INTO emails (id,read,starred,from_email,from_name,subject,preview,body,group_id,customer_id,thread_id,received_at) VALUES (?,0,0,?,?,?,?,?,?,?,?,?)',
    [id, fromEmail.trim(), fromName || fromEmail.trim(), subject.trim(), (emailBody || '').slice(0, 120), emailBody || '', groupId || null, customerId || null, threadId || `th-${Date.now()}`, now]
  )

  return NextResponse.json({ email: await db.queryOne('SELECT * FROM emails WHERE id = ?', [id]) }, { status: 201 })
}
