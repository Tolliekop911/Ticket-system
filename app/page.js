'use client'
import { useState } from 'react'
import { USERS, GROUPS, CUSTOMERS, TICKETS } from '../lib/data'

const GROUP_COLORS = {
  1: { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500', border: 'border-violet-200' },
  2: { bg: 'bg-sky-100',    text: 'text-sky-700',    dot: 'bg-sky-500',    border: 'border-sky-200' },
  3: { bg: 'bg-emerald-100',text: 'text-emerald-700',dot: 'bg-emerald-500',border: 'border-emerald-200' },
  4: { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500',  border: 'border-amber-200' },
}

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

// ─── Login Screen ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    const user = USERS[username.toLowerCase()]
    if (user && user.password === password) {
      onLogin(user)
    } else {
      setError('Invalid credentials. Try any name below with password: demo123')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Wellyx Support</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your support portal</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. rebecca, casey, david..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="demo123"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors">
              Sign In
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-3">Demo accounts (password: demo123)</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(USERS).map(u => (
                <button key={u.id} onClick={() => { setUsername(u.id); setPassword('demo123') }}
                  className="text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <p className="text-xs font-semibold text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.role === 'lead' ? '👑 Lead' : `Group ${u.group}`}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ user, view, setView, onLogout }) {
  const navItems = [
    { id: 'tickets', label: 'All Tickets', icon: '🎫' },
    { id: 'customers', label: 'Customers', icon: '🏢' },
    ...(user.role === 'lead' ? [{ id: 'groups', label: 'Groups', icon: '👥' }, { id: 'inbox', label: 'Simulate Email', icon: '📨' }] : []),
  ]

  return (
    <div className="sidebar w-56 min-h-screen flex flex-col text-white">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold">W</div>
          <div>
            <p className="text-sm font-semibold">Wellyx Support</p>
            <p className="text-xs text-slate-400">Ticketing System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <button key={item.id} onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left
              ${view === item.id ? 'bg-white/15 text-white' : 'text-slate-400 hover:bg-white/8 hover:text-white'}`}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-slate-400">
              {user.role === 'lead' ? '👑 Lead' : `Group ${user.group}`}
            </p>
          </div>
          <button onClick={onLogout} className="text-slate-400 hover:text-white transition-colors text-xs">
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tickets View ─────────────────────────────────────────────────────────────
function TicketsView({ user, tickets, setTickets }) {
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [note, setNote] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Leads see all, agents see only their group
  const visible = tickets.filter(t => {
    const groupMatch = user.role === 'lead' || t.group === user.group
    const statusMatch = filterStatus === 'all' || t.status === filterStatus
    return groupMatch && statusMatch
  })

  const selectedTicket = selected ? tickets.find(t => t.id === selected) : null

  const sendReply = () => {
    if (!reply.trim() || !selectedTicket) return
    const updated = tickets.map(t => t.id === selected
      ? { ...t, messages: [...t.messages, { from: `${user.id}@wellyx.com`, body: reply, time: new Date().toISOString() }] }
      : t)
    setTickets(updated)
    setReply('')
  }

  const addNote = () => {
    if (!note.trim() || !selectedTicket) return
    const updated = tickets.map(t => t.id === selected
      ? { ...t, notes: [...t.notes, { author: user.name, text: note, time: new Date().toISOString() }] }
      : t)
    setTickets(updated)
    setNote('')
  }

  const updateStatus = (ticketId, status) => {
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, status } : t))
  }

  const assign = (ticketId, groupId) => {
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, group: Number(groupId) } : t))
  }

  const fmt = iso => {
    const d = new Date(iso)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Ticket list */}
      <div className="w-80 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-base mb-3">
            {user.role === 'lead' ? 'All Tickets' : `Group ${user.group} Tickets`}
          </h2>
          <div className="flex gap-1.5 flex-wrap">
            {['all','open','pending','resolved'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors
                  ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {visible.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">No tickets found</div>
          )}
          {visible.map(t => {
            const gc = GROUP_COLORS[t.group] || GROUP_COLORS[2]
            return (
              <button key={t.id} onClick={() => setSelected(t.id)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selected === t.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs font-mono text-gray-400">{t.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                </div>
                <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-2">{t.subject}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t.customer}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                </div>
                {user.role === 'lead' && (
                  <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${gc.bg} ${gc.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${gc.dot}`}></span>
                    Group {t.group}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Ticket detail */}
      {selectedTicket ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{selectedTicket.subject}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-gray-500">From: {selectedTicket.from}</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500">{selectedTicket.customer}</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500">{fmt(selectedTicket.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <select value={selectedTicket.status}
                onChange={e => updateStatus(selectedTicket.id, e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
              {user.role === 'lead' && (
                <select value={selectedTicket.group}
                  onChange={e => assign(selectedTicket.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  {[1,2,3,4].map(g => <option key={g} value={g}>Group {g}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Messages */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedTicket.messages.map((m, i) => {
                  const isAgent = m.from.includes('wellyx.com')
                  return (
                    <div key={i} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-lg rounded-2xl px-4 py-3 ${isAgent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        <p className={`text-xs font-medium mb-1 ${isAgent ? 'text-blue-200' : 'text-gray-500'}`}>{m.from} · {fmt(m.time)}</p>
                        <p className="text-sm">{m.body}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  rows={3}
                  placeholder="Write a reply..."
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                  <button onClick={sendReply} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Send Reply
                  </button>
                </div>
              </div>
            </div>

            {/* Notes panel */}
            <div className="w-64 border-l border-gray-100 flex flex-col bg-amber-50/40 flex-shrink-0">
              <div className="p-4 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700">📝 Internal Notes</h4>
                <p className="text-xs text-gray-500 mt-0.5">Visible to your team only</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {selectedTicket.notes.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No notes yet</p>
                )}
                {selectedTicket.notes.map((n, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 shadow-sm border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 mb-1">{n.author} · {fmt(n.time)}</p>
                    <p className="text-xs text-gray-700">{n.text}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-100">
                <textarea
                  className="w-full border border-amber-200 rounded-lg px-2.5 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                  rows={3}
                  placeholder="Add internal note..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
                <button onClick={addNote} className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white py-1.5 rounded-lg text-xs font-medium transition-colors">
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-5xl mb-4">🎫</div>
            <p className="text-gray-500 text-sm">Select a ticket to view details</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Customers View ──────────────────────────────────────────────────────────
function CustomersView({ user, tickets }) {
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const visibleCustomers = CUSTOMERS.filter(c =>
    user.role === 'lead' || c.group === user.group
  )

  const customerTickets = selectedCustomer
    ? tickets.filter(t => t.customerId === selectedCustomer.id)
    : []

  const allNotes = customerTickets.flatMap(t =>
    t.notes.map(n => ({ ...n, ticketId: t.id, ticketSubject: t.subject }))
  ).sort((a, b) => new Date(b.time) - new Date(a.time))

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-72 bg-white border-r border-gray-100 overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Customers</h2>
          <p className="text-xs text-gray-500 mt-0.5">{visibleCustomers.length} accounts</p>
        </div>
        {visibleCustomers.map(c => {
          const gc = GROUP_COLORS[c.group]
          const cTickets = tickets.filter(t => t.customerId === c.id)
          const openCount = cTickets.filter(t => t.status === 'open').length
          return (
            <button key={c.id} onClick={() => setSelectedCustomer(c)}
              className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors
                ${selectedCustomer?.id === c.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-800">{c.name}</p>
                {openCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{openCount}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${gc.bg} ${gc.text}`}>Group {c.group}</span>
                <span className={`text-xs ${c.status === 'active' ? 'text-green-600' : 'text-orange-500'}`}>
                  {c.status === 'active' ? '● Active' : '◌ In Progress'}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {selectedCustomer ? (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {selectedCustomer.name[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GROUP_COLORS[selectedCustomer.group].bg} ${GROUP_COLORS[selectedCustomer.group].text}`}>
                    Group {selectedCustomer.group}
                  </span>
                  <span className={`text-xs ${selectedCustomer.status === 'active' ? 'text-green-600' : 'text-orange-500'}`}>
                    {selectedCustomer.status === 'active' ? '● Active' : '◌ Onboarding in Progress'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tickets */}
            <div className="card p-5 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Tickets ({customerTickets.length})</h3>
              {customerTickets.length === 0 ? (
                <p className="text-sm text-gray-400">No tickets</p>
              ) : (
                <div className="space-y-2">
                  {customerTickets.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{t.subject}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Assigned to {t.assignee} · {t.id}</p>
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

            {/* Notes */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-1">Customer Notes History</h3>
              <p className="text-xs text-gray-400 mb-4">All internal notes for this account, across all tickets</p>
              {allNotes.length === 0 ? (
                <p className="text-sm text-gray-400">No notes yet for this customer.</p>
              ) : (
                <div className="space-y-3">
                  {allNotes.map((n, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                        {n.author[0]}
                      </div>
                      <div className="flex-1 bg-amber-50 rounded-xl p-3 border border-amber-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-amber-800">{n.author}</span>
                          <span className="text-xs text-gray-400">{new Date(n.time).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                        </div>
                        <p className="text-sm text-gray-700">{n.text}</p>
                        <p className="text-xs text-gray-400 mt-1">Re: {n.ticketSubject}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-5xl mb-4">🏢</div>
            <p className="text-gray-500 text-sm">Select a customer to view their history</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Groups View (Leads only) ────────────────────────────────────────────────
function GroupsView({ tickets }) {
  return (
    <div className="p-6 overflow-y-auto h-screen">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Groups Overview</h2>
      <div className="grid grid-cols-2 gap-4 max-w-4xl">
        {[1,2,3,4].map(gId => {
          const g = GROUPS[gId]
          const gc = GROUP_COLORS[gId]
          const gTickets = tickets.filter(t => t.group === gId)
          const open = gTickets.filter(t => t.status === 'open').length
          const pending = gTickets.filter(t => t.status === 'pending').length
          const resolved = gTickets.filter(t => t.status === 'resolved').length
          const gCustomers = CUSTOMERS.filter(c => c.group === gId)

          return (
            <div key={gId} className={`card p-5 border-t-4 ${gc.border}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{g.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {g.members.length === 0 ? 'No agents assigned yet' : g.members.join(' & ')}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${gc.bg} ${gc.text}`}>
                  {gId}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
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
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">CUSTOMERS ({gCustomers.length})</p>
                {gCustomers.length === 0 ? (
                  <p className="text-xs text-gray-400">No customers assigned</p>
                ) : (
                  <div className="space-y-1.5">
                    {gCustomers.map(c => (
                      <div key={c.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${gc.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${gc.dot}`}></span>
                        <span className={`text-xs font-medium ${gc.text}`}>{c.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Simulate Incoming Email (Leads only) ────────────────────────────────────
function InboxView({ tickets, setTickets }) {
  const [form, setForm] = useState({
    from: '',
    customer: '',
    subject: '',
    body: '',
    group: 2,
    priority: 'medium',
  })
  const [sent, setSent] = useState(false)

  const submit = () => {
    if (!form.from || !form.subject || !form.body) return
    const newTicket = {
      id: `T-${String(tickets.length + 1).padStart(3, '0')}`,
      subject: form.subject,
      customer: form.customer || form.from,
      customerId: null,
      from: form.from,
      group: Number(form.group),
      status: 'open',
      priority: form.priority,
      assignee: null,
      createdAt: new Date().toISOString(),
      messages: [{ from: form.from, body: form.body, time: new Date().toISOString() }],
      notes: [],
    }
    setTickets([...tickets, newTicket])
    setSent(true)
    setTimeout(() => setSent(false), 3000)
    setForm({ from: '', customer: '', subject: '', body: '', group: 2, priority: 'medium' })
  }

  return (
    <div className="p-6 overflow-y-auto h-screen">
      <div className="max-w-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Simulate Incoming Email</h2>
        <p className="text-sm text-gray-500 mb-6">
          Mimics an email arriving at <span className="font-mono text-blue-600">supportteam@wellyx.com</span> — assign it to a group and it will appear in their ticket queue.
        </p>

        {sent && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
            ✅ Ticket created and routed successfully!
          </div>
        )}

        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">FROM (customer email)</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="client@business.com" value={form.from} onChange={e => setForm({...form, from: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">CUSTOMER NAME</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Business Name" value={form.customer} onChange={e => setForm({...form, customer: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">SUBJECT</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Issue subject..." value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">EMAIL BODY</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5} placeholder="Customer's message..." value={form.body} onChange={e => setForm({...form, body: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">ROUTE TO GROUP</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.group} onChange={e => setForm({...form, group: e.target.value})}>
                <option value={1}>Group 1 — (Pending)</option>
                <option value={2}>Group 2 — Casey & Aiden</option>
                <option value={3}>Group 3 — David & Henry</option>
                <option value={4}>Group 4 — Sarah & Andrew</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">PRIORITY</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <button onClick={submit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors">
            Route Ticket → Group {form.group}
          </button>
        </div>

        <div className="mt-6 card p-5 bg-blue-50 border border-blue-100">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 How routing works in production</h4>
          <ul className="text-xs text-blue-700 space-y-1.5 list-disc list-inside">
            <li>Email arrives at <span className="font-mono">supportteam@wellyx.com</span></li>
            <li>System matches the sender's domain to a pre-configured customer</li>
            <li>Ticket is automatically routed to that customer's assigned group</li>
            <li>Only that group sees and can reply to the ticket</li>
            <li>Leads (Rebecca & Steve) can see all tickets and reassign if needed</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('tickets')
  const [tickets, setTickets] = useState(TICKETS)

  if (!user) return <LoginScreen onLogin={setUser} />

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} view={view} setView={setView} onLogout={() => { setUser(null); setView('tickets') }} />
      <main className="flex-1 overflow-hidden">
        {view === 'tickets'   && <TicketsView   user={user} tickets={tickets} setTickets={setTickets} />}
        {view === 'customers' && <CustomersView user={user} tickets={tickets} />}
        {view === 'groups'    && user.role === 'lead' && <GroupsView tickets={tickets} />}
        {view === 'inbox'     && user.role === 'lead' && <InboxView  tickets={tickets} setTickets={setTickets} />}
      </main>
    </div>
  )
}
