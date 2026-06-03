/**
 * Dual-mode database adapter.
 * - DATABASE_URL set  →  Neon/Postgres (Vercel, any hosted Postgres)
 * - DATABASE_URL not set  →  SQLite via node:sqlite (local server)
 *
 * All exported helpers are async and return plain JS objects/arrays.
 * API routes call: const db = await getDb()
 */

import bcrypt from 'bcryptjs'

// ─── Adapter factory ──────────────────────────────────────────────────────────

let _db = null

export async function getDb() {
  if (_db) return _db
  if (process.env.DATABASE_URL) {
    _db = await buildPgAdapter()
  } else {
    _db = buildSqliteAdapter()
  }
  await _db.init()
  return _db
}

// ─── Postgres adapter (Neon / any Postgres) ───────────────────────────────────

async function buildPgAdapter() {
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  function toNumbered(query, params) {
    let i = 0
    return query.replace(/\?/g, () => `$${++i}`)
  }

  async function query(q, p = []) {
    return sql(toNumbered(q, p), p)
  }

  async function queryOne(q, p = []) {
    const rows = await query(q, p)
    return rows[0] ?? null
  }

  async function execute(q, p = []) {
    const isInsert = q.trim().toUpperCase().startsWith('INSERT')
    const final = isInsert ? toNumbered(q, p) + ' RETURNING id' : toNumbered(q, p)
    const rows = await sql(final, p)
    return { lastId: rows[0]?.id ?? null }
  }

  async function exec(q) { await sql(q) }

  const SCHEMA_PG = `
    CREATE TABLE IF NOT EXISTS groups (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      color      TEXT NOT NULL DEFAULT '#6366f1',
      email      TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      role          TEXT NOT NULL CHECK(role IN ('admin','lead','agent')),
      group_id      INTEGER REFERENCES groups(id) ON DELETE SET NULL,
      password_hash TEXT NOT NULL,
      email         TEXT,
      active        INTEGER NOT NULL DEFAULT 1,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS customers (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      group_id   INTEGER REFERENCES groups(id) ON DELETE SET NULL,
      status     TEXT NOT NULL DEFAULT 'active',
      email      TEXT,
      plan       TEXT NOT NULL DEFAULT 'Excel',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS tickets (
      id          TEXT PRIMARY KEY,
      subject     TEXT NOT NULL,
      customer    TEXT,
      customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
      from_email  TEXT,
      group_id    INTEGER REFERENCES groups(id) ON DELETE SET NULL,
      status      TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','pending','resolved')),
      priority    TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
      assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id         SERIAL PRIMARY KEY,
      ticket_id  TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      from_email TEXT NOT NULL,
      body       TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ticket_notes (
      id         SERIAL PRIMARY KEY,
      ticket_id  TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      author     TEXT NOT NULL,
      body       TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS emails (
      id          TEXT PRIMARY KEY,
      read        INTEGER NOT NULL DEFAULT 0,
      starred     INTEGER NOT NULL DEFAULT 0,
      from_email  TEXT NOT NULL,
      from_name   TEXT,
      subject     TEXT NOT NULL,
      preview     TEXT,
      body        TEXT,
      group_id    INTEGER REFERENCES groups(id) ON DELETE SET NULL,
      customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
      thread_id   TEXT,
      outlook_id  TEXT UNIQUE,
      received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS login_attempts (
      id         SERIAL PRIMARY KEY,
      username   TEXT NOT NULL,
      ip         TEXT,
      success    INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  return {
    mode: 'postgres',
    query,
    queryOne,
    execute,
    exec,
    async init() {
      for (const stmt of SCHEMA_PG.split(';').map(s => s.trim()).filter(Boolean)) {
        await exec(stmt)
      }
    },
  }
}

// ─── SQLite adapter (local Node.js server) ────────────────────────────────────

function buildSqliteAdapter() {
  const { DatabaseSync } = require('node:sqlite')
  const fs = require('node:fs')
  const path = require('node:path')

  function resolveDbPath() {
    if (process.env.DB_PATH) {
      try { fs.mkdirSync(path.dirname(process.env.DB_PATH), { recursive: true }) } catch (_) {}
      return process.env.DB_PATH
    }
    const candidates = [
      '/tmp/wellyx.db',
      path.join(process.cwd(), 'data', 'wellyx.db'),
      '/var/data/wellyx.db',
    ]
    for (const p of candidates) {
      try {
        const dir = path.dirname(p)
        try { fs.mkdirSync(dir, { recursive: true }) } catch (_) {}
        fs.writeFileSync(p + '.test', '')
        fs.unlinkSync(p + '.test')
        return p
      } catch (_) {}
    }
    throw new Error('No writable DB path found. Set DB_PATH env var.')
  }

  const dbPath = resolveDbPath()
  const raw = new DatabaseSync(dbPath)
  raw.exec('PRAGMA journal_mode = WAL')
  raw.exec('PRAGMA foreign_keys = ON')

  function query(q, p = []) {
    return Promise.resolve(raw.prepare(q).all(...p))
  }

  function queryOne(q, p = []) {
    return Promise.resolve(raw.prepare(q).get(...p) ?? null)
  }

  function execute(q, p = []) {
    const r = raw.prepare(q).run(...p)
    return Promise.resolve({ lastId: r.lastInsertRowid ?? null })
  }

  function exec(q) { raw.exec(q); return Promise.resolve() }

  const SCHEMA_SQLITE = `
    CREATE TABLE IF NOT EXISTS groups (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1',
      email TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      role          TEXT NOT NULL CHECK(role IN ('admin','lead','agent')),
      group_id      INTEGER REFERENCES groups(id) ON DELETE SET NULL,
      password_hash TEXT NOT NULL,
      email         TEXT,
      active        INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS customers (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      group_id   INTEGER REFERENCES groups(id) ON DELETE SET NULL,
      status     TEXT NOT NULL DEFAULT 'active',
      email      TEXT,
      plan       TEXT NOT NULL DEFAULT 'Excel',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tickets (
      id          TEXT PRIMARY KEY,
      subject     TEXT NOT NULL,
      customer    TEXT,
      customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
      from_email  TEXT,
      group_id    INTEGER REFERENCES groups(id) ON DELETE SET NULL,
      status      TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','pending','resolved')),
      priority    TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
      assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id  TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      from_email TEXT NOT NULL,
      body       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS ticket_notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id  TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      author     TEXT NOT NULL,
      body       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS emails (
      id          TEXT PRIMARY KEY,
      read        INTEGER NOT NULL DEFAULT 0,
      starred     INTEGER NOT NULL DEFAULT 0,
      from_email  TEXT NOT NULL,
      from_name   TEXT,
      subject     TEXT NOT NULL,
      preview     TEXT,
      body        TEXT,
      group_id    INTEGER REFERENCES groups(id) ON DELETE SET NULL,
      customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
      thread_id   TEXT,
      outlook_id  TEXT UNIQUE,
      received_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS login_attempts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT NOT NULL,
      ip         TEXT,
      success    INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `

  return {
    mode: 'sqlite',
    query,
    queryOne,
    execute,
    exec,
    async init() {
      for (const stmt of SCHEMA_SQLITE.split(';').map(s => s.trim()).filter(Boolean)) {
        try { raw.exec(stmt) } catch (_) {}
      }
    },
  }
}

// ─── Shared query helpers (all async) ─────────────────────────────────────────

export async function hasUsers(db) {
  const row = await db.queryOne('SELECT COUNT(*) as n FROM users')
  return Number(row?.n ?? 0) > 0
}

export async function getUserById(db, id) {
  return db.queryOne('SELECT * FROM users WHERE id = ?', [id])
}

export async function getGroups(db) {
  return db.query('SELECT * FROM groups ORDER BY id')
}

export async function getUsers(db) {
  return db.query(`
    SELECT u.id, u.name, u.role, u.group_id, u.email, u.active, u.created_at,
           g.name as group_name
    FROM users u LEFT JOIN groups g ON u.group_id = g.id
    ORDER BY u.role, u.name
  `)
}

export async function getCustomers(db, groupId = null) {
  if (groupId) return db.query('SELECT * FROM customers WHERE group_id = ? ORDER BY name', [groupId])
  return db.query('SELECT * FROM customers ORDER BY name')
}

export async function getTickets(db, groupId = null) {
  const q = `
    SELECT t.*, g.name as group_name, u.name as assignee_name
    FROM tickets t
    LEFT JOIN groups g ON t.group_id = g.id
    LEFT JOIN users u ON t.assignee_id = u.id
    ${groupId ? 'WHERE t.group_id = ?' : ''}
    ORDER BY t.updated_at DESC
  `
  return groupId ? db.query(q, [groupId]) : db.query(q)
}

export async function getTicketById(db, id) {
  const ticket = await db.queryOne(`
    SELECT t.*, g.name as group_name, u.name as assignee_name
    FROM tickets t
    LEFT JOIN groups g ON t.group_id = g.id
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.id = ?
  `, [id])
  if (!ticket) return null
  ticket.messages = await db.query('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at', [id])
  ticket.notes    = await db.query('SELECT * FROM ticket_notes    WHERE ticket_id = ? ORDER BY created_at', [id])
  return ticket
}

export async function getEmails(db, groupId = null) {
  const q = `
    SELECT e.*, g.name as group_name
    FROM emails e LEFT JOIN groups g ON e.group_id = g.id
    ${groupId ? 'WHERE e.group_id = ?' : ''}
    ORDER BY e.received_at DESC
  `
  return groupId ? db.query(q, [groupId]) : db.query(q)
}

export async function nextTicketId(db) {
  const last = await db.queryOne('SELECT id FROM tickets ORDER BY created_at DESC LIMIT 1')
  if (!last) return 'T-001'
  const n = parseInt(last.id.replace('T-', ''), 10)
  return `T-${String(n + 1).padStart(3, '0')}`
}

export async function createUser(db, { id, name, role, groupId, password, email }) {
  const hash = await bcrypt.hash(String(password).slice(0, 256), 10)
  await db.execute(
    'INSERT INTO users (id, name, role, group_id, password_hash, email) VALUES (?,?,?,?,?,?)',
    [id, name, role, groupId || null, hash, email || null]
  )
  return db.queryOne('SELECT id,name,role,group_id,email,active,created_at FROM users WHERE id = ?', [id])
}
