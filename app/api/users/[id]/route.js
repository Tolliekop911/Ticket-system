import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAuth } from '@/lib/auth.js'
import { getDb } from '@/lib/db.js'

export async function PUT(request, { params }) {
  const auth = await requireAuth(request, ['admin'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = await getDb()
  if (!await db.queryOne('SELECT id FROM users WHERE id = ?', [params.id])) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { name, role, groupId, password, email, active } = await request.json()
  const updates = [], values = []

  if (name   !== undefined) { updates.push('name = ?');     values.push(name.trim()) }
  if (role   !== undefined) {
    if (!['admin', 'lead', 'agent'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    updates.push('role = ?'); values.push(role)
  }
  if (groupId !== undefined) { updates.push('group_id = ?'); values.push(groupId || null) }
  if (email   !== undefined) { updates.push('email = ?');    values.push(email?.trim() || null) }
  if (active  !== undefined) { updates.push('active = ?');   values.push(active ? 1 : 0) }

  if (password !== undefined) {
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    updates.push('password_hash = ?')
    values.push(await bcrypt.hash(String(password).slice(0, 256), 10))
  }

  if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  values.push(params.id)
  await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values)

  const user = await db.queryOne('SELECT id,name,role,group_id,email,active,created_at FROM users WHERE id = ?', [params.id])
  return NextResponse.json({ user })
}

export async function DELETE(request, { params }) {
  const auth = await requireAuth(request, ['admin'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  if (params.id === auth.user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const db = await getDb()
  if (!await db.queryOne('SELECT id FROM users WHERE id = ?', [params.id])) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.execute('UPDATE users SET active = 0 WHERE id = ?', [params.id])
  return NextResponse.json({ ok: true })
}
