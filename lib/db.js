import { DatabaseSync } from 'node:sqlite'
import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'

let _db = null

function resolveDbPath() {
  // Explicit override always wins
  if (process.env.DB_PATH) {
    try { fs.mkdirSync(path.dirname(process.env.DB_PATH), { recursive: true }) } catch (_) {}
    return process.env.DB_PATH
  }

  // Test each candidate by actually writing a file
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
    } catch (_) { /* try next */ }
  }
  throw new Error(
    'No writable location found for the database.\n' +
    'Set the DB_PATH environment variable to a writable file path, e.g.:\n' +
    '  DB_PATH=/home/ubuntu/wellyx.db'
  )
}

export function getDb() {
  if (_db) return _db
  const dbPath = resolveDbPath()
  _db = new DatabaseSync(dbPath)
  _db.exec('PRAGMA journal_mode = WAL')
  _db.exec('PRAGMA foreign_keys = ON')
  initSchema(_db)
  return _db
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      color      TEXT NOT NULL DEFAULT '#6366f1',
      email      TEXT,
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
  `)
}

// ─── Query helpers ────────────────────────────────────────────────────────────

export function getGroups(db) {
  return db.prepare('SELECT * FROM groups ORDER BY id').all()
}

export function getUsers(db) {
  return db.prepare(`
    SELECT u.id, u.name, u.role, u.group_id, u.email, u.active, u.created_at,
           g.name as group_name
    FROM users u LEFT JOIN groups g ON u.group_id = g.id
    ORDER BY u.role, u.name
  `).all()
}

export function getUserById(db, id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
}

export function getCustomers(db, groupId = null) {
  if (groupId) return db.prepare('SELECT * FROM customers WHERE group_id = ? ORDER BY name').all(groupId)
  return db.prepare('SELECT * FROM customers ORDER BY name').all()
}

export function getTickets(db, groupId = null) {
  const q = `
    SELECT t.*, g.name as group_name, u.name as assignee_name
    FROM tickets t
    LEFT JOIN groups g ON t.group_id = g.id
    LEFT JOIN users u ON t.assignee_id = u.id
    ${groupId ? 'WHERE t.group_id = ?' : ''}
    ORDER BY t.updated_at DESC
  `
  return groupId ? db.prepare(q).all(groupId) : db.prepare(q).all()
}

export function getTicketById(db, id) {
  const ticket = db.prepare(`
    SELECT t.*, g.name as group_name, u.name as assignee_name
    FROM tickets t
    LEFT JOIN groups g ON t.group_id = g.id
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.id = ?
  `).get(id)
  if (!ticket) return null
  ticket.messages = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at').all(id)
  ticket.notes    = db.prepare('SELECT * FROM ticket_notes    WHERE ticket_id = ? ORDER BY created_at').all(id)
  return ticket
}

export function getEmails(db, groupId = null) {
  const q = `
    SELECT e.*, g.name as group_name
    FROM emails e LEFT JOIN groups g ON e.group_id = g.id
    ${groupId ? 'WHERE e.group_id = ?' : ''}
    ORDER BY e.received_at DESC
  `
  return groupId ? db.prepare(q).all(groupId) : db.prepare(q).all()
}

export function nextTicketId(db) {
  const last = db.prepare('SELECT id FROM tickets ORDER BY rowid DESC LIMIT 1').get()
  if (!last) return 'T-001'
  const n = parseInt(last.id.replace('T-', ''), 10)
  return `T-${String(n + 1).padStart(3, '0')}`
}

export function hasUsers(db) {
  return db.prepare('SELECT COUNT(*) as n FROM users').get().n > 0
}

export async function createUser(db, { id, name, role, groupId, password, email }) {
  const hash = await bcrypt.hash(String(password).slice(0, 256), 10)
  db.prepare(
    'INSERT INTO users (id, name, role, group_id, password_hash, email) VALUES (?,?,?,?,?,?)'
  ).run(id, name, role, groupId || null, hash, email || null)
  return db.prepare('SELECT id,name,role,group_id,email,active,created_at FROM users WHERE id = ?').get(id)
}
