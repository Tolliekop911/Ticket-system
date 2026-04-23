'use client'
import { useState, useRef, useEffect } from "react"

// ─── DATA ─────────────────────────────────────────────────────────────────────

const USERS = {
  rebecca: { id: 'rebecca', name: 'Rebecca', role: 'lead', group: null, password: 'demo123' },
  mark:    { id: 'mark',    name: 'Mark',    role: 'lead', group: null, password: 'demo123' },
  steve:   { id: 'steve',   name: 'Steve',   role: 'lead', group: null, password: 'demo123' },
  casey:   { id: 'casey',   name: 'Casey',   role: 'agent', group: 2, password: 'demo123' },
  aidan:   { id: 'aidan',   name: 'Aidan',   role: 'agent', group: 2, password: 'demo123' },
  amy:     { id: 'amy',     name: 'Amy',     role: 'agent', group: 2, password: 'demo123' },
  david:   { id: 'david',   name: 'David',   role: 'agent', group: 3, password: 'demo123' },
  henry:   { id: 'henry',   name: 'Henry',   role: 'agent', group: 3, password: 'demo123' },
  andrew:  { id: 'andrew',  name: 'Andrew',  role: 'agent', group: 4, password: 'demo123' },
}

const GROUPS = {
  1: { id: 1, name: 'Onboarding', members: [],                    color: '#6366f1', email: 'onboarding@wellyx.com' },
  2: { id: 2, name: 'Technical',  members: ['Casey','Aidan','Amy'], color: '#0ea5e9', email: 'technical@wellyx.com' },
  3: { id: 3, name: 'Billing',    members: ['David','Henry'],       color: '#10b981', email: 'billing@wellyx.com' },
  4: { id: 4, name: 'Enterprise', members: ['Andrew'],              color: '#f59e0b', email: 'enterprise@wellyx.com' },
}

const GROUP_COLORS = {
  1: { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500', border: 'border-violet-300', hex: '#6366f1' },
  2: { bg: 'bg-sky-100',    text: 'text-sky-700',    dot: 'bg-sky-500',    border: 'border-sky-300',    hex: '#0ea5e9' },
  3: { bg: 'bg-emerald-100',text: 'text-emerald-700',dot: 'bg-emerald-500',border: 'border-emerald-300',hex: '#10b981' },
  4: { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500',  border: 'border-amber-300',  hex: '#f59e0b' },
}

const CUSTOMERS = [
  { id: 'c1',  name: 'Bianco Fitness',        group: 2, status: 'active',      email: 'admin@biancofitness.com',    plan: 'Pro' },
  { id: 'c2',  name: 'Luna Ballroom',          group: 4, status: 'in_progress', email: 'finance@lunaballroom.com',   plan: 'Enterprise' },
  { id: 'c3',  name: 'Windsor Athletic Club',  group: 4, status: 'in_progress', email: 'manager@windsorathletic.com',plan: 'Enterprise' },
  { id: 'c4',  name: 'Peak Performance Gym',   group: 3, status: 'active',      email: 'ops@peakperformance.com',   plan: 'Pro' },
  { id: 'c5',  name: 'Sunrise Yoga Studio',    group: 2, status: 'active',      email: 'hello@sunriseyoga.com',     plan: 'Starter' },
  { id: 'c6',  name: 'Iron Forge CrossFit',    group: 3, status: 'active',      email: 'info@ironforge.com',        plan: 'Pro' },
  { id: 'c7',  name: 'Flex Athletics',         group: 1, status: 'in_progress', email: 'setup@flexathletics.com',   plan: 'Pro' },
  { id: 'c8',  name: 'Aqua Sports Centre',     group: 1, status: 'in_progress', email: 'admin@aquasports.co.uk',    plan: 'Starter' },
  { id: 'c9',  name: 'PowerHouse Gym',         group: 2, status: 'active',      email: 'it@powerhousegym.com',      plan: 'Pro' },
  { id: 'c10', name: 'Champions Boxing Club',  group: 3, status: 'active',      email: 'owner@championsboxing.com', plan: 'Starter' },
  { id: 'c11', name: 'Elite Sports Academy',   group: 4, status: 'active',      email: 'contact@elitesports.com',   plan: 'Enterprise' },
  { id: 'c12', name: 'Zen Flow Pilates',       group: 2, status: 'active',      email: 'hello@zenflow.com',         plan: 'Starter' },
]

const now = () => new Date().toISOString()
const ago = (h) => new Date(Date.now() - h * 3600000).toISOString()

const INITIAL_TICKETS = [
  {
    id: 'T-001', subject: 'Cannot access member portal after update',
    customer: 'Bianco Fitness', customerId: 'c1', from: 'admin@biancofitness.com',
    group: 2, status: 'open', priority: 'high', assignee: 'casey', createdAt: ago(26),
    messages: [
      { from: 'admin@biancofitness.com', body: 'Hi, since the latest update our members cannot log into the portal. This is affecting 200+ members. Please help urgently.', time: ago(26) },
      { from: 'casey@wellyx.com', body: 'Hi, thanks for reaching out. I am looking into this right now and will update you within the hour.', time: ago(25) },
      { from: 'admin@biancofitness.com', body: 'Thank you Casey. Our front desk staff are fielding a lot of complaints. Any update?', time: ago(24) },
    ],
    notes: [{ author: 'Casey', text: 'Confirmed issue — token expiry bug in v2.3.1. Escalated to dev.', time: ago(25) }],
  },
  {
    id: 'T-002', subject: 'Billing discrepancy on March invoice',
    customer: 'Luna Ballroom', customerId: 'c2', from: 'finance@lunaballroom.com',
    group: 4, status: 'pending', priority: 'medium', assignee: 'andrew', createdAt: ago(34),
    messages: [
      { from: 'finance@lunaballroom.com', body: 'We noticed our March invoice shows an extra charge of $149. Can you clarify what this is for?', time: ago(34) },
      { from: 'andrew@wellyx.com', body: 'Hi! I am reviewing your account now. I will have a full breakdown for you within 2 hours.', time: ago(33) },
    ],
    notes: [{ author: 'Andrew', text: 'Extra charge was for additional location added mid-month. Need to confirm with them.', time: ago(33) }],
  },
  {
    id: 'T-003', subject: 'Schedule module not syncing with Google Calendar',
    customer: 'Peak Performance Gym', customerId: 'c4', from: 'ops@peakperformance.com',
    group: 3, status: 'open', priority: 'medium', assignee: 'david', createdAt: ago(13),
    messages: [
      { from: 'ops@peakperformance.com', body: "Our trainers' class schedules are not showing up in Google Calendar anymore. This started 2 days ago.", time: ago(13) },
    ],
    notes: [],
  },
  {
    id: 'T-004', subject: 'Request to add 3 new staff accounts',
    customer: 'Windsor Athletic Club', customerId: 'c3', from: 'manager@windsorathletic.com',
    group: 4, status: 'resolved', priority: 'low', assignee: 'andrew', createdAt: ago(72),
    messages: [
      { from: 'manager@windsorathletic.com', body: 'Please add 3 new staff accounts: Tom Hall, Jenny Park, and Marcus Lee.', time: ago(72) },
      { from: 'andrew@wellyx.com', body: 'Done! All 3 accounts have been created and welcome emails sent.', time: ago(70) },
    ],
    notes: [{ author: 'Andrew', text: 'Accounts created. Welcome emails sent.', time: ago(70) }],
  },
  {
    id: 'T-005', subject: 'Mobile app crashing on check-in',
    customer: 'Sunrise Yoga Studio', customerId: 'c5', from: 'hello@sunriseyoga.com',
    group: 2, status: 'open', priority: 'high', assignee: 'aidan', createdAt: ago(12),
    messages: [
      { from: 'hello@sunriseyoga.com', body: 'The mobile app crashes every time our staff tries to check in a member. Started this morning.', time: ago(12) },
    ],
    notes: [],
  },
  {
    id: 'T-006', subject: 'API rate limiting affecting POS integration',
    customer: 'Iron Forge CrossFit', customerId: 'c6', from: 'info@ironforge.com',
    group: 3, status: 'open', priority: 'high', assignee: 'henry', createdAt: ago(8),
    messages: [
      { from: 'info@ironforge.com', body: 'Our POS integration is hitting API rate limits during peak hours (6-8pm). We process about 400 transactions per hour. This is causing checkout failures.', time: ago(8) },
      { from: 'henry@wellyx.com', body: 'Thanks for reporting this. I can see your API usage spiking around those hours. Let me look into increasing your rate limit.', time: ago(7) },
      { from: 'info@ironforge.com', body: 'Appreciate it. Any timeline on a fix? This is costing us a lot during peak.', time: ago(6) },
    ],
    notes: [{ author: 'Henry', text: 'Rate limit currently 300 req/min, they need ~450. Requesting increase from infra team.', time: ago(7) }],
  },
  {
    id: 'T-007', subject: 'Need data export for annual audit',
    customer: 'Elite Sports Academy', customerId: 'c11', from: 'contact@elitesports.com',
    group: 4, status: 'pending', priority: 'medium', assignee: 'casey', createdAt: ago(48),
    messages: [
      { from: 'contact@elitesports.com', body: 'We need a full data export of all member transactions, attendance records, and staff activity logs for our annual audit covering Jan-Dec 2024.', time: ago(48) },
      { from: 'casey@wellyx.com', body: 'Hi! I can help with this. The export will take about 30 minutes to generate given the date range. I will email it once ready.', time: ago(47) },
      { from: 'contact@elitesports.com', body: 'Perfect, thank you. The audit is next week so please do send asap.', time: ago(46) },
      { from: 'casey@wellyx.com', body: 'Running the export now. You should receive an email with a secure download link within the hour.', time: ago(10) },
    ],
    notes: [
      { author: 'Casey', text: 'Large export ~2.3GB. Using async export pipeline.', time: ago(47) },
      { author: 'Casey', text: 'Export queued. ETA 45 min. Will notify client.', time: ago(10) },
    ],
  },
  {
    id: 'T-008', subject: 'Payment gateway error - transactions declined',
    customer: 'Bianco Fitness', customerId: 'c1', from: 'admin@biancofitness.com',
    group: 2, status: 'open', priority: 'high', assignee: 'amy', createdAt: ago(4),
    messages: [
      { from: 'admin@biancofitness.com', body: 'URGENT: All card payments are being declined since 2pm. Members cannot pay for memberships or classes. This is a serious issue!', time: ago(4) },
      { from: 'amy@wellyx.com', body: 'I see this - our payment processor is showing elevated declines. I am escalating to our payments team immediately.', time: ago(3.5) },
    ],
    notes: [{ author: 'Amy', text: 'Stripe showing webhook failures. Payments team paged. Incident #2847 opened.', time: ago(3.5) }],
  },
  {
    id: 'T-009', subject: 'Setup help: importing existing member database',
    customer: 'Flex Athletics', customerId: 'c7', from: 'setup@flexathletics.com',
    group: 1, status: 'open', priority: 'medium', assignee: 'casey', createdAt: ago(18),
    messages: [
      { from: 'setup@flexathletics.com', body: 'Hi we are new to Wellyx (just signed up last week). We have an existing member database in Excel with about 850 members. How do we import this?', time: ago(18) },
      { from: 'casey@wellyx.com', body: 'Welcome to Wellyx! Great news - we have a bulk import tool. I will send you our Excel template to format your data, then we can import directly. Takes about 10 minutes.', time: ago(17) },
      { from: 'setup@flexathletics.com', body: 'Brilliant! Yes please send the template. A few of our members also have credit card info we keep on file - can that be imported too?', time: ago(16) },
    ],
    notes: [{ author: 'Casey', text: 'New customer. Template sent. CC data requires Stripe migration tool — will walk them through it.', time: ago(17) }],
  },
  {
    id: 'T-010', subject: 'Class booking widget not appearing on website',
    customer: 'Zen Flow Pilates', customerId: 'c12', from: 'hello@zenflow.com',
    group: 2, status: 'open', priority: 'medium', assignee: 'casey', createdAt: ago(20),
    messages: [
      { from: 'hello@zenflow.com', body: 'We embedded the class booking widget on our website but it is showing a blank white box. We followed the instructions in the docs exactly.', time: ago(20) },
      { from: 'casey@wellyx.com', body: 'Can you share your website URL and the embed code you used? I will take a look.', time: ago(19) },
      { from: 'hello@zenflow.com', body: 'Sure! Our site is zenflowpilates.com and the embed code is: <iframe src="https://app.wellyx.com/widget/zfp001" width="100%" height="600"></iframe>', time: ago(18) },
    ],
    notes: [{ author: 'Casey', text: 'CSP issue on their Squarespace site. Need to whitelist our domain. Checking if they have custom domain restrictions.', time: ago(18) }],
  },
  {
    id: 'T-011', subject: 'Payroll integration setup - ADP',
    customer: 'Windsor Athletic Club', customerId: 'c3', from: 'manager@windsorathletic.com',
    group: 4, status: 'pending', priority: 'low', assignee: 'andrew', createdAt: ago(55),
    messages: [
      { from: 'manager@windsorathletic.com', body: 'We use ADP for payroll and want to integrate it with Wellyx staff scheduling. Is this possible?', time: ago(55) },
      { from: 'andrew@wellyx.com', body: 'Yes! We have native ADP integration. I will walk you through the setup. First, can you confirm you have admin access to your ADP account?', time: ago(54) },
      { from: 'manager@windsorathletic.com', body: 'Yes I have admin access to ADP. What do I need to do?', time: ago(50) },
      { from: 'andrew@wellyx.com', body: "Great. I have sent you step-by-step setup instructions via email. The integration usually takes about 20 minutes. Let me know when you're in and I'll help you through it.", time: ago(49) },
    ],
    notes: [{ author: 'Andrew', text: 'Setup guide emailed. Waiting for them to confirm setup started.', time: ago(49) }],
  },
  {
    id: 'T-012', subject: 'Attendance reports showing wrong totals',
    customer: 'Champions Boxing Club', customerId: 'c10', from: 'owner@championsboxing.com',
    group: 3, status: 'open', priority: 'medium', assignee: 'henry', createdAt: ago(9),
    messages: [
      { from: 'owner@championsboxing.com', body: "The monthly attendance report for March shows 1,247 visits but our manual count is closer to 1,180. That's a 67 visit discrepancy. Is there a bug?", time: ago(9) },
      { from: 'henry@wellyx.com', body: "Hi! I am looking into this now. The discrepancy could be due to how cancelled-and-rebooked sessions are counted. Can you tell me if you offer any drop-in or trial passes?", time: ago(8) },
      { from: 'owner@championsboxing.com', body: 'Yes we do drop-ins. We had about 60 drop-in visitors in March.', time: ago(7) },
    ],
    notes: [{ author: 'Henry', text: 'Drop-ins are being double-counted when they scan in AND the session is marked complete. Known issue, patch in next release.', time: ago(8) }],
  },
  {
    id: 'T-013', subject: 'Custom branding - logo not updating in app',
    customer: 'Aqua Sports Centre', customerId: 'c8', from: 'admin@aquasports.co.uk',
    group: 1, status: 'resolved', priority: 'low', assignee: 'amy', createdAt: ago(96),
    messages: [
      { from: 'admin@aquasports.co.uk', body: 'We uploaded our new logo in Settings > Branding but the app still shows the old logo. How long does it take to update?', time: ago(96) },
      { from: 'amy@wellyx.com', body: 'Hi! Logo changes can take up to 24h to propagate due to CDN caching. If it still shows after 24h, please let me know and I can force a cache clear.', time: ago(95) },
      { from: 'admin@aquasports.co.uk', body: 'All sorted now, the new logo is showing. Thank you!', time: ago(72) },
    ],
    notes: [{ author: 'Amy', text: 'Resolved - CDN cache cleared naturally within 24h.', time: ago(95) }],
  },
  {
    id: 'T-014', subject: 'GDPR data deletion request - 3 members',
    customer: 'Luna Ballroom', customerId: 'c2', from: 'finance@lunaballroom.com',
    group: 4, status: 'open', priority: 'high', assignee: 'andrew', createdAt: ago(6),
    messages: [
      { from: 'finance@lunaballroom.com', body: 'We have received GDPR right-to-erasure requests from 3 former members: John Doe (member #4421), Sarah Smith (#4892), Mike Johnson (#5103). Please process these asap as we are legally obligated to comply within 30 days.', time: ago(6) },
    ],
    notes: [],
  },
  {
    id: 'T-015', subject: 'Two-factor authentication not sending SMS',
    customer: 'PowerHouse Gym', customerId: 'c9', from: 'it@powerhousegym.com',
    group: 2, status: 'open', priority: 'high', assignee: 'aidan', createdAt: ago(5),
    messages: [
      { from: 'it@powerhousegym.com', body: 'We enabled 2FA for all staff last week. Several staff members are not receiving the SMS verification codes. This is blocking them from logging in. Affected users: Mark T, Lisa K, Sam R.', time: ago(5) },
      { from: 'aidan@wellyx.com', body: 'I see this in the logs - looks like SMS delivery failures for +44 numbers. Are these UK numbers?', time: ago(4.5) },
      { from: 'it@powerhousegym.com', body: 'Yes, all three are UK numbers.', time: ago(4) },
    ],
    notes: [{ author: 'Aidan', text: 'UK SMS routing issue via Twilio - known problem affecting +44 numbers since carrier changes. Fallback to email OTP offered as workaround.', time: ago(4.5) }],
  },
  {
    id: 'T-016', subject: 'Membership plan pricing not matching website',
    customer: 'Peak Performance Gym', customerId: 'c4', from: 'ops@peakperformance.com',
    group: 3, status: 'resolved', priority: 'medium', assignee: 'david', createdAt: ago(120),
    messages: [
      { from: 'ops@peakperformance.com', body: 'Our annual membership shows £480/year in Wellyx but we advertise £45/month (£540/year). The system seems to have the wrong price.', time: ago(120) },
      { from: 'david@wellyx.com', body: 'I checked your plan settings. The annual rate was set to £480 when configured. I have updated it to £540 to match. Can you confirm this is correct?', time: ago(119) },
      { from: 'ops@peakperformance.com', body: 'Yes that is correct! Thank you for sorting that out so quickly.', time: ago(118) },
    ],
    notes: [{ author: 'David', text: 'Price corrected. Was set incorrectly during initial setup.', time: ago(119) }],
  },
]

// ─── INBOX EMAILS (read-only inbox, separate from tickets) ────────────────────
const INITIAL_INBOX = [
  {
    id: 'e-001', read: false, starred: false,
    from: 'admin@biancofitness.com', fromName: 'Mike Chen',
    subject: 'Re: Can we schedule a training call?',
    preview: 'Hi Rebecca, Thursday at 2pm works perfectly for our team...',
    body: `Hi Rebecca,

Thursday at 2pm works perfectly for our team. We will have our gym manager, front desk lead, and our IT person on the call.

A few things we'd like to cover:
1. Staff training on the new booking system
2. Setting up automated payment reminders
3. The reporting dashboard - we want to build a custom weekly report

Looking forward to it!

Best,
Mike Chen
Bianco Fitness`,
    time: ago(0.5), group: 2, customerId: 'c1', threadId: 'th-a1',
  },
  {
    id: 'e-002', read: false, starred: true,
    from: 'ceo@elitesports.com', fromName: 'Diana Hartley',
    subject: 'Contract renewal - looking to expand to 5 more locations',
    preview: "Diana Hartley from Elite Sports Academy. Our contract is up in 60 days and we're happy...",
    body: `Hello,

I'm Diana Hartley, CEO of Elite Sports Academy. Our contract with Wellyx is up for renewal in 60 days and I wanted to open the conversation early.

We've been very happy with the service and are actually looking to expand - we're opening 5 new locations across the Midlands over the next 18 months. I'd like to discuss:

- Enterprise pricing for 12 total locations
- Dedicated account management
- SLA guarantees for uptime
- Custom API access for our internal systems

Can we arrange a call with your enterprise team?

Best regards,
Diana Hartley
CEO, Elite Sports Academy`,
    time: ago(1), group: 4, customerId: 'c11', threadId: 'th-b1',
  },
  {
    id: 'e-003', read: true, starred: false,
    from: 'setup@flexathletics.com', fromName: 'Kevin O\'Brien',
    subject: 'Excel template - column mapping question',
    preview: "We received the template but column D says 'member_type' - what are the valid values?",
    body: `Hi Jorge,

We received the import template, thanks! Most of it is clear but we have a question about column D which says 'member_type'. What are the valid values for this field?

We have members categorised as: Full Member, Student, Senior, Corporate, Family, Day Pass.

Also, for members who have a photo on file, how do we include that?

Thanks,
Kevin O'Brien
Flex Athletics`,
    time: ago(2), group: 1, customerId: 'c7', threadId: 'th-c1',
  },
  {
    id: 'e-004', read: false, starred: false,
    from: 'finance@lunaballroom.com', fromName: 'Rachel Osei',
    subject: 'Invoice dispute - awaiting credit note',
    preview: 'Following up on T-002. We were told a credit note would be issued...',
    body: `Hello,

I am following up on ticket T-002 regarding the billing discrepancy on our March invoice.

Your agent Sarah confirmed last week that we would receive a credit note for the erroneous £149 charge. We have not received this yet and our accounts department is chasing.

Could you please confirm the status of the credit note and when we can expect to receive it?

Kind regards,
Rachel Osei
Finance Manager, Luna Ballroom`,
    time: ago(3), group: 4, customerId: 'c2', threadId: 'th-d1',
  },
  {
    id: 'e-005', read: true, starred: false,
    from: 'it@powerhousegym.com', fromName: 'Sam Reeves',
    subject: 'SMS 2FA - email fallback works but prefer SMS',
    preview: "The email OTP workaround is working for our staff but SMS is much quicker for them...",
    body: `Hi Aiden,

The email OTP workaround is working for our staff but SMS is much quicker for them - they don't always have their email open at the front desk.

Is there a timeline for when the UK SMS issue will be resolved? If it's more than 2 weeks we might need to consider an authenticator app as an alternative.

Also, is there any way to whitelist specific IP addresses so our on-site staff don't need 2FA when on the gym network?

Thanks,
Sam Reeves
IT Manager, PowerHouse Gym`,
    time: ago(5), group: 2, customerId: 'c9', threadId: 'th-e1',
  },
  {
    id: 'e-006', read: false, starred: false,
    from: 'owner@championsboxing.com', fromName: 'Tony Braga',
    subject: 'March report still wrong after your update',
    preview: "Hi Priya, I refreshed the report as you suggested but still showing 1,247...",
    body: `Hi Priya,

I refreshed the report as you suggested but still showing 1,247 visits rather than the correct ~1,180.

I understand this might be a known bug but this is causing issues for us as we use this report for our investor updates and the numbers need to be accurate.

Is there a workaround we can use, or a manual correction we can apply? Our investor meeting is on the 25th.

Tony Braga
Champions Boxing Club`,
    time: ago(6), group: 3, customerId: 'c10', threadId: 'th-f1',
  },
  {
    id: 'e-007', read: true, starred: true,
    from: 'hello@sunriseyoga.com', fromName: 'Priya Nair',
    subject: 'App crash - still happening, video attached',
    preview: "Hi, the app is still crashing. I recorded a screen capture showing the exact crash...",
    body: `Hi Aiden,

The app is still crashing. I recorded a screen capture showing the exact crash - unfortunately I can't attach a video to email but I've uploaded it here: [screen-capture-link]

The crash seems to happen specifically when:
1. Staff tap "Check In"
2. The QR scanner opens
3. They scan a member QR code
4. It shows the member details for about 1 second then crashes

This is happening on both our iPads (iOS 17.4) and on Android (Samsung Galaxy Tab A).

Is there an ETA on a fix? We are having to do paper sign-ins in the meantime.

Priya Nair
Sunrise Yoga Studio`,
    time: ago(8), group: 2, customerId: 'c5', threadId: 'th-g1',
  },
  {
    id: 'e-008', read: false, starred: false,
    from: 'info@ironforge.com', fromName: 'Jake Marsh',
    subject: 'Rate limit increase - any update?',
    preview: "Hi Henry, just following up on the rate limit request. Still hitting limits...",
    body: `Hi Henry,

Just following up on the rate limit request from yesterday. We're still hitting the limits tonight during our evening rush.

As a workaround we've spread some transactions to our backup POS but this is creating reconciliation headaches.

Has the infra team been able to look at this? Even a temporary increase to 500 req/min would help while a permanent solution is found.

Jake Marsh
Iron Forge CrossFit`,
    time: ago(4), group: 3, customerId: 'c6', threadId: 'th-h1',
  },
  {
    id: 'e-009', read: true, starred: false,
    from: 'admin@aquasports.co.uk', fromName: 'Claire Thompson',
    subject: 'Question about swim lane booking feature',
    preview: 'Hi, we would like to enable lane booking for our swim sessions. Does Wellyx support this?',
    body: `Hi,

Now that our branding is all set up, we are ready to start exploring more features.

We run 8 swim lanes and would like members to be able to book specific lanes online. Does Wellyx support this kind of resource booking?

Also, we need to set different capacity rules for different sessions - for example our lessons have max 4 per lane but our open swim allows up to 1 per lane.

Looking forward to hearing from you.

Claire Thompson
Aqua Sports Centre`,
    time: ago(20), group: 1, customerId: 'c8', threadId: 'th-i1',
  },
  {
    id: 'e-010', read: false, starred: false,
    from: 'hello@zenflow.com', fromName: 'Maria Santos',
    subject: 'Widget now showing! But one more issue',
    preview: "The booking widget is now working on our site. However, the time slots are showing in UTC...",
    body: `Hi Casey,

Great news - the booking widget is now working on our site after we added the Wellyx domain to our CSP whitelist.

However, there is one more issue: the time slots are showing in UTC rather than our local time (GMT+1 BST). So a class at 9am appears as 8am on the widget. Our members are getting confused.

Is there a timezone setting we can adjust?

Thanks so much for your help,
Maria Santos
Zen Flow Pilates`,
    time: ago(2), group: 2, customerId: 'c12', threadId: 'th-j1',
  },
  {
    id: 'e-011', read: true, starred: false,
    from: 'manager@windsorathletic.com', fromName: 'Paul Winters',
    subject: 'ADP integration - getting error code WX-4421',
    preview: "Hi Sarah, I followed the setup guide but getting error WX-4421 at step 6...",
    body: `Hi Sarah,

I followed the setup guide for the ADP integration but I'm getting an error at step 6 when I try to authorise the connection. The error message says:

"Error WX-4421: Unable to establish connection. Please verify ADP API credentials."

I've double-checked my ADP API key and it looks correct. Could this be a permissions issue on the ADP side? I've attached a screenshot of my ADP API settings.

Paul Winters
Windsor Athletic Club`,
    time: ago(12), group: 4, customerId: 'c3', threadId: 'th-k1',
  },
  {
    id: 'e-012', read: false, starred: false,
    from: 'ops@peakperformance.com', fromName: 'James Carter',
    subject: 'New issue: Reports showing previous month data',
    preview: "Hi, we have a new problem. The April reports are showing March data...",
    body: `Hi David,

Thanks again for fixing the pricing issue quickly!

We have a new problem though. The April attendance and revenue reports appear to be showing March data. It seems like the monthly reports aren't refreshing.

This is affecting:
- Monthly attendance report
- Revenue by membership type report
- Class utilization report

Is this a caching issue or something else?

James Carter
Operations Manager, Peak Performance Gym`,
    time: ago(1), group: 3, customerId: 'c4', threadId: 'th-l1',
  },
]

// ─── STYLES ──────────────────────────────────────────────────────────────────

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

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function useTick(ms = 60000) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), ms)
    return () => clearInterval(id)
  }, [ms])
}

function fmt(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Avatar({ name, size = 8, bg = 'bg-blue-600', text = 'text-white' }) {
  return (
    <div className={`w-${size} h-${size} rounded-full ${bg} ${text} flex items-center justify-center font-semibold text-sm flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    const user = USERS[username.toLowerCase()]
    if (user && user.password === password) {
      onLogin(user)
    } else {
      setError('Invalid credentials. Click any account below.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/wellyx-logo.png" alt="Wellyx" className="w-16 h-16 rounded-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white">Wellyx Support</h1>
          <p className="text-slate-400 text-sm mt-1">Internal support portal</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. rebecca, casey, david..." value={username}
                onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="demo123" value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors">
              Sign In
            </button>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-3">Quick login (password: demo123)</p>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.values(USERS).map(u => (
                <button key={u.id} onClick={() => { setUsername(u.id); setPassword('demo123') }}
                  className="text-left px-2.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <p className="text-xs font-semibold text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.role === 'lead' ? '👑 Admin' : `Grp ${u.group}`}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

function Sidebar({ user, view, setView, onLogout, unreadCount }) {
  const navItems = [
    { id: 'inbox',     label: 'Inbox',     icon: '📬', badge: unreadCount },
    { id: 'tickets',   label: 'Tickets',   icon: '🎫' },
    { id: 'customers', label: 'Customers', icon: '🏢' },
    ...(user.role === 'lead' ? [
      { id: 'groups',   label: 'Groups',   icon: '👥' },
      { id: 'compose',  label: 'Compose',  icon: '✏️' },
    ] : []),
  ]

  return (
    <div className="w-52 min-h-screen flex flex-col bg-slate-900 text-white flex-shrink-0">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0"><img src="/wellyx-logo.png" alt="Wellyx" className="w-full h-full object-cover" /></div>
          <div>
            <p className="text-sm font-semibold">Wellyx Support</p>
            <p className="text-xs text-slate-400">v2.0</p>
          </div>
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

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-slate-400">
              {user.role === 'lead' ? '👑 Admin' : `${GROUPS[user.group]?.name}`}
            </p>
          </div>
          <button onClick={onLogout} className="text-slate-400 hover:text-white transition-colors text-xs">
            Out
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── INBOX VIEW ───────────────────────────────────────────────────────────────

function InboxView({ user, emails, setEmails, tickets, setTickets, onCreateTicket }) {
  useTick()
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterRead, setFilterRead] = useState('all')
  const [sentReplies, setSentReplies] = useState({}) // emailId -> [{from, body, time}]

  const visible = emails.filter(e => {
    const groupMatch = user.role === 'lead'
      ? (filterGroup === 'all' || e.group === Number(filterGroup))
      : e.group === user.group
    const readMatch = filterRead === 'all' || (filterRead === 'unread' && !e.read)
    return groupMatch && readMatch
  }).sort((a, b) => new Date(b.time) - new Date(a.time))

  const selectedEmail = selected ? emails.find(e => e.id === selected) : null
  const thread = sentReplies[selected] || []

  const markRead = (id) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e))
  }

  const toggleStar = (id) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e))
  }

  const selectEmail = (id) => {
    setSelected(id)
    markRead(id)
    setReply('')
  }

  const sendReply = () => {
    if (!reply.trim() || !selectedEmail) return
    const newMsg = { from: `${user.id}@wellyx.com`, body: reply, time: now() }
    setSentReplies(prev => ({ ...prev, [selected]: [...(prev[selected] || []), newMsg] }))
    setReply('')
  }

  const generateAIReply = async () => {
    if (!selectedEmail) return
    setAiLoading(true)
    try {
      const customer = CUSTOMERS.find(c => c.id === selectedEmail.customerId)
      const group = GROUPS[selectedEmail.group]
      const agentName = user.name
      const prompt = `You are ${agentName}, a support agent at Wellyx (gym management software). You are replying to a customer email.

Customer: ${selectedEmail.fromName} from ${customer?.name || 'unknown'}
Their email subject: ${selectedEmail.subject}
Their message:
${selectedEmail.body}

Previous replies in this thread:
${thread.map(r => `${r.from}: ${r.body}`).join('\n\n') || 'None'}

Write a professional, helpful, and concise email reply from ${agentName} at Wellyx support. Be warm but efficient. Reference specific details from their email. Sign off as "${agentName}, Wellyx Support Team". Do not include a subject line. Just write the reply body.`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await response.json()
      const text = data.content?.map(c => c.text || '').join('') || ''
      if (!text) throw new Error(data.error?.message || 'No response')
      setReply(text.trim())
    } catch (e) {
      setReply('Error generating reply. Please try again.')
    }
    setAiLoading(false)
  }

  const convertToTicket = () => {
    if (!selectedEmail) return
    const customer = CUSTOMERS.find(c => c.id === selectedEmail.customerId)
    const newTicket = {
      id: `T-${String(tickets.length + 1).padStart(3, '0')}`,
      subject: selectedEmail.subject,
      customer: customer?.name || selectedEmail.fromName,
      customerId: selectedEmail.customerId,
      from: selectedEmail.from,
      group: selectedEmail.group,
      status: 'open',
      priority: 'medium',
      assignee: user.id,
      createdAt: now(),
      messages: [{ from: selectedEmail.from, body: selectedEmail.body, time: selectedEmail.time }],
      notes: [],
    }
    setTickets(prev => [newTicket, ...prev])
    alert(`Ticket ${newTicket.id} created!`)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Email list */}
      <div className="w-80 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-base mb-3">Inbox</h2>
          <div className="space-y-2">
            {user.role === 'lead' && (
              <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="all">All groups</option>
                {Object.values(GROUPS).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            )}
            <div className="flex gap-1.5">
              {['all','unread'].map(f => (
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
            const gc = GROUP_COLORS[e.group] || GROUP_COLORS[2]
            return (
              <button key={e.id} onClick={() => selectEmail(e.id)}
                className={`w-full text-left p-3.5 hover:bg-gray-50 transition-colors ${selected === e.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''} ${!e.read ? 'bg-blue-50/30' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  {!e.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>}
                  <p className={`text-xs flex-1 truncate ${!e.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{e.fromName}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0">{fmt(e.time)}</span>
                  {e.starred && <span className="text-amber-400 text-xs">★</span>}
                </div>
                <p className={`text-xs mb-1 truncate ${!e.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>{e.subject}</p>
                <p className="text-xs text-gray-400 truncate">{e.preview}</p>
                {user.role === 'lead' && (
                  <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${gc.bg} ${gc.text}`}>
                    {GROUPS[e.group]?.name}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Email detail */}
      {selectedEmail ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-base">{selectedEmail.subject}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                  <span>From: <span className="font-medium text-gray-700">{selectedEmail.fromName}</span> &lt;{selectedEmail.from}&gt;</span>
                  <span>·</span>
                  <span>{fmt(selectedEmail.time)}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => toggleStar(selected)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selectedEmail.starred ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {selectedEmail.starred ? '★ Starred' : '☆ Star'}
                </button>
                <button onClick={convertToTicket}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                  → Create Ticket
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Original email */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Avatar name={selectedEmail.fromName} size={8} bg="bg-gray-200" text="text-gray-700" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{selectedEmail.fromName}</p>
                  <p className="text-xs text-gray-500">{selectedEmail.from}</p>
                </div>
                <span className="ml-auto text-xs text-gray-400">{fmt(selectedEmail.time)}</span>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedEmail.body}</div>
            </div>

            {/* Thread replies */}
            {thread.map((r, i) => (
              <div key={i} className="flex justify-end">
                <div className="max-w-2xl bg-blue-600 text-white rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={user.name} size={6} bg="bg-blue-400" text="text-white" />
                    <p className="text-xs text-blue-200">{r.from} · {fmt(r.time)}</p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{r.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply area */}
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Reply to: <span className="font-medium text-gray-700">{selectedEmail.from}</span>
                  <span className="mx-2 text-gray-300">·</span>
                  From: <span className="font-medium text-gray-700">{user.id}@wellyx.com</span>
                </div>
                <button onClick={generateAIReply} disabled={aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors disabled:opacity-50">
                  {aiLoading ? (
                    <><span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Generating...</>
                  ) : (
                    <><span>✨</span> AI Draft</>
                  )}
                </button>
              </div>
              <textarea
                className="w-full px-4 py-3 text-sm resize-none focus:outline-none min-h-32"
                placeholder="Write your reply..."
                value={reply}
                onChange={e => setReply(e.target.value)}
              />
              <div className="px-4 py-2.5 border-t border-gray-100 flex justify-end gap-2">
                <button onClick={() => setReply('')} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  Clear
                </button>
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
          <div className="text-center">
            <div className="text-5xl mb-4">📬</div>
            <p className="text-gray-500 text-sm">Select an email to read</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── COMPOSE VIEW (Leads only) ────────────────────────────────────────────────

function ComposeView({ user, emails, setEmails, tickets, setTickets }) {
  const [form, setForm] = useState({ to: '', toName: '', subject: '', body: '', group: 2, priority: 'medium', mode: 'email' })
  const [sent, setSent] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  const generateBody = async () => {
    if (!form.subject) return
    setAiLoading(true)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `Write a professional support email from Wellyx support team to a customer. Subject: "${form.subject}". The email is from the ${GROUPS[form.group]?.name} team. Write only the email body, no subject line. Sign as "Wellyx Support Team".`
          }]
        })
      })
      const data = await response.json()
      setForm(f => ({ ...f, body: data.content?.map(c => c.text || '').join('').trim() }))
    } catch {}
    setAiLoading(false)
  }

  const submit = () => {
    if (!form.to || !form.subject || !form.body) return
    if (form.mode === 'ticket') {
      const newTicket = {
        id: `T-${String(tickets.length + 1).padStart(3, '0')}`,
        subject: form.subject,
        customer: form.toName || form.to,
        customerId: null, from: form.to,
        group: Number(form.group), status: 'open', priority: form.priority,
        assignee: null, createdAt: now(),
        messages: [{ from: form.to, body: form.body, time: now() }],
        notes: [],
      }
      setTickets(prev => [newTicket, ...prev])
    } else {
      const newEmail = {
        id: `e-${Date.now()}`, read: false, starred: false,
        from: form.to, fromName: form.toName || form.to,
        subject: form.subject, preview: form.body.slice(0, 80) + '...',
        body: form.body, time: now(), group: Number(form.group), customerId: null, threadId: `th-new-${Date.now()}`
      }
      setEmails(prev => [newEmail, ...prev])
    }
    setSent(true)
    setTimeout(() => setSent(false), 3000)
    setForm({ to: '', toName: '', subject: '', body: '', group: 2, priority: 'medium', mode: form.mode })
  }

  return (
    <div className="p-6 overflow-y-auto h-screen">
      <div className="max-w-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-1">New Email / Ticket</h2>
        <p className="text-sm text-gray-500 mb-6">Send an email to a customer or create a new ticket manually.</p>

        {sent && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">✅ Done!</div>}

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="flex gap-2">
            {['email','ticket'].map(m => (
              <button key={m} onClick={() => setForm(f => ({ ...f, mode: m }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${form.mode === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {m === 'email' ? '📧 Incoming Email' : '🎫 New Ticket'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">FROM (customer)</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="client@company.com" value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">CUSTOMER NAME</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Business / Contact Name" value={form.toName} onChange={e => setForm(f => ({ ...f, toName: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">SUBJECT</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Issue subject..." value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-600">BODY</label>
              <button onClick={generateBody} disabled={aiLoading || !form.subject}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors disabled:opacity-40">
                {aiLoading ? '...' : '✨ AI Draft'}
              </button>
            </div>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6} placeholder="Message..." value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">ROUTE TO GROUP</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))}>
                {Object.values(GROUPS).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">PRIORITY</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <button onClick={submit} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors">
            {form.mode === 'email' ? '📧 Add to Inbox' : '🎫 Create Ticket'} → Group {form.group}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TICKETS VIEW ─────────────────────────────────────────────────────────────

function TicketsView({ user, tickets, setTickets }) {
  useTick()
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [note, setNote] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [aiLoading, setAiLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const visible = tickets.filter(t => {
    const groupMatch = user.role === 'lead' || t.group === user.group
    const statusMatch = filterStatus === 'all' || t.status === filterStatus
    const priorityMatch = filterPriority === 'all' || t.priority === filterPriority
    return groupMatch && statusMatch && priorityMatch
  })

  const selectedTicket = selected ? tickets.find(t => t.id === selected) : null

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedTicket?.messages?.length])

  const sendReply = () => {
    if (!reply.trim() || !selectedTicket) return
    setTickets(tickets.map(t => t.id === selected
      ? { ...t, messages: [...t.messages, { from: `${user.id}@wellyx.com`, body: reply, time: now() }] }
      : t))
    setReply('')
  }

  const addNote = () => {
    if (!note.trim() || !selectedTicket) return
    setTickets(tickets.map(t => t.id === selected
      ? { ...t, notes: [...t.notes, { author: user.name, text: note, time: now() }] }
      : t))
    setNote('')
  }

  const generateAIReply = async () => {
    if (!selectedTicket) return
    setAiLoading(true)
    try {
      const history = selectedTicket.messages.map(m => `${m.from}: ${m.body}`).join('\n\n')
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `You are ${user.name}, a support agent at Wellyx (gym management software SaaS).

Ticket subject: ${selectedTicket.subject}
Customer: ${selectedTicket.customer}
Priority: ${selectedTicket.priority}
Status: ${selectedTicket.status}

Conversation so far:
${history}

Internal notes (not visible to customer):
${selectedTicket.notes.map(n => `${n.author}: ${n.text}`).join('\n') || 'None'}

Write a helpful, professional reply to the customer. Be warm but efficient. Address their specific concerns. Sign as "${user.name}, Wellyx Support". Write only the reply body, no subject line.`
          }]
        })
      })
      const data = await response.json()
      const text = data.content?.map(c => c.text || '').join('').trim() || ''
      if (!text) throw new Error(data.error?.message || 'Empty response')
      setReply(text)
    } catch (e) {
      setReply('Error generating reply. Please try again.')
    }
    setAiLoading(false)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Ticket list */}
      <div className="w-80 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-base mb-3">
            {user.role === 'lead' ? 'All Tickets' : `${GROUPS[user.group]?.name} Tickets`}
          </h2>
          <div className="space-y-2">
            <div className="flex gap-1 flex-wrap">
              {['all','open','pending','resolved'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors
                    ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {['all','high','medium','low'].map(p => (
                <button key={p} onClick={() => setFilterPriority(p)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors
                    ${filterPriority === p ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{visible.length} tickets</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {visible.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No tickets</div>}
          {visible.map(t => {
            const gc = GROUP_COLORS[t.group] || GROUP_COLORS[2]
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
                {user.role === 'lead' && (
                  <span className={`mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${gc.bg} ${gc.text}`}>
                    {GROUPS[t.group]?.name}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Ticket detail */}
      {selectedTicket ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">{selectedTicket.subject}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-500">
                <span>{selectedTicket.from}</span>
                <span className="text-gray-300">·</span>
                <span>{selectedTicket.customer}</span>
                <span className="text-gray-300">·</span>
                <span>{fmt(selectedTicket.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <select value={selectedTicket.status}
                onChange={e => setTickets(tickets.map(t => t.id === selected ? { ...t, status: e.target.value } : t))}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
              {user.role === 'lead' && (
                <select value={selectedTicket.group}
                  onChange={e => setTickets(tickets.map(t => t.id === selected ? { ...t, group: Number(e.target.value) } : t))}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
                  {Object.values(GROUPS).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedTicket.messages.map((m, i) => {
                  const isAgent = m.from.includes('wellyx.com')
                  return (
                    <div key={i} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-lg rounded-2xl px-4 py-3 ${isAgent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        <p className={`text-xs font-medium mb-1 ${isAgent ? 'text-blue-200' : 'text-gray-500'}`}>{m.from} · {fmt(m.time)}</p>
                        <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Reply as {user.id}@wellyx.com</span>
                    <button onClick={generateAIReply} disabled={aiLoading}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors disabled:opacity-50">
                      {aiLoading ? <><span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Drafting...</> : '✨ AI Draft'}
                    </button>
                  </div>
                  <textarea className="w-full px-3 py-2 text-sm resize-none focus:outline-none min-h-24"
                    placeholder="Write a reply..." value={reply} onChange={e => setReply(e.target.value)} />
                  <div className="px-3 py-2 border-t border-gray-100 flex justify-end">
                    <button onClick={sendReply} disabled={!reply.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-60 border-l border-gray-100 flex flex-col bg-amber-50/40 flex-shrink-0">
              <div className="p-3 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700">📝 Internal Notes</h4>
                <p className="text-xs text-gray-500">Team only</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {selectedTicket.notes.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No notes</p>}
                {selectedTicket.notes.map((n, i) => (
                  <div key={i} className="bg-white rounded-lg p-2.5 border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 mb-1">{n.author} · {fmt(n.time)}</p>
                    <p className="text-xs text-gray-700">{n.text}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-100">
                <textarea className="w-full border border-amber-200 rounded-lg px-2.5 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                  rows={3} placeholder="Add note..." value={note} onChange={e => setNote(e.target.value)} />
                <button onClick={addNote} className="w-full mt-1.5 bg-amber-500 hover:bg-amber-600 text-white py-1.5 rounded-lg text-xs font-medium transition-colors">
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

function CustomersView({ user, tickets }) {
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [search, setSearch] = useState('')

  const visibleCustomers = CUSTOMERS.filter(c => {
    const groupMatch = user.role === 'lead' || c.group === user.group
    const searchMatch = !search || c.name.toLowerCase().includes(search.toLowerCase())
    return groupMatch && searchMatch
  })

  const customerTickets = selectedCustomer ? tickets.filter(t => t.customerId === selectedCustomer.id) : []
  const allNotes = customerTickets.flatMap(t => t.notes.map(n => ({ ...n, ticketId: t.id, ticketSubject: t.subject })))
    .sort((a, b) => new Date(b.time) - new Date(a.time))

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-72 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-2">Customers</h2>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {visibleCustomers.map(c => {
            const gc = GROUP_COLORS[c.group]
            const cTickets = tickets.filter(t => t.customerId === c.id)
            const openCount = cTickets.filter(t => t.status === 'open').length
            return (
              <button key={c.id} onClick={() => setSelectedCustomer(c)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedCustomer?.id === c.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-800">{c.name}</p>
                  {openCount > 0 && <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{openCount}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${gc.bg} ${gc.text}`}>{GROUPS[c.group]?.name}</span>
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

      {selectedCustomer ? (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <Avatar name={selectedCustomer.name} size={12} bg="bg-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GROUP_COLORS[selectedCustomer.group].bg} ${GROUP_COLORS[selectedCustomer.group].text}`}>
                    {GROUPS[selectedCustomer.group]?.name}
                  </span>
                  <span className="text-xs text-gray-500">{selectedCustomer.plan} plan</span>
                  <span className="text-xs text-gray-500">{selectedCustomer.email}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Tickets ({customerTickets.length})</h3>
              {customerTickets.length === 0 ? <p className="text-sm text-gray-400">No tickets</p> : (
                <div className="space-y-2">
                  {customerTickets.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{t.subject}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t.id} · {fmt(t.createdAt)}</p>
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
                          <span className="text-xs text-gray-400">{fmt(n.time)}</span>
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
          <div className="text-center"><div className="text-5xl mb-4">🏢</div><p className="text-gray-500 text-sm">Select a customer</p></div>
        </div>
      )}
    </div>
  )
}

// ─── GROUPS VIEW ──────────────────────────────────────────────────────────────

function GroupsView({ tickets, emails }) {
  return (
    <div className="p-6 overflow-y-auto h-screen">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Groups Overview</h2>
      <div className="grid grid-cols-2 gap-4 max-w-5xl">
        {Object.values(GROUPS).map(g => {
          const gc = GROUP_COLORS[g.id]
          const gTickets = tickets.filter(t => t.group === g.id)
          const open = gTickets.filter(t => t.status === 'open').length
          const pending = gTickets.filter(t => t.status === 'pending').length
          const resolved = gTickets.filter(t => t.status === 'resolved').length
          const gEmails = emails.filter(e => e.group === g.id)
          const unread = gEmails.filter(e => !e.read).length
          const gCustomers = CUSTOMERS.filter(c => c.group === g.id)

          return (
            <div key={g.id} className={`bg-white rounded-2xl border-t-4 ${gc.border} border border-gray-100 p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{g.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{g.members.join(' · ')}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{g.email}</p>
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
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('inbox')
  const [tickets, setTickets] = useState(INITIAL_TICKETS)
  const [emails, setEmails] = useState(INITIAL_INBOX)

  const unreadCount = emails.filter(e => {
    const groupMatch = user ? (user.role === 'lead' || e.group === user.group) : false
    return groupMatch && !e.read
  }).length

  if (!user) return <LoginScreen onLogin={u => { setUser(u); setView('inbox') }} />

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} view={view} setView={setView} onLogout={() => { setUser(null); setView('inbox') }} unreadCount={unreadCount} />
      <main className="flex-1 overflow-hidden">
        {view === 'inbox'     && <InboxView     user={user} emails={emails} setEmails={setEmails} tickets={tickets} setTickets={setTickets} />}
        {view === 'tickets'   && <TicketsView   user={user} tickets={tickets} setTickets={setTickets} />}
        {view === 'customers' && <CustomersView user={user} tickets={tickets} />}
        {view === 'groups'    && user.role === 'lead' && <GroupsView tickets={tickets} emails={emails} />}
        {view === 'compose'   && user.role === 'lead' && <ComposeView user={user} emails={emails} setEmails={setEmails} tickets={tickets} setTickets={setTickets} />}
      </main>
    </div>
  )
}
