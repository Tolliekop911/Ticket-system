import { NextResponse } from 'next/server'
import { getDb, hasUsers, createUser } from '@/lib/db.js'

// Check if first-run setup is needed (no auth required)
export async function GET() {
  const db = getDb()
  return NextResponse.json({ needsSetup: !hasUsers(db) })
}

// Create the first admin account (only works when no users exist)
export async function POST(request) {
  const db = getDb()

  if (hasUsers(db)) {
    return NextResponse.json({ error: 'Setup already completed' }, { status: 403 })
  }

  const { username, name, password } = await request.json()

  if (!username?.trim() || !name?.trim() || !password) {
    return NextResponse.json({ error: 'Username, name and password are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const cleanId = String(username).trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (!cleanId) return NextResponse.json({ error: 'Invalid username' }, { status: 400 })

  const user = await createUser(db, {
    id:       cleanId,
    name:     name.trim(),
    role:     'admin',
    groupId:  null,
    password,
    email:    null,
  })

  return NextResponse.json({ user }, { status: 201 })
}
