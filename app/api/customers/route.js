import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb, getCustomers } from '@/lib/db.js'

export async function GET(request) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  const groupId = auth.user.role === 'agent' ? auth.user.group_id : null
  const customers = getCustomers(db, groupId)
  return NextResponse.json({ customers })
}

export async function POST(request) {
  const auth = await requireAuth(request, ['admin', 'lead'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { name, groupId, status, email, plan } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const db = getDb()
  const id = `c-${Date.now()}`

  db.prepare(`
    INSERT INTO customers (id, name, group_id, status, email, plan)
    VALUES (?,?,?,?,?,?)
  `).run(id, name.trim(), groupId || null, status || 'active', email?.trim() || null, plan || 'Starter')

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id)
  return NextResponse.json({ customer }, { status: 201 })
}
