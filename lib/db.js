import { DatabaseSync } from 'node:sqlite'
import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'

let _db = null

export function getDb() {
  if (_db) return _db

  // Use DB_PATH env var if set, otherwise find a writable location
  let dbPath = process.env.DB_PATH
  if (!dbPath) {
    const candidates = [
      path.join(process.cwd(), 'data', 'wellyx.db'),
      '/var/data/wellyx.db',
      '/tmp/wellyx.db',
    ]
    for (const candidate of candidates) {
      try {
        fs.mkdirSync(path.dirname(candidate), { recursive: true })
        dbPath = candidate
        break
      } catch {
        // try next location
      }
    }
    if (!dbPath) throw new Error('Cannot find a writable directory for the database. Set DB_PATH env var.')
  } else {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  }

  _db = new DatabaseSync(dbPath)
  _db.exec('PRAGMA journal_mode = WAL')
  _db.exec('PRAGMA foreign_keys = ON')

  initSchema(_db)
  seedIfEmpty(_db)
  return _db
}

function initSchema(db) {
  db.exec(`
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
      plan       TEXT NOT NULL DEFAULT 'Starter',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id           TEXT PRIMARY KEY,
      subject      TEXT NOT NULL,
      customer     TEXT,
      customer_id  TEXT REFERENCES customers(id) ON DELETE SET NULL,
      from_email   TEXT,
      group_id     INTEGER REFERENCES groups(id) ON DELETE SET NULL,
      status       TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','pending','resolved')),
      priority     TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
      assignee_id  TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
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

function seedIfEmpty(db) {
  const { n } = db.prepare('SELECT COUNT(*) as n FROM groups').get()
  if (n > 0) return

  const hash = (p) => bcrypt.hashSync(p, 10)
  const ago  = (h) => new Date(Date.now() - h * 3600000).toISOString()

  // Groups
  const ig = db.prepare('INSERT INTO groups (name, color, email) VALUES (?,?,?)')
  ig.run('Onboarding', '#6366f1', 'onboarding@wellyx.com')
  ig.run('Technical',  '#0ea5e9', 'technical@wellyx.com')
  ig.run('Billing',    '#10b981', 'billing@wellyx.com')
  ig.run('Enterprise', '#f59e0b', 'enterprise@wellyx.com')

  // Users — initial password: Wellyx2024!
  const pw = hash('Wellyx2024!')
  const iu = db.prepare('INSERT INTO users (id,name,role,group_id,password_hash,email) VALUES (?,?,?,?,?,?)')
  iu.run('rebecca', 'Rebecca', 'admin', null, pw, 'rebecca@wellyx.com')
  iu.run('mark',    'Mark',    'admin', null, pw, 'mark@wellyx.com')
  iu.run('steve',   'Steve',   'admin', null, pw, 'steve@wellyx.com')
  iu.run('casey',   'Casey',   'lead',  2,    pw, 'casey@wellyx.com')
  iu.run('aidan',   'Aidan',   'agent', 2,    pw, 'aidan@wellyx.com')
  iu.run('amy',     'Amy',     'agent', 2,    pw, 'amy@wellyx.com')
  iu.run('david',   'David',   'agent', 3,    pw, 'david@wellyx.com')
  iu.run('henry',   'Henry',   'agent', 3,    pw, 'henry@wellyx.com')
  iu.run('andrew',  'Andrew',  'agent', 4,    pw, 'andrew@wellyx.com')
  iu.run('sarah',   'Sarah',   'agent', 4,    pw, 'sarah@wellyx.com')

  // Customers
  const ic = db.prepare('INSERT INTO customers (id,name,group_id,status,email,plan) VALUES (?,?,?,?,?,?)')
  ic.run('c1',  'Bianco Fitness',        2, 'active',      'admin@biancofitness.com',    'Pro')
  ic.run('c2',  'Luna Ballroom',         4, 'in_progress', 'finance@lunaballroom.com',   'Enterprise')
  ic.run('c3',  'Windsor Athletic Club', 4, 'in_progress', 'manager@windsorathletic.com','Enterprise')
  ic.run('c4',  'Peak Performance Gym',  3, 'active',      'ops@peakperformance.com',   'Pro')
  ic.run('c5',  'Sunrise Yoga Studio',   2, 'active',      'hello@sunriseyoga.com',     'Starter')
  ic.run('c6',  'Iron Forge CrossFit',   3, 'active',      'info@ironforge.com',        'Pro')
  ic.run('c7',  'Flex Athletics',        1, 'in_progress', 'setup@flexathletics.com',   'Pro')
  ic.run('c8',  'Aqua Sports Centre',    1, 'in_progress', 'admin@aquasports.co.uk',    'Starter')
  ic.run('c9',  'PowerHouse Gym',        2, 'active',      'it@powerhousegym.com',      'Pro')
  ic.run('c10', 'Champions Boxing Club', 3, 'active',      'owner@championsboxing.com', 'Starter')
  ic.run('c11', 'Elite Sports Academy',  4, 'active',      'contact@elitesports.com',   'Enterprise')
  ic.run('c12', 'Zen Flow Pilates',      2, 'active',      'hello@zenflow.com',         'Starter')

  // Tickets
  const it  = db.prepare('INSERT INTO tickets (id,subject,customer,customer_id,from_email,group_id,status,priority,assignee_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
  const im  = db.prepare('INSERT INTO ticket_messages (ticket_id,from_email,body,created_at) VALUES (?,?,?,?)')
  const inn = db.prepare('INSERT INTO ticket_notes (ticket_id,author,body,created_at) VALUES (?,?,?,?)')

  it.run('T-001','Cannot access member portal after update','Bianco Fitness','c1','admin@biancofitness.com',2,'open','high','casey',ago(26),ago(24))
  im.run('T-001','admin@biancofitness.com','Hi, since the latest update our members cannot log into the portal. This is affecting 200+ members. Please help urgently.',ago(26))
  im.run('T-001','casey@wellyx.com','Hi, thanks for reaching out. I am looking into this right now and will update you within the hour.',ago(25))
  im.run('T-001','admin@biancofitness.com','Thank you Casey. Our front desk staff are fielding a lot of complaints. Any update?',ago(24))
  inn.run('T-001','Casey','Confirmed issue — token expiry bug in v2.3.1. Escalated to dev.',ago(25))

  it.run('T-002','Billing discrepancy on March invoice','Luna Ballroom','c2','finance@lunaballroom.com',4,'pending','medium','andrew',ago(34),ago(33))
  im.run('T-002','finance@lunaballroom.com','We noticed our March invoice shows an extra charge of $149. Can you clarify what this is for?',ago(34))
  im.run('T-002','andrew@wellyx.com','Hi! I am reviewing your account now. I will have a full breakdown for you within 2 hours.',ago(33))
  inn.run('T-002','Andrew','Extra charge was for additional location added mid-month. Need to confirm with them.',ago(33))

  it.run('T-003','Schedule module not syncing with Google Calendar','Peak Performance Gym','c4','ops@peakperformance.com',3,'open','medium','david',ago(13),ago(13))
  im.run('T-003','ops@peakperformance.com',"Our trainers' class schedules are not showing up in Google Calendar anymore. This started 2 days ago.",ago(13))

  it.run('T-004','Request to add 3 new staff accounts','Windsor Athletic Club','c3','manager@windsorathletic.com',4,'resolved','low','andrew',ago(72),ago(70))
  im.run('T-004','manager@windsorathletic.com','Please add 3 new staff accounts: Tom Hall, Jenny Park, and Marcus Lee.',ago(72))
  im.run('T-004','andrew@wellyx.com','Done! All 3 accounts have been created and welcome emails sent.',ago(70))
  inn.run('T-004','Andrew','Accounts created. Welcome emails sent.',ago(70))

  it.run('T-005','Mobile app crashing on check-in','Sunrise Yoga Studio','c5','hello@sunriseyoga.com',2,'open','high','aidan',ago(12),ago(12))
  im.run('T-005','hello@sunriseyoga.com','The mobile app crashes every time our staff tries to check in a member. Started this morning.',ago(12))

  it.run('T-006','API rate limiting affecting POS integration','Iron Forge CrossFit','c6','info@ironforge.com',3,'open','high','henry',ago(8),ago(6))
  im.run('T-006','info@ironforge.com','Our POS integration is hitting API rate limits during peak hours (6-8pm). We process about 400 transactions per hour.',ago(8))
  im.run('T-006','henry@wellyx.com','Thanks for reporting this. I can see your API usage spiking around those hours. Let me look into increasing your rate limit.',ago(7))
  im.run('T-006','info@ironforge.com','Appreciate it. Any timeline on a fix? This is costing us a lot during peak.',ago(6))
  inn.run('T-006','Henry','Rate limit currently 300 req/min, they need ~450. Requesting increase from infra team.',ago(7))

  it.run('T-007','Need data export for annual audit','Elite Sports Academy','c11','contact@elitesports.com',4,'pending','medium','casey',ago(48),ago(10))
  im.run('T-007','contact@elitesports.com','We need a full data export of all member transactions and staff activity logs for our annual audit.',ago(48))
  im.run('T-007','casey@wellyx.com','Hi! I can help with this. The export will take about 30 minutes. I will email it once ready.',ago(47))
  inn.run('T-007','Casey','Large export ~2.3GB. Using async export pipeline.',ago(47))

  it.run('T-008','Payment gateway error - transactions declined','Bianco Fitness','c1','admin@biancofitness.com',2,'open','high','amy',ago(4),ago(3))
  im.run('T-008','admin@biancofitness.com','URGENT: All card payments are being declined since 2pm. Members cannot pay for memberships or classes.',ago(4))
  im.run('T-008','amy@wellyx.com','I see this - our payment processor is showing elevated declines. I am escalating immediately.',ago(3.5))
  inn.run('T-008','Amy','Stripe showing webhook failures. Payments team paged. Incident #2847 opened.',ago(3.5))

  it.run('T-009','Setup help: importing existing member database','Flex Athletics','c7','setup@flexathletics.com',1,'open','medium','casey',ago(18),ago(16))
  im.run('T-009','setup@flexathletics.com','Hi we are new to Wellyx. We have an existing member database in Excel with about 850 members. How do we import this?',ago(18))
  im.run('T-009','casey@wellyx.com','Welcome to Wellyx! We have a bulk import tool. I will send you our Excel template to format your data.',ago(17))
  inn.run('T-009','Casey','New customer. Template sent. CC data requires Stripe migration tool.',ago(17))

  it.run('T-010','Class booking widget not appearing on website','Zen Flow Pilates','c12','hello@zenflow.com',2,'open','medium','casey',ago(20),ago(18))
  im.run('T-010','hello@zenflow.com','We embedded the class booking widget on our website but it is showing a blank white box.',ago(20))
  im.run('T-010','casey@wellyx.com','Can you share your website URL and the embed code you used? I will take a look.',ago(19))
  inn.run('T-010','Casey','CSP issue on their Squarespace site. Need to whitelist our domain.',ago(18))

  it.run('T-011','Payroll integration setup - ADP','Windsor Athletic Club','c3','manager@windsorathletic.com',4,'pending','low','andrew',ago(55),ago(49))
  im.run('T-011','manager@windsorathletic.com','We use ADP for payroll and want to integrate it with Wellyx staff scheduling. Is this possible?',ago(55))
  im.run('T-011','andrew@wellyx.com','Yes! We have native ADP integration. Can you confirm you have admin access to your ADP account?',ago(54))
  inn.run('T-011','Andrew','Setup guide emailed. Waiting for them to confirm setup started.',ago(49))

  it.run('T-012','Attendance reports showing wrong totals','Champions Boxing Club','c10','owner@championsboxing.com',3,'open','medium','henry',ago(9),ago(7))
  im.run('T-012','owner@championsboxing.com','The monthly attendance report for March shows 1,247 visits but our manual count is closer to 1,180.',ago(9))
  im.run('T-012','henry@wellyx.com','Hi! I am looking into this now. The discrepancy could be due to how cancelled sessions are counted.',ago(8))
  inn.run('T-012','Henry','Drop-ins are being double-counted. Known issue, patch in next release.',ago(8))

  it.run('T-013','Custom branding - logo not updating in app','Aqua Sports Centre','c8','admin@aquasports.co.uk',1,'resolved','low','amy',ago(96),ago(72))
  im.run('T-013','admin@aquasports.co.uk','We uploaded our new logo in Settings > Branding but the app still shows the old logo.',ago(96))
  im.run('T-013','amy@wellyx.com','Hi! Logo changes can take up to 24h to propagate due to CDN caching.',ago(95))
  im.run('T-013','admin@aquasports.co.uk','All sorted now, the new logo is showing. Thank you!',ago(72))
  inn.run('T-013','Amy','Resolved - CDN cache cleared naturally within 24h.',ago(95))

  it.run('T-014','GDPR data deletion request - 3 members','Luna Ballroom','c2','finance@lunaballroom.com',4,'open','high','andrew',ago(6),ago(6))
  im.run('T-014','finance@lunaballroom.com','We have received GDPR right-to-erasure requests from 3 former members. Please process these asap.',ago(6))

  it.run('T-015','Two-factor authentication not sending SMS','PowerHouse Gym','c9','it@powerhousegym.com',2,'open','high','aidan',ago(5),ago(4))
  im.run('T-015','it@powerhousegym.com','We enabled 2FA for all staff last week. Several staff members are not receiving the SMS verification codes.',ago(5))
  im.run('T-015','aidan@wellyx.com','I see this in the logs - looks like SMS delivery failures for +44 numbers. Are these UK numbers?',ago(4.5))
  inn.run('T-015','Aidan','UK SMS routing issue via Twilio. Fallback to email OTP offered as workaround.',ago(4.5))

  it.run('T-016','Membership plan pricing not matching website','Peak Performance Gym','c4','ops@peakperformance.com',3,'resolved','medium','david',ago(120),ago(118))
  im.run('T-016','ops@peakperformance.com','Our annual membership shows £480/year in Wellyx but we advertise £45/month (£540/year).',ago(120))
  im.run('T-016','david@wellyx.com','I checked your plan settings. The annual rate was set to £480 when configured. I have updated it to £540.',ago(119))
  im.run('T-016','ops@peakperformance.com','Yes that is correct! Thank you for sorting that out so quickly.',ago(118))
  inn.run('T-016','David','Price corrected. Was set incorrectly during initial setup.',ago(119))

  // Inbox emails
  const ie = db.prepare('INSERT INTO emails (id,read,starred,from_email,from_name,subject,preview,body,group_id,customer_id,thread_id,received_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')

  ie.run('e-001',0,0,'admin@biancofitness.com','Mike Chen','Re: Can we schedule a training call?','Hi Rebecca, Thursday at 2pm works perfectly for our team...',
    'Hi Rebecca,\n\nThursday at 2pm works perfectly for our team. We will have our gym manager, front desk lead, and our IT person on the call.\n\nA few things we\'d like to cover:\n1. Staff training on the new booking system\n2. Setting up automated payment reminders\n3. The reporting dashboard - we want to build a custom weekly report\n\nLooking forward to it!\n\nBest,\nMike Chen\nBianco Fitness',
    2,'c1','th-a1',ago(0.5))

  ie.run('e-002',0,1,'ceo@elitesports.com','Diana Hartley','Contract renewal - looking to expand to 5 more locations',"Diana Hartley from Elite Sports Academy. Our contract is up in 60 days...",
    "Hello,\n\nI'm Diana Hartley, CEO of Elite Sports Academy. Our contract with Wellyx is up for renewal in 60 days and I wanted to open the conversation early.\n\nWe've been very happy with the service and are actually looking to expand - we're opening 5 new locations across the Midlands over the next 18 months.\n\nCan we arrange a call with your enterprise team?\n\nBest regards,\nDiana Hartley\nCEO, Elite Sports Academy",
    4,'c11','th-b1',ago(1))

  ie.run('e-003',1,0,'setup@flexathletics.com',"Kevin O'Brien",'Excel template - column mapping question',"We received the template but column D says 'member_type' - what are the valid values?",
    "Hi,\n\nWe received the import template, thanks! We have a question about column D which says 'member_type'. What are the valid values?\n\nWe have members categorised as: Full Member, Student, Senior, Corporate, Family, Day Pass.\n\nThanks,\nKevin O'Brien\nFlex Athletics",
    1,'c7','th-c1',ago(2))

  ie.run('e-004',0,0,'finance@lunaballroom.com','Rachel Osei','Invoice dispute - awaiting credit note','Following up on T-002. We were told a credit note would be issued...',
    "Hello,\n\nI am following up on ticket T-002 regarding the billing discrepancy on our March invoice.\n\nYour agent confirmed last week that we would receive a credit note for the erroneous £149 charge. We have not received this yet.\n\nKind regards,\nRachel Osei\nFinance Manager, Luna Ballroom",
    4,'c2','th-d1',ago(3))

  ie.run('e-005',1,0,'it@powerhousegym.com','Sam Reeves','SMS 2FA - email fallback works but prefer SMS','The email OTP workaround is working for our staff but SMS is much quicker for them...',
    "Hi,\n\nThe email OTP workaround is working for our staff but SMS is much quicker for them.\n\nIs there a timeline for when the UK SMS issue will be resolved?\n\nThanks,\nSam Reeves\nIT Manager, PowerHouse Gym",
    2,'c9','th-e1',ago(5))

  ie.run('e-006',0,0,'owner@championsboxing.com','Tony Braga','March report still wrong after your update','Hi, I refreshed the report as you suggested but still showing 1,247...',
    "Hi,\n\nI refreshed the report as you suggested but still showing 1,247 visits rather than the correct ~1,180.\n\nThis is causing issues for us as we use this report for our investor updates. Our investor meeting is on the 25th.\n\nTony Braga\nChampions Boxing Club",
    3,'c10','th-f1',ago(6))

  ie.run('e-007',1,1,'hello@sunriseyoga.com','Priya Nair','App crash - still happening, video attached','Hi, the app is still crashing. I recorded a screen capture showing the exact crash...',
    "Hi,\n\nThe app is still crashing. The crash happens specifically when:\n1. Staff tap \"Check In\"\n2. The QR scanner opens\n3. They scan a member QR code\n4. It shows the member details for about 1 second then crashes\n\nThis is happening on both our iPads (iOS 17.4) and on Android.\n\nPriya Nair\nSunrise Yoga Studio",
    2,'c5','th-g1',ago(8))

  ie.run('e-008',0,0,'info@ironforge.com','Jake Marsh','Rate limit increase - any update?','Hi, just following up on the rate limit request. Still hitting limits...',
    "Hi,\n\nJust following up on the rate limit request from yesterday. We're still hitting the limits tonight during our evening rush.\n\nJake Marsh\nIron Forge CrossFit",
    3,'c6','th-h1',ago(4))

  ie.run('e-009',1,0,'admin@aquasports.co.uk','Claire Thompson','Question about swim lane booking feature','Hi, we would like to enable lane booking for our swim sessions. Does Wellyx support this?',
    "Hi,\n\nNow that our branding is all set up, we are ready to start exploring more features.\n\nWe run 8 swim lanes and would like members to be able to book specific lanes online. Does Wellyx support this kind of resource booking?\n\nClaire Thompson\nAqua Sports Centre",
    1,'c8','th-i1',ago(20))

  ie.run('e-010',0,0,'hello@zenflow.com','Maria Santos','Widget now showing! But one more issue','The booking widget is now working on our site. However, the time slots are showing in UTC...',
    "Hi,\n\nGreat news - the booking widget is now working on our site after we added the Wellyx domain to our CSP whitelist.\n\nHowever, the time slots are showing in UTC rather than our local time (GMT+1 BST).\n\nMaria Santos\nZen Flow Pilates",
    2,'c12','th-j1',ago(2))

  ie.run('e-011',1,0,'manager@windsorathletic.com','Paul Winters','ADP integration - getting error code WX-4421','Hi, I followed the setup guide but getting error WX-4421 at step 6...',
    "Hi,\n\nI followed the setup guide for the ADP integration but I'm getting an error at step 6 when I try to authorise the connection.\n\nThe error message says: \"Error WX-4421: Unable to establish connection.\"\n\nPaul Winters\nWindsor Athletic Club",
    4,'c3','th-k1',ago(12))

  ie.run('e-012',0,0,'ops@peakperformance.com','James Carter','New issue: Reports showing previous month data','Hi, we have a new problem. The April reports are showing March data...',
    "Hi,\n\nThanks again for fixing the pricing issue quickly!\n\nWe have a new problem though. The April attendance and revenue reports appear to be showing March data.\n\nJames Carter\nOperations Manager, Peak Performance Gym",
    3,'c4','th-l1',ago(1))
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
    FROM tickets t LEFT JOIN groups g ON t.group_id = g.id LEFT JOIN users u ON t.assignee_id = u.id
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
  const last = db.prepare("SELECT id FROM tickets ORDER BY rowid DESC LIMIT 1").get()
  if (!last) return 'T-001'
  const n = parseInt(last.id.replace('T-', ''), 10)
  return `T-${String(n + 1).padStart(3, '0')}`
}
