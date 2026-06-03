import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'

export async function GET(request) {
  const result = await requireAuth(request)
  if (result.error) return NextResponse.json({ user: null })
  return NextResponse.json({ user: result.user })
}
