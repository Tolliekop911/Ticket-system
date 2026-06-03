/**
 * Microsoft Graph API client for Outlook email sync.
 *
 * Setup:
 *  1. In Azure Portal → App registrations → New registration
 *  2. Add Application permission: Mail.ReadWrite, Mail.Send
 *  3. Grant admin consent
 *  4. Create client secret
 *  5. Set MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID,
 *     OUTLOOK_MAILBOX in .env.local
 */

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
const TOKEN_URL  = (tenantId) =>
  `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

let _tokenCache = null

export function isOutlookConfigured() {
  return !!(
    process.env.MICROSOFT_CLIENT_ID &&
    process.env.MICROSOFT_CLIENT_SECRET &&
    process.env.MICROSOFT_TENANT_ID &&
    process.env.OUTLOOK_MAILBOX
  )
}

async function getAccessToken() {
  if (_tokenCache && _tokenCache.expires > Date.now() + 60_000) {
    return _tokenCache.token
  }

  const tenantId = process.env.MICROSOFT_TENANT_ID
  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     process.env.MICROSOFT_CLIENT_ID,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET,
    scope:         'https://graph.microsoft.com/.default',
  })

  const res = await fetch(TOKEN_URL(tenantId), {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Graph token error: ${err}`)
  }

  const data = await res.json()
  _tokenCache = {
    token:   data.access_token,
    expires: Date.now() + data.expires_in * 1000,
  }
  return _tokenCache.token
}

async function graphFetch(path, options = {}) {
  const token = await getAccessToken()
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Graph API error ${res.status}: ${err}`)
  }
  if (res.status === 204) return null
  return res.json()
}

/**
 * Fetch new unread emails from the configured mailbox.
 * Returns an array of normalized email objects.
 */
export async function fetchNewEmails(sinceDateTime = null) {
  const mailbox = encodeURIComponent(process.env.OUTLOOK_MAILBOX)
  let filter = 'isRead eq false'
  if (sinceDateTime) {
    filter += ` and receivedDateTime gt ${new Date(sinceDateTime).toISOString()}`
  }

  const params = new URLSearchParams({
    $filter:  filter,
    $select:  'id,subject,from,body,receivedDateTime,isRead,importance,conversationId',
    $top:     '50',
    $orderby: 'receivedDateTime desc',
  })

  const data = await graphFetch(`/users/${mailbox}/mailFolders/Inbox/messages?${params}`)

  return (data?.value || []).map(msg => ({
    outlook_id:  msg.id,
    from_email:  msg.from?.emailAddress?.address || '',
    from_name:   msg.from?.emailAddress?.name || '',
    subject:     msg.subject || '(no subject)',
    body:        msg.body?.content || '',
    preview:     (msg.body?.content || '').replace(/<[^>]+>/g, '').slice(0, 120),
    thread_id:   msg.conversationId,
    received_at: msg.receivedDateTime,
    read:        msg.isRead ? 1 : 0,
  }))
}

/**
 * Send an email reply via the configured mailbox.
 */
export async function sendEmailReply({ to, subject, body, threadId }) {
  const mailbox = encodeURIComponent(process.env.OUTLOOK_MAILBOX)

  await graphFetch(`/users/${mailbox}/sendMail`, {
    method: 'POST',
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'Text', content: body },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: true,
    }),
  })
}

/**
 * Mark a message as read in Outlook.
 */
export async function markOutlookRead(outlookId) {
  if (!outlookId) return
  const mailbox = encodeURIComponent(process.env.OUTLOOK_MAILBOX)
  await graphFetch(`/users/${mailbox}/messages/${outlookId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isRead: true }),
  })
}
