'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-gray-100 text-gray-600',
}
const STATUS_COLORS = {
  open:     'bg-blue-100 text-blue-700',
  pending:  'bg-orange-100 text-orange-700',
  resolved: 'bg-green-100 text-green-700',
}
const GROUP_TAILWIND = [
  { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500', border: 'border-violet-400' },
  { bg: 'bg-sky-100',    text: 'text-sky-700',    dot: 'bg-sky-500',    border: 'border-sky-400' },
  { bg: 'bg-emerald-100',text: 'text-emerald-700',dot: 'bg-emerald-500',border: 'border-emerald-400' },
  { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500',  border: 'border-amber-400' },
  { bg: 'bg-rose-100',   text: 'text-rose-700',   dot: 'bg-rose-500',   border: 'border-rose-400' },
  { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-400' },
]

function groupColors(groupId) {
  if (!groupId) return GROUP_TAILWIND[0]
  return GROUP_TAILWIND[(groupId - 1) % GROUP_TAILWIND.length]
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function useTick(ms = 60000) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), ms)
    return () => clearInterval(id)
  }, [ms])
}

function fmt(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d
  if (diff < 60000)   return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000)return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function Avatar({ name, size = 8, bg = 'bg-blue-600', text = 'text-white' }) {
  return (
    <div className={`w-${size} h-${size} rounded-full ${bg} ${text} flex items-center justify-center font-semibold text-sm flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async () => {
    if (!username.trim() || !password) { setError('Enter username and password'); return }
    setLoading(true); setError('')
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: { username, password } })
      onLogin(data.user)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/wellyx-logo.png" alt="Wellyx" className="w-16 h-16 rounded-full object-cover mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Wellyx Support</h1>
          <p className="text-slate-400 text-sm mt-1">Internal support portal</p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-2xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your username" value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button onClick={handleLogin} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium text-sm transition-colors">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          <p className="text-xs text-gray-400 text-center pt-2">
            Default password: <span className="font-mono">Wellyx2024!</span><br />
            Change via Admin → Users after first login.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

function Sidebar({ user, view, setView, onLogout, unreadCount }) {
  const isAdmin = user.role === 'admin' || user.role === 'lead'
  const navItems = [
    { id: 'inbox',     label: 'Inbox',     icon: '📬', badge: unreadCount },
    { id: 'tickets',   label: 'Tickets',   icon: '🎫' },
    { id: 'customers', label: 'Customers', icon: '🏢' },
    ...(isAdmin ? [
      { id: 'groups',  label: 'Groups',    icon: '👥' },
      { id: 'compose', label: 'Compose',   icon: '✏️' },
      { id: 'admin',   label: 'Admin',     icon: '⚙️' },
    ] : []),
  ]
  return (
    <div className="w-52 min-h-screen flex flex-col bg-slate-900 text-white flex-shrink-0">
      <div className="p-4 border-b border-white/10 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
          <img src="/wellyx-logo.png" alt="Wellyx" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-semibold">Wellyx Support</p>
          <p className="text-xs text-slate-400">v2.0</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(item => (
          <button key={item.id} onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left
              ${view === item.id ? 'bg-white/15 text-white' : 'text-slate-400 hover:bg-white/8 hover:text-white'}`}>
            <span className="text-base">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-slate-400 capitalize">{user.role}</p>
        </div>
        <button onClick={onLogout} className="text-slate-400 hover:text-white text-xs transition-colors">Out</button>
      </div>
    </div>
  )
}

// ─── INBOX VIEW ───────────────────────────────────────────────────────────────

function InboxView({ user, emails, setEmails, tickets, setTickets, groups, customers }) {
  useTick()
  const [selected,    setSelected]    = useState(null)
  const [reply,       setReply]       = useState('')
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterRead,  setFilterRead]  = useState('all')
  const [sentReplies, setSentReplies] = useState({})
  const [converting,  setConverting]  = useState(false)
  const isAdmin = user.role === 'admin' || user.role === 'lead'

  const visible = emails.filter(e => {
    const gMatch = isAdmin
      ? (filterGroup === 'all' || e.group_id === Number(filterGroup))
      : e.group_id === user.group_id
    const rMatch = filterRead === 'all' || (filterRead === 'unread' && !e.read)
    return gMatch && rMatch
  }).sort((a, b) => new Date(b.received_at) - new Date(a.received_at))

  const selectedEmail = selected ? emails.find(e => e.id === selected) : null
  const thread = sentReplies[selected] || []

  const selectEmail = async (id) => {
    setSelected(id)
    setReply('')
    const e = emails.find(x => x.id === id)
    if (e && !e.read) {
      await api(`/api/emails/${id}`, { method: 'PUT', body: { read: true } }).catch(() => {})
      setEmails(prev => prev.map(x => x.id === id ? { ...x, read: true } : x))
    }
  }

  const toggleStar = async (id) => {
    const e = emails.find(x => x.id === id)
    if (!e) return
    await api(`/api/emails/${id}`, { method: 'PUT', body: { starred: !e.starred } }).catch(() => {})
    setEmails(prev => prev.map(x => x.id === id ? { ...x, starred: !x.starred } : x))
  }

  const deleteEmail = async (id) => {
    if (!confirm('Delete this email permanently?')) return
    await api(`/api/emails/${id}`, { method: 'DELETE' })
    setEmails(prev => prev.filter(x => x.id !== id))
    if (selected === id) setSelected(null)
  }

  const sendReply = () => {
    if (!reply.trim() || !selectedEmail) return
    setSentReplies(prev => ({
      ...prev,
      [selected]: [...(prev[selected] || []), { from: `${user.id}@wellyx.com`, body: reply, time: new Date().toISOString() }]
    }))
    setReply('')
  }

  const convertToTicket = async () => {
    if (!selectedEmail || converting) return
    setConverting(true)
    try {
      const cust = customers.find(c => c.id === selectedEmail.customer_id)
      const data = await api('/api/tickets', {
        method: 'POST',
        body: {
          subject:    selectedEmail.subject,
          customer:   cust?.name || selectedEmail.from_name,
          customerId: selectedEmail.customer_id,
          fromEmail:  selectedEmail.from_email,
          groupId:    selectedEmail.group_id,
          message:    selectedEmail.body,
          assigneeId: user.id,
        },
      })
      setTickets(prev => [data.ticket, ...prev])
      alert(`Ticket ${data.ticket.id} created!`)
    } catch (e) {
      alert('Error: ' + e.message)
    }
    setConverting(false)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* List */}
      <div className="w-80 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-base mb-3">Inbox</h2>
          <div className="space-y-2">
            {isAdmin && (
              <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="all">All groups</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            )}
            <div className="flex gap-1.5">
              {['all', 'unread'].map(f => (
                <button key={f} onClick={() => setFilterRead(f)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors
                    ${filterRead === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {visible.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No emails</div>}
          {visible.map(e => {
            const gc = groupColors(e.group_id)
            const gName = groups.find(g => g.id === e.group_id)?.name
            return (
              <button key={e.id} onClick={() => selectEmail(e.id)}
                className={`w-full text-left p-3.5 hover:bg-gray-50 transition-colors ${selected === e.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''} ${!e.read ? 'bg-blue-50/30' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  {!e.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                  <p className={`text-xs flex-1 truncate ${!e.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{e.from_name}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0">{fmt(e.received_at)}</span>
                  {e.starred ? <span className="text-amber-400 text-xs">★</span> : null}
                </div>
                <p className={`text-xs mb-1 truncate ${!e.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>{e.subject}</p>
                <p className="text-xs text-gray-400 truncate">{e.preview}</p>
                {isAdmin && gName && (
                  <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${gc.bg} ${gc.text}`}>{gName}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail */}
      {selectedEmail ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-base">{selectedEmail.subject}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                  <span>From: <span className="font-medium text-gray-700">{selectedEmail.from_name}</span> &lt;{selectedEmail.from_email}&gt;</span>
                  <span>·</span>
                  <span>{fmt(selectedEmail.received_at)}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => toggleStar(selected)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selectedEmail.starred ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {selectedEmail.starred ? '★ Starred' : '☆ Star'}
                </button>
                {isAdmin && (
                  <>
                    <button onClick={convertToTicket} disabled={converting}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50">
                      {converting ? '…' : '→ Create Ticket'}
                    </button>
                    <button onClick={() => deleteEmail(selected)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                      🗑 Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Avatar name={selectedEmail.from_name} size={8} bg="bg-gray-200" text="text-gray-700" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{selectedEmail.from_name}</p>
                  <p className="text-xs text-gray-500">{selectedEmail.from_email}</p>
                </div>
                <span className="ml-auto text-xs text-gray-400">{fmt(selectedEmail.received_at)}</span>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedEmail.body}</div>
            </div>
            {thread.map((r, i) => (
              <div key={i} className="flex justify-end">
                <div className="max-w-2xl bg-blue-600 text-white rounded-xl p-4">
                  <p className="text-xs text-blue-200 mb-2">{r.from} · {fmt(r.time)}</p>
                  <p className="text-sm whitespace-pre-wrap">{r.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 text-xs text-gray-500">
                Reply to: <span className="font-medium text-gray-700">{selectedEmail.from_email}</span>
                <span className="mx-2 text-gray-300">·</span>
                From: <span className="font-medium text-gray-700">{user.id}@wellyx.com</span>
              </div>
              <textarea className="w-full px-4 py-3 text-sm resize-none focus:outline-none min-h-32"
                placeholder="Write your reply…" value={reply} onChange={e => setReply(e.target.value)} />
              <div className="px-4 py-2.5 border-t border-gray-100 flex justify-end gap-2">
                <button onClick={() => setReply('')} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">Clear</button>
                <button onClick={sendReply} disabled={!reply.trim()}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center"><div className="text-5xl mb-4">📬</div><p className="text-gray-500 text-sm">Select an email to read</p></div>
        </div>
      )}
    </div>
  )
}

// ─── TICKETS VIEW ─────────────────────────────────────────────────────────────

function TicketsView({ user, tickets, setTickets, groups, customers }) {
  useTick()
  const [selected,       setSelected]       = useState(null)
  const [reply,          setReply]          = useState('')
  const [note,           setNote]           = useState('')
  const [filterStatus,   setFilterStatus]   = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [saving,         setSaving]         = useState(false)
  const messagesEndRef = useRef(null)
  const isAdmin = user.role === 'admin' || user.role === 'lead'

  const visible = tickets.filter(t => {
    const gMatch = isAdmin || t.group_id === user.group_id
    const sMatch = filterStatus   === 'all' || t.status   === filterStatus
    const pMatch = filterPriority === 'all' || t.priority === filterPriority
    return gMatch && sMatch && pMatch
  })

  const selectedTicket = selected ? tickets.find(t => t.id === selected) : null

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) },
    [selectedTicket?.messages?.length])

  const updateTicket = async (id, patch) => {
    try {
      const data = await api(`/api/tickets/${id}`, { method: 'PUT', body: patch })
      setTickets(prev => prev.map(t => t.id === id ? data.ticket : t))
    } catch (e) { alert(e.message) }
  }

  const sendReply = async () => {
    if (!reply.trim() || !selectedTicket || saving) return
    setSaving(true)
    try {
      const data = await api(`/api/tickets/${selectedTicket.id}/messages`, { method: 'POST', body: { body: reply } })
      setTickets(prev => prev.map(t => t.id === selectedTicket.id
        ? { ...t, messages: [...t.messages, data.message], updated_at: data.message.created_at }
        : t))
      setReply('')
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  const addNote = async () => {
    if (!note.trim() || !selectedTicket || saving) return
    setSaving(true)
    try {
      const data = await api(`/api/tickets/${selectedTicket.id}/notes`, { method: 'POST', body: { body: note } })
      setTickets(prev => prev.map(t => t.id === selectedTicket.id
        ? { ...t, notes: [...t.notes, data.note] }
        : t))
      setNote('')
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  const deleteTicket = async (id) => {
    if (!confirm(`Delete ticket ${id} permanently? This cannot be undone.`)) return
    try {
      await api(`/api/tickets/${id}`, { method: 'DELETE' })
      setTickets(prev => prev.filter(t => t.id !== id))
      if (selected === id) setSelected(null)
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* List */}
      <div className="w-80 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-base mb-3">
            {isAdmin ? 'All Tickets' : `${groups.find(g => g.id === user.group_id)?.name || ''} Tickets`}
          </h2>
          <div className="space-y-2">
            <div className="flex gap-1 flex-wrap">
              {['all','open','pending','resolved'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors
                    ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
              ))}
            </div>
            <div className="flex gap-1">
              {['all','high','medium','low'].map(p => (
                <button key={p} onClick={() => setFilterPriority(p)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors
                    ${filterPriority === p ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{p}</button>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{visible.length} tickets</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {visible.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No tickets</div>}
          {visible.map(t => {
            const gc = groupColors(t.group_id)
            const gName = groups.find(g => g.id === t.group_id)?.name
            return (
              <button key={t.id} onClick={() => setSelected(t.id)}
                className={`w-full text-left p-3.5 hover:bg-gray-50 transition-colors ${selected === t.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-400">{t.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                </div>
                <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1.5">{t.subject}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 truncate flex-1">{t.customer}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                </div>
                {isAdmin && gName && (
                  <span className={`mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${gc.bg} ${gc.text}`}>{gName}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail */}
      {selectedTicket ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">{selectedTicket.subject}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-500">
                <span>{selectedTicket.from_email}</span>
                <span className="text-gray-300">·</span>
                <span>{selectedTicket.customer}</span>
                <span className="text-gray-300">·</span>
                <span>{fmt(selectedTicket.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <select value={selectedTicket.status}
                onChange={e => updateTicket(selectedTicket.id, { status: e.target.value })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
              {isAdmin && (
                <select value={selectedTicket.group_id || ''}
                  onChange={e => updateTicket(selectedTicket.id, { groupId: Number(e.target.value) })}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
                  <option value="">No group</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              )}
              {isAdmin && (
                <button onClick={() => deleteTicket(selectedTicket.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                  🗑 Delete
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Messages */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedTicket.messages.map((m, i) => {
                  const isAgent = m.from_email?.includes('wellyx.com')
                  return (
                    <div key={i} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-lg rounded-2xl px-4 py-3 ${isAgent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        <p className={`text-xs font-medium mb-1 ${isAgent ? 'text-blue-200' : 'text-gray-500'}`}>{m.from_email} · {fmt(m.created_at)}</p>
                        <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100 text-xs text-gray-500">
                    Reply as {user.id}@wellyx.com
                  </div>
                  <textarea className="w-full px-3 py-2 text-sm resize-none focus:outline-none min-h-24"
                    placeholder="Write a reply…" value={reply} onChange={e => setReply(e.target.value)} />
                  <div className="px-3 py-2 border-t border-gray-100 flex justify-end">
                    <button onClick={sendReply} disabled={!reply.trim() || saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                      {saving ? 'Sending…' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="w-60 border-l border-gray-100 flex flex-col bg-amber-50/40 flex-shrink-0">
              <div className="p-3 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700">📝 Internal Notes</h4>
                <p className="text-xs text-gray-500">Team only</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {selectedTicket.notes.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No notes</p>}
                {selectedTicket.notes.map((n, i) => (
                  <div key={i} className="bg-white rounded-lg p-2.5 border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 mb-1">{n.author} · {fmt(n.created_at)}</p>
                    <p className="text-xs text-gray-700">{n.body}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-100">
                <textarea className="w-full border border-amber-200 rounded-lg px-2.5 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                  rows={3} placeholder="Add note…" value={note} onChange={e => setNote(e.target.value)} />
                <button onClick={addNote} disabled={saving}
                  className="w-full mt-1.5 bg-amber-500 hover:bg-amber-600 text-white py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center"><div className="text-5xl mb-4">🎫</div><p className="text-gray-500 text-sm">Select a ticket</p></div>
        </div>
      )}
    </div>
  )
}

// ─── CUSTOMERS VIEW ───────────────────────────────────────────────────────────

function CustomersView({ user, tickets, groups, customers, setCustomers }) {
  const [selected, setSelected] = useState(null)
  const [search,   setSearch]   = useState('')
  const [editing,  setEditing]  = useState(null)
  const [adding,   setAdding]   = useState(false)
  const isAdmin = user.role === 'admin' || user.role === 'lead'

  const visible = customers.filter(c => {
    const gMatch = isAdmin || c.group_id === user.group_id
    const sMatch = !search || c.name.toLowerCase().includes(search.toLowerCase())
    return gMatch && sMatch
  })

  const selectedCustomer = selected ? customers.find(c => c.id === selected) : null
  const customerTickets  = selectedCustomer ? tickets.filter(t => t.customer_id === selectedCustomer.id) : []
  const allNotes = customerTickets.flatMap(t =>
    (t.notes || []).map(n => ({ ...n, ticket_id: t.id, ticket_subject: t.subject }))
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const saveCustomer = async (data) => {
    try {
      if (editing) {
        const res = await api(`/api/customers/${editing.id}`, { method: 'PUT', body: data })
        setCustomers(prev => prev.map(c => c.id === editing.id ? res.customer : c))
        setEditing(null)
      } else {
        const res = await api('/api/customers', { method: 'POST', body: data })
        setCustomers(prev => [...prev, res.customer])
        setAdding(false)
        setSelected(res.customer.id)
      }
    } catch (e) { alert(e.message) }
  }

  const deleteCustomer = async (id) => {
    if (!confirm('Delete this customer? Ticket history will be preserved.')) return
    try {
      await api(`/api/customers/${id}`, { method: 'DELETE' })
      setCustomers(prev => prev.filter(c => c.id !== id))
      if (selected === id) setSelected(null)
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-72 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-900">Customers</h2>
            {isAdmin && (
              <button onClick={() => setAdding(true)}
                className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition-colors">
                + Add
              </button>
            )}
          </div>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {visible.map(c => {
            const gc = groupColors(c.group_id)
            const gName = groups.find(g => g.id === c.group_id)?.name
            const openCount = tickets.filter(t => t.customer_id === c.id && t.status === 'open').length
            return (
              <button key={c.id} onClick={() => setSelected(c.id)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected === c.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-800">{c.name}</p>
                  {openCount > 0 && <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{openCount}</span>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {gName && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${gc.bg} ${gc.text}`}>{gName}</span>}
                  <span className="text-xs text-gray-400">{c.plan}</span>
                  <span className={`text-xs ${c.status === 'active' ? 'text-green-600' : 'text-orange-500'}`}>
                    {c.status === 'active' ? '● Active' : '◌ Onboarding'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {(adding || editing) && (
        <CustomerForm
          initial={editing}
          groups={groups}
          onSave={saveCustomer}
          onCancel={() => { setAdding(false); setEditing(null) }}
        />
      )}

      {!adding && !editing && selectedCustomer && (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <Avatar name={selectedCustomer.name} size={12} bg="bg-blue-600" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-gray-500">
                  {(() => {
                    const gc = groupColors(selectedCustomer.group_id)
                    const gName = groups.find(g => g.id === selectedCustomer.group_id)?.name
                    return gName ? <span className={`px-2 py-0.5 rounded-full font-medium ${gc.bg} ${gc.text}`}>{gName}</span> : null
                  })()}
                  <span>{selectedCustomer.plan} plan</span>
                  <span>{selectedCustomer.email}</span>
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(selectedCustomer)}
                    className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Edit</button>
                  <button onClick={() => deleteCustomer(selectedCustomer.id)}
                    className="text-xs border border-red-200 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">Delete</button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Tickets ({customerTickets.length})</h3>
              {customerTickets.length === 0 ? <p className="text-sm text-gray-400">No tickets</p> : (
                <div className="space-y-2">
                  {customerTickets.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{t.subject}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t.id} · {fmt(t.created_at)}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-1">Notes History</h3>
              <p className="text-xs text-gray-400 mb-4">All internal notes across all tickets</p>
              {allNotes.length === 0 ? <p className="text-sm text-gray-400">No notes yet.</p> : (
                <div className="space-y-3">
                  {allNotes.map((n, i) => (
                    <div key={i} className="flex gap-3">
                      <Avatar name={n.author} size={8} bg="bg-amber-100" text="text-amber-700" />
                      <div className="flex-1 bg-amber-50 rounded-xl p-3 border border-amber-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-amber-800">{n.author}</span>
                          <span className="text-xs text-gray-400">{fmt(n.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-700">{n.body}</p>
                        <p className="text-xs text-gray-400 mt-1">Re: {n.ticket_subject}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!adding && !editing && !selectedCustomer && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center"><div className="text-5xl mb-4">🏢</div><p className="text-gray-500 text-sm">Select a customer</p></div>
        </div>
      )}
    </div>
  )
}

function CustomerForm({ initial, groups, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:    initial?.name    || '',
    email:   initial?.email   || '',
    plan:    initial?.plan    || 'Starter',
    status:  initial?.status  || 'active',
    groupId: initial?.group_id || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{initial ? 'Edit Customer' : 'Add Customer'}</h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">COMPANY NAME *</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.name} onChange={e => set('name', e.target.value)} placeholder="Company name" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">EMAIL</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@company.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">PLAN</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.plan} onChange={e => set('plan', e.target.value)}>
                {['Starter','Pro','Enterprise'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">STATUS</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="in_progress">Onboarding</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">GROUP</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.groupId} onChange={e => set('groupId', e.target.value)}>
              <option value="">Unassigned</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => onSave({ ...form, groupId: form.groupId ? Number(form.groupId) : null })}
              disabled={!form.name.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm transition-colors">
              {initial ? 'Save Changes' : 'Add Customer'}
            </button>
            <button onClick={onCancel} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── GROUPS VIEW ──────────────────────────────────────────────────────────────

function GroupsView({ tickets, emails, groups, customers }) {
  return (
    <div className="p-6 overflow-y-auto h-screen">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Groups Overview</h2>
      <div className="grid grid-cols-2 gap-4 max-w-5xl">
        {groups.map(g => {
          const gc = groupColors(g.id)
          const gTickets   = tickets.filter(t => t.group_id === g.id)
          const open       = gTickets.filter(t => t.status === 'open').length
          const pending    = gTickets.filter(t => t.status === 'pending').length
          const resolved   = gTickets.filter(t => t.status === 'resolved').length
          const unread     = emails.filter(e => e.group_id === g.id && !e.read).length
          const gCustomers = customers.filter(c => c.group_id === g.id)
          const memberNames= (g.members || []).map(m => m.name).join(' · ')
          return (
            <div key={g.id} className={`bg-white rounded-2xl border-t-4 ${gc.border} border border-gray-100 p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{g.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{memberNames || 'No members'}</p>
                  {g.email && <p className="text-xs text-gray-400 font-mono mt-0.5">{g.email}</p>}
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${gc.bg} ${gc.text}`}>{g.id}</div>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-700">{open}</p>
                  <p className="text-xs text-blue-500">Open</p>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded-lg">
                  <p className="text-lg font-bold text-orange-600">{pending}</p>
                  <p className="text-xs text-orange-400">Pending</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-700">{resolved}</p>
                  <p className="text-xs text-green-500">Resolved</p>
                </div>
                <div className="text-center p-2 bg-violet-50 rounded-lg">
                  <p className="text-lg font-bold text-violet-700">{unread}</p>
                  <p className="text-xs text-violet-500">Unread</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">CUSTOMERS ({gCustomers.length})</p>
                <div className="space-y-1">
                  {gCustomers.map(c => (
                    <div key={c.id} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${gc.bg}`}>
                      <span className={`text-xs font-medium ${gc.text}`}>{c.name}</span>
                      <span className={`text-xs ${gc.text} opacity-70`}>{c.plan}</span>
                    </div>
                  ))}
                  {gCustomers.length === 0 && <p className={`text-xs ${gc.text} opacity-60 px-2`}>No customers assigned</p>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── COMPOSE VIEW ─────────────────────────────────────────────────────────────

function ComposeView({ user, emails, setEmails, tickets, setTickets, groups, customers }) {
  const [form, setForm] = useState({ to: '', toName: '', subject: '', body: '', groupId: '', priority: 'medium', mode: 'email' })
  const [sent, setSent]     = useState(false)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.to.trim() || !form.subject.trim() || !form.body.trim()) return
    setSaving(true)
    try {
      if (form.mode === 'ticket') {
        const cust = customers.find(c => c.email?.toLowerCase() === form.to.toLowerCase())
        const data = await api('/api/tickets', {
          method: 'POST',
          body: {
            subject:    form.subject,
            customer:   form.toName || form.to,
            customerId: cust?.id || null,
            fromEmail:  form.to,
            groupId:    form.groupId ? Number(form.groupId) : null,
            priority:   form.priority,
            message:    form.body,
          },
        })
        setTickets(prev => [data.ticket, ...prev])
      } else {
        const cust = customers.find(c => c.email?.toLowerCase() === form.to.toLowerCase())
        const data = await api('/api/emails', {
          method: 'POST',
          body: {
            fromEmail:  form.to,
            fromName:   form.toName || form.to,
            subject:    form.subject,
            emailBody:  form.body,
            groupId:    form.groupId ? Number(form.groupId) : null,
            customerId: cust?.id || null,
          },
        })
        setEmails(prev => [data.email, ...prev])
      }
      setSent(true)
      setTimeout(() => setSent(false), 3000)
      setForm({ to: '', toName: '', subject: '', body: '', groupId: form.groupId, priority: 'medium', mode: form.mode })
    } catch (e) { alert(e.message) }
    setSaving(false)
  }

  return (
    <div className="p-6 overflow-y-auto h-screen">
      <div className="max-w-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-1">New Email / Ticket</h2>
        <p className="text-sm text-gray-500 mb-6">Add an incoming email to the inbox or create a new ticket manually.</p>
        {sent && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">✅ Done!</div>}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="flex gap-2">
            {['email','ticket'].map(m => (
              <button key={m} onClick={() => set('mode', m)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${form.mode === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {m === 'email' ? '📧 Incoming Email' : '🎫 New Ticket'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">FROM (customer email)</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="client@company.com" value={form.to} onChange={e => set('to', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">CUSTOMER NAME</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Business / Contact" value={form.toName} onChange={e => set('toName', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">SUBJECT</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Issue subject…" value={form.subject} onChange={e => set('subject', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">MESSAGE</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5} placeholder="Message body…" value={form.body} onChange={e => set('body', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">ROUTE TO GROUP</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.groupId} onChange={e => set('groupId', e.target.value)}>
                <option value="">Select group…</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">PRIORITY</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <button onClick={submit} disabled={saving || !form.to.trim() || !form.subject.trim() || !form.body.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm transition-colors">
            {saving ? 'Saving…' : form.mode === 'email' ? '📧 Add to Inbox' : '🎫 Create Ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────

function AdminView({ user, groups, setGroups, customers, setCustomers, allUsers, setAllUsers, outlookStatus, onOutlookSync }) {
  const [tab, setTab] = useState('users')

  return (
    <div className="p-6 overflow-y-auto h-screen">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Admin Panel</h2>
      <div className="flex gap-2 mb-6">
        {['users','groups','outlook','password'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t === 'outlook' ? '📧 Outlook' : t === 'password' ? '🔑 My Password' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'users'    && <UsersTab    groups={groups} allUsers={allUsers} setAllUsers={setAllUsers} currentUser={user} />}
      {tab === 'groups'   && <GroupsTab   groups={groups} setGroups={setGroups} />}
      {tab === 'outlook'  && <OutlookTab  status={outlookStatus} onSync={onOutlookSync} />}
      {tab === 'password' && <ChangePasswordTab />}
    </div>
  )
}

function UsersTab({ groups, allUsers, setAllUsers, currentUser }) {
  const [adding,  setAdding]  = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState({ id:'', name:'', role:'agent', groupId:'', password:'', email:'' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const openEdit = (u) => {
    setEditing(u)
    setForm({ id: u.id, name: u.name, role: u.role, groupId: u.group_id || '', password: '', email: u.email || '' })
    setAdding(false)
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ id:'', name:'', role:'agent', groupId:'', password:'', email:'' })
    setAdding(true)
  }

  const save = async () => {
    try {
      const body = { name: form.name, role: form.role, groupId: form.groupId ? Number(form.groupId) : null, email: form.email }
      if (form.password) body.password = form.password
      if (adding) {
        body.id = form.id; body.password = form.password
        const data = await api('/api/users', { method: 'POST', body })
        setAllUsers(prev => [...prev, data.user])
      } else {
        const data = await api(`/api/users/${editing.id}`, { method: 'PUT', body })
        setAllUsers(prev => prev.map(u => u.id === editing.id ? data.user : u))
      }
      setAdding(false); setEditing(null)
    } catch (e) { alert(e.message) }
  }

  const deactivate = async (u) => {
    if (!confirm(`Deactivate ${u.name}? They will no longer be able to log in.`)) return
    try {
      await api(`/api/users/${u.id}`, { method: 'PUT', body: { active: false } })
      setAllUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: 0 } : x))
    } catch (e) { alert(e.message) }
  }

  const reactivate = async (u) => {
    try {
      await api(`/api/users/${u.id}`, { method: 'PUT', body: { active: true } })
      setAllUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: 1 } : x))
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Team Members</h3>
        <button onClick={openAdd} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">+ Add User</button>
      </div>

      {(adding || editing) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 space-y-4">
          <h4 className="font-semibold text-gray-800">{adding ? 'Add User' : `Edit: ${editing.name}`}</h4>
          <div className="grid grid-cols-2 gap-4">
            {adding && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">USERNAME (login ID)</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. john" value={form.id} onChange={e => set('id', e.target.value)} />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">DISPLAY NAME</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full name" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">EMAIL</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="email" placeholder="user@wellyx.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">ROLE</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="admin">Admin</option>
                <option value="lead">Lead</option>
                <option value="agent">Agent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">GROUP</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.groupId} onChange={e => set('groupId', e.target.value)}>
                <option value="">None (admin/lead)</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{adding ? 'PASSWORD *' : 'NEW PASSWORD (leave blank to keep)'}</label>
              <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min 8 characters" value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {adding ? 'Add User' : 'Save Changes'}
            </button>
            <button onClick={() => { setAdding(false); setEditing(null) }}
              className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['User','Role','Group','Email','Status','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {allUsers.map(u => {
              const gName = groups.find(g => g.id === u.group_id)?.name
              return (
                <tr key={u.id} className={!u.active ? 'opacity-50' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.name} size={7} bg="bg-blue-100" text="text-blue-700" />
                      <div>
                        <p className="font-medium text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="capitalize text-gray-600">{u.role}</span></td>
                  <td className="px-4 py-3 text-gray-500">{gName || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="text-xs text-blue-600 hover:underline">Edit</button>
                      {u.id !== currentUser.id && (
                        u.active
                          ? <button onClick={() => deactivate(u)} className="text-xs text-red-500 hover:underline">Deactivate</button>
                          : <button onClick={() => reactivate(u)} className="text-xs text-green-600 hover:underline">Reactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GroupsTab({ groups, setGroups }) {
  const [adding,  setAdding]  = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState({ name:'', color:'#6366f1', email:'' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const openEdit = (g) => { setEditing(g); setForm({ name: g.name, color: g.color, email: g.email || '' }); setAdding(false) }
  const openAdd  = ()  => { setEditing(null); setForm({ name:'', color:'#6366f1', email:'' }); setAdding(true) }

  const save = async () => {
    try {
      if (adding) {
        const data = await api('/api/groups', { method: 'POST', body: form })
        setGroups(prev => [...prev, data.group])
      } else {
        const data = await api(`/api/groups/${editing.id}`, { method: 'PUT', body: form })
        setGroups(prev => prev.map(g => g.id === editing.id ? data.group : g))
      }
      setAdding(false); setEditing(null)
    } catch (e) { alert(e.message) }
  }

  const deleteGroup = async (g) => {
    if (!confirm(`Delete group "${g.name}"? Members and customers will be unassigned.`)) return
    try {
      await api(`/api/groups/${g.id}`, { method: 'DELETE' })
      setGroups(prev => prev.filter(x => x.id !== g.id))
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Support Groups</h3>
        <button onClick={openAdd} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">+ Add Group</button>
      </div>

      {(adding || editing) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 space-y-4">
          <h4 className="font-semibold text-gray-800">{adding ? 'Add Group' : `Edit: ${editing.name}`}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">GROUP NAME</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Technical" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">EMAIL ADDRESS</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="group@wellyx.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">COLOUR</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-9 w-14 rounded border border-gray-200 cursor-pointer"
                  value={form.color} onChange={e => set('color', e.target.value)} />
                <span className="text-sm text-gray-500 font-mono">{form.color}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={!form.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {adding ? 'Add Group' : 'Save Changes'}
            </button>
            <button onClick={() => { setAdding(false); setEditing(null) }}
              className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {groups.map(g => {
          const gc = groupColors(g.id)
          return (
            <div key={g.id} className={`bg-white rounded-xl border-l-4 ${gc.border} border border-gray-100 p-4 flex items-center gap-4`}>
              <div style={{ backgroundColor: g.color }} className="w-4 h-4 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-gray-800">{g.name}</p>
                <p className="text-xs text-gray-400">{g.email || 'No email set'} · {(g.members || []).length} members</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(g)} className="text-xs text-blue-600 hover:underline">Edit</button>
                <button onClick={() => deleteGroup(g)} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OutlookTab({ status, onSync }) {
  const [syncing, setSyncing] = useState(false)
  const [result,  setResult]  = useState(null)

  const sync = async () => {
    setSyncing(true); setResult(null)
    try {
      const data = await api('/api/outlook/sync', { method: 'POST' })
      setResult({ ok: true, msg: `Synced ${data.synced} new email${data.synced !== 1 ? 's' : ''} (${data.total} checked).` })
      if (data.synced > 0) onSync()
    } catch (e) { setResult({ ok: false, msg: e.message }) }
    setSyncing(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-1">Outlook / Microsoft 365 Integration</h3>
        <p className="text-sm text-gray-500 mb-4">Automatically pull emails from your support mailbox and route them to the right group based on the sender.</p>

        <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${status?.configured ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
          <span className="text-2xl">{status?.configured ? '✅' : '⚠️'}</span>
          <div>
            <p className={`text-sm font-semibold ${status?.configured ? 'text-green-700' : 'text-amber-700'}`}>
              {status?.configured ? 'Connected' : 'Not configured'}
            </p>
            <p className="text-xs text-gray-500">
              {status?.configured
                ? `Mailbox: ${status.mailbox}${status.lastSync ? ` · Last sync: ${fmt(status.lastSync)}` : ''}`
                : 'Set MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID and OUTLOOK_MAILBOX in .env.local'}
            </p>
          </div>
        </div>

        {status?.configured && (
          <div className="space-y-3">
            <button onClick={sync} disabled={syncing}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              {syncing ? '⟳ Syncing…' : '⟳ Sync Now'}
            </button>
            {result && (
              <p className={`text-sm ${result.ok ? 'text-green-600' : 'text-red-600'}`}>{result.msg}</p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Setup Guide</h3>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Go to <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">portal.azure.com</span> → Azure Active Directory → App registrations → New registration</li>
          <li>Add Application permissions: <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">Mail.ReadWrite</span> and <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">Mail.Send</span></li>
          <li>Grant admin consent for the permissions</li>
          <li>Create a client secret under Certificates &amp; secrets</li>
          <li>Copy the Client ID, Client Secret, and Tenant ID into your <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">.env.local</span> file</li>
          <li>Set <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">OUTLOOK_MAILBOX</span> to your support email address</li>
          <li>Restart the server and click Sync Now above</li>
        </ol>
        <p className="text-xs text-gray-400 mt-4">Emails are auto-routed by matching the sender's address to a known customer. Unknown senders appear unassigned for an admin to route.</p>
      </div>
    </div>
  )
}

function ChangePasswordTab() {
  const [form, setForm]   = useState({ current: '', next: '', confirm: '' })
  const [msg,  setMsg]    = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (form.next !== form.confirm) { setMsg({ ok: false, text: 'New passwords do not match' }); return }
    if (form.next.length < 8)       { setMsg({ ok: false, text: 'Password must be at least 8 characters' }); return }
    setSaving(true); setMsg(null)
    try {
      await api('/api/auth/change-password', { method: 'POST', body: { currentPassword: form.current, newPassword: form.next } })
      setMsg({ ok: true, text: 'Password changed successfully.' })
      setForm({ current: '', next: '', confirm: '' })
    } catch (e) { setMsg({ ok: false, text: e.message }) }
    setSaving(false)
  }

  return (
    <div className="max-w-md">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-semibold text-gray-800">Change My Password</h3>
        {['current','next','confirm'].map(k => (
          <div key={k}>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {k === 'current' ? 'CURRENT PASSWORD' : k === 'next' ? 'NEW PASSWORD' : 'CONFIRM NEW PASSWORD'}
            </label>
            <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form[k]} onChange={e => set(k, e.target.value)} />
          </div>
        ))}
        {msg && <p className={`text-sm ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>}
        <button onClick={save} disabled={saving || !form.current || !form.next || !form.confirm}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm transition-colors">
          {saving ? 'Saving…' : 'Change Password'}
        </button>
      </div>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [user,          setUser]          = useState(null)
  const [authLoading,   setAuthLoading]   = useState(true)
  const [view,          setView]          = useState('inbox')
  const [tickets,       setTickets]       = useState([])
  const [emails,        setEmails]        = useState([])
  const [customers,     setCustomers]     = useState([])
  const [groups,        setGroups]        = useState([])
  const [allUsers,      setAllUsers]      = useState([])
  const [outlookStatus, setOutlookStatus] = useState(null)
  const [dataLoaded,    setDataLoaded]    = useState(false)

  // Check session on mount
  useEffect(() => {
    api('/api/auth/me')
      .then(d => { if (d.user) setUser(d.user) })
      .finally(() => setAuthLoading(false))
  }, [])

  const loadData = useCallback(async (u) => {
    if (!u) return
    const isAdmin = u.role === 'admin' || u.role === 'lead'
    try {
      const [gRes, tRes, eRes, cRes] = await Promise.all([
        api('/api/groups'),
        api('/api/tickets'),
        api('/api/emails'),
        api('/api/customers'),
      ])
      setGroups(gRes.groups || [])
      setTickets(tRes.tickets || [])
      setEmails(eRes.emails || [])
      setCustomers(cRes.customers || [])

      if (isAdmin) {
        const [uRes, oRes] = await Promise.all([
          api('/api/users'),
          api('/api/outlook/sync'),
        ])
        setAllUsers(uRes.users || [])
        setOutlookStatus(oRes)
      }
      setDataLoaded(true)
    } catch (e) {
      console.error('Data load error:', e)
    }
  }, [])

  useEffect(() => { loadData(user) }, [user, loadData])

  const handleLogin = (u) => { setUser(u) }
  const handleLogout = async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null); setView('inbox'); setDataLoaded(false)
    setTickets([]); setEmails([]); setCustomers([]); setGroups([]); setAllUsers([])
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'lead'
  const unreadCount = emails.filter(e => {
    const gMatch = isAdmin || e.group_id === user?.group_id
    return gMatch && !e.read
  }).length

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return <LoginScreen onLogin={handleLogin} />

  if (!dataLoaded) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} view={view} setView={setView} onLogout={handleLogout} unreadCount={0} groups={groups} />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading data…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} view={view} setView={setView} onLogout={handleLogout} unreadCount={unreadCount} groups={groups} />
      <main className="flex-1 overflow-hidden">
        {view === 'inbox'     && (
          <InboxView user={user} emails={emails} setEmails={setEmails}
            tickets={tickets} setTickets={setTickets} groups={groups} customers={customers} />
        )}
        {view === 'tickets'   && (
          <TicketsView user={user} tickets={tickets} setTickets={setTickets}
            groups={groups} customers={customers} />
        )}
        {view === 'customers' && (
          <CustomersView user={user} tickets={tickets} groups={groups}
            customers={customers} setCustomers={setCustomers} />
        )}
        {view === 'groups'    && isAdmin && (
          <GroupsView tickets={tickets} emails={emails} groups={groups} customers={customers} />
        )}
        {view === 'compose'   && isAdmin && (
          <ComposeView user={user} emails={emails} setEmails={setEmails}
            tickets={tickets} setTickets={setTickets} groups={groups} customers={customers} />
        )}
        {view === 'admin'     && isAdmin && (
          <AdminView user={user} groups={groups} setGroups={setGroups}
            customers={customers} setCustomers={setCustomers}
            allUsers={allUsers} setAllUsers={setAllUsers}
            outlookStatus={outlookStatus}
            onOutlookSync={() => loadData(user)} />
        )}
      </main>
    </div>
  )
}
