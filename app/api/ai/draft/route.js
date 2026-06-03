import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'

export async function POST(request) {
  const auth = await requireAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI drafts not configured. Set ANTHROPIC_API_KEY in .env.local' }, { status: 503 })
  }

  const { prompt } = await request.json()
  if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt.slice(0, 8000) }],
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err?.error?.message || 'AI service error' }, { status: 502 })
    }

    const data = await res.json()
    const text = data.content?.map(c => c.text || '').join('').trim() || ''
    return NextResponse.json({ text })
  } catch (err) {
    console.error('AI draft error:', err)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 })
  }
}
