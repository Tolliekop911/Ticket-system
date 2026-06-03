import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth.js'
import { getDb } from '@/lib/db.js'
import { isOutlookConfigured, fetchNewEmails } from '@/lib/outlook.js'

export async function POST(request) {
  const auth = await requireAuth(request, ['admin', 'lead'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  if (!isOutlookConfigured()) {
    return NextResponse.json({ error: 'Outlook not configured. Set MICROSOFT_* env vars.' }, { status: 503 })
  }

  const db = getDb()

  // Find the most recent email we already have from Outlook so we only fetch newer ones
  const latest = db.prepare(
    "SELECT received_at FROM emails WHERE outlook_id IS NOT NULL ORDER BY received_at DESC LIMIT 1"
  ).get()

  try {
    const incoming = await fetchNewEmails(latest?.received_at || null)

    let added = 0
    for (const msg of incoming) {
      // Skip if already imported
      const exists = db.prepare('SELECT id FROM emails WHERE outlook_id = ?').get(msg.outlook_id)
      if (exists) continue

      // Auto-route to group by matching from_email → customer email
      const customer = db.prepare(
        'SELECT id, group_id FROM customers WHERE LOWER(email) = LOWER(?)'
      ).get(msg.from_email)

      const id = `e-${Date.now()}-${added}`
      // Strip HTML tags from body for plain-text display
      const plainBody = msg.body.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      const preview   = plainBody.slice(0, 120)

      db.prepare(`
        INSERT INTO emails (id, read, starred, from_email, from_name, subject, preview, body,
                            group_id, customer_id, thread_id, outlook_id, received_at)
        VALUES (?,0,0,?,?,?,?,?,?,?,?,?,?)
      `).run(
        id, msg.from_email, msg.from_name, msg.subject, preview, plainBody,
        customer?.group_id || null, customer?.id || null,
        msg.thread_id, msg.outlook_id, msg.received_at
      )
      added++
    }

    return NextResponse.json({ synced: added, total: incoming.length })
  } catch (err) {
    console.error('Outlook sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}

// GET: check if Outlook is configured and return status
export async function GET(request) {
  const auth = await requireAuth(request, ['admin', 'lead'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const configured = isOutlookConfigured()
  const mailbox = process.env.OUTLOOK_MAILBOX || null

  let lastSync = null
  if (configured) {
    const db = getDb()
    const latest = db.prepare(
      "SELECT received_at FROM emails WHERE outlook_id IS NOT NULL ORDER BY received_at DESC LIMIT 1"
    ).get()
    lastSync = latest?.received_at || null
  }

  return NextResponse.json({ configured, mailbox, lastSync })
}
