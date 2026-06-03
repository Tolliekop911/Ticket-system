// lib/data.js — in-memory demo store (replace with DB in production)

export const USERS = {
  rebecca: { id: 'rebecca', name: 'Rebecca', role: 'lead', group: null, password: 'demo123' },
  steve:   { id: 'steve',   name: 'Steve',   role: 'lead', group: null, password: 'demo123' },
  casey:   { id: 'casey',   name: 'Casey',   role: 'agent', group: 2,   password: 'demo123' },
  aiden:   { id: 'aiden',   name: 'Aiden',   role: 'agent', group: 2,   password: 'demo123' },
  david:   { id: 'david',   name: 'David',   role: 'agent', group: 3,   password: 'demo123' },
  henry:   { id: 'henry',   name: 'Henry',   role: 'agent', group: 3,   password: 'demo123' },
  sarah:   { id: 'sarah',   name: 'Sarah',   role: 'agent', group: 4,   password: 'demo123' },
  andrew:  { id: 'andrew',  name: 'Andrew',  role: 'agent', group: 4,   password: 'demo123' },
};

export const GROUPS = {
  1: { id: 1, name: 'Group 1', members: [],              color: '#6366f1' },
  2: { id: 2, name: 'Group 2', members: ['Casey','Aiden'], color: '#0ea5e9' },
  3: { id: 3, name: 'Group 3', members: ['David','Henry'], color: '#10b981' },
  4: { id: 4, name: 'Group 4', members: ['Sarah','Andrew'], color: '#f59e0b' },
};

export const CUSTOMERS = [
  { id: 'c1',  name: 'Bianco Fitness',       group: 2, status: 'active' },
  { id: 'c2',  name: 'Luna Ballroom',         group: 4, status: 'in_progress' },
  { id: 'c3',  name: 'Windsor Athletic Club', group: 4, status: 'in_progress' },
  { id: 'c4',  name: 'Peak Performance Gym',  group: 3, status: 'active' },
  { id: 'c5',  name: 'Sunrise Yoga Studio',   group: 2, status: 'active' },
  { id: 'c6',  name: 'Iron Forge CrossFit',   group: 3, status: 'active' },
];

export const TICKETS = [
  {
    id: 'T-001',
    subject: 'Cannot access member portal after update',
    customer: 'Bianco Fitness',
    customerId: 'c1',
    from: 'admin@biancofitness.com',
    group: 2,
    status: 'open',
    priority: 'high',
    assignee: 'casey',
    createdAt: '2025-04-19T08:23:00Z',
    messages: [
      { from: 'admin@biancofitness.com', body: 'Hi, since the latest update our members cannot log into the portal. This is affecting 200+ members. Please help urgently.', time: '2025-04-19T08:23:00Z' },
      { from: 'casey@wellyx.com', body: 'Hi, thanks for reaching out. I am looking into this right now and will update you within the hour.', time: '2025-04-19T09:01:00Z' },
    ],
    notes: [
      { author: 'Casey', text: 'Confirmed issue on their end — appears to be a token expiry bug introduced in v2.3.1. Escalated to dev.', time: '2025-04-19T09:15:00Z' },
    ],
  },
  {
    id: 'T-002',
    subject: 'Billing discrepancy on March invoice',
    customer: 'Luna Ballroom',
    customerId: 'c2',
    from: 'finance@lunaballroom.com',
    group: 4,
    status: 'pending',
    priority: 'medium',
    assignee: 'sarah',
    createdAt: '2025-04-18T14:10:00Z',
    messages: [
      { from: 'finance@lunaballroom.com', body: 'We noticed our March invoice shows an extra charge of $149. Can you clarify?', time: '2025-04-18T14:10:00Z' },
    ],
    notes: [
      { author: 'Sarah', text: 'Checked billing — they were charged for an additional location that was added mid-month. Need to confirm with them if that is correct.', time: '2025-04-18T15:00:00Z' },
    ],
  },
  {
    id: 'T-003',
    subject: 'Schedule module not syncing with Google Calendar',
    customer: 'Peak Performance Gym',
    customerId: 'c4',
    from: 'ops@peakperformance.com',
    group: 3,
    status: 'open',
    priority: 'medium',
    assignee: 'david',
    createdAt: '2025-04-19T10:45:00Z',
    messages: [
      { from: 'ops@peakperformance.com', body: 'Our trainers class schedules are not showing up in Google Calendar anymore. This started 2 days ago.', time: '2025-04-19T10:45:00Z' },
    ],
    notes: [],
  },
  {
    id: 'T-004',
    subject: 'Request to add 3 new staff accounts',
    customer: 'Windsor Athletic Club',
    customerId: 'c3',
    from: 'manager@windsorathletic.com',
    group: 4,
    status: 'resolved',
    priority: 'low',
    assignee: 'andrew',
    createdAt: '2025-04-17T09:00:00Z',
    messages: [
      { from: 'manager@windsorathletic.com', body: 'Please add 3 new staff accounts: Tom Hall, Jenny Park, and Marcus Lee.', time: '2025-04-17T09:00:00Z' },
      { from: 'andrew@wellyx.com', body: 'Done! All 3 accounts have been created. They will receive welcome emails shortly.', time: '2025-04-17T10:30:00Z' },
    ],
    notes: [
      { author: 'Andrew', text: 'Accounts created and welcome emails sent.', time: '2025-04-17T10:30:00Z' },
    ],
  },
  {
    id: 'T-005',
    subject: 'Mobile app crashing on check-in',
    customer: 'Sunrise Yoga Studio',
    customerId: 'c5',
    from: 'hello@sunriseyoga.com',
    group: 2,
    status: 'open',
    priority: 'high',
    assignee: 'aiden',
    createdAt: '2025-04-19T11:30:00Z',
    messages: [
      { from: 'hello@sunriseyoga.com', body: 'The mobile app crashes every time our staff tries to check in a member. Started today morning.', time: '2025-04-19T11:30:00Z' },
    ],
    notes: [],
  },
];
