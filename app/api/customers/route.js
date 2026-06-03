import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb, getCustomers } from '@/lib/db.js'

export async function GET(request) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = await getDb()
  const groupId = auth.user.role === 'agent' ? auth.user.group_id : null
  return NextResponse.json({ customers: await getCustomers(db, groupId) })
}

export async function POST(request) {
  const auth = await requireAuth(request, ['admin', 'lead'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { name, groupId, status, email, plan } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const db = await getDb()
  const id = `c-${Date.now()}`

  await db.execute(
    'INSERT INTO customers (id,name,group_id,status,email,plan) VALUES (?,?,?,?,?,?)',
    [id, name.trim(), groupId || null, status || 'active', email?.trim() || null, plan || 'Excel']
  )

  return NextResponse.json({ customer: await db.queryOne('SELECT * FROM customers WHERE id = ?', [id]) }, { status: 201 })
}
