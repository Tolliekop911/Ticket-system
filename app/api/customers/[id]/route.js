import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb } from '@/lib/db.js'

export async function GET(request, { params }) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = await getDb()
  const customer = await db.queryOne('SELECT * FROM customers WHERE id = ?', [params.id])
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (auth.user.role === 'agent' && customer.group_id !== auth.user.group_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tickets = await db.query('SELECT * FROM tickets WHERE customer_id = ? ORDER BY created_at DESC', [params.id])
  const notes = await db.query(`
    SELECT n.*, t.subject as ticket_subject, t.id as ticket_id
    FROM ticket_notes n JOIN tickets t ON n.ticket_id = t.id
    WHERE t.customer_id = ? ORDER BY n.created_at DESC
  `, [params.id])

  return NextResponse.json({ customer, tickets, notes })
}

export async function PUT(request, { params }) {
  const auth = await requireAuth(request, ['admin', 'lead'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = await getDb()
  if (!await db.queryOne('SELECT id FROM customers WHERE id = ?', [params.id])) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { name, groupId, status, email, plan } = await request.json()
  const updates = [], values = []

  if (name    !== undefined) { updates.push('name = ?');     values.push(name.trim()) }
  if (groupId !== undefined) { updates.push('group_id = ?'); values.push(groupId) }
  if (status  !== undefined) { updates.push('status = ?');   values.push(status) }
  if (email   !== undefined) { updates.push('email = ?');    values.push(email?.trim() || null) }
  if (plan    !== undefined) { updates.push('plan = ?');     values.push(plan) }

  if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  values.push(params.id)
  await db.execute(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`, values)

  return NextResponse.json({ customer: await db.queryOne('SELECT * FROM customers WHERE id = ?', [params.id]) })
}

export async function DELETE(request, { params }) {
  const auth = await requireAuth(request, ['admin'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = await getDb()
  if (!await db.queryOne('SELECT id FROM customers WHERE id = ?', [params.id])) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.execute('DELETE FROM customers WHERE id = ?', [params.id])
  return NextResponse.json({ ok: true })
}
