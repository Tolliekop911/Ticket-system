# Wellyx Support — Ticketing System Demo

Internal support ticketing system for Wellyx, with email-based routing to agent groups.

## How it works

Emails arrive at `supportteam@wellyx.com` → Leads (Rebecca & Steve) assign to groups → Each group sees **only their own tickets**.

| Group | Members        | Notes               |
|-------|----------------|---------------------|
| 1     | TBD            | Awaiting new hire   |
| 2     | Casey & Aiden  |                     |
| 3     | David & Henry  |                     |
| 4     | Sarah & Andrew |                     |

## Demo Login

All accounts use password: **demo123**

| Username  | Role  | Access              |
|-----------|-------|---------------------|
| rebecca   | Lead  | All tickets + admin |
| steve     | Lead  | All tickets + admin |
| casey     | Agent | Group 2 only        |
| aiden     | Agent | Group 2 only        |
| david     | Agent | Group 3 only        |
| henry     | Agent | Group 3 only        |
| sarah     | Agent | Group 4 only        |
| andrew    | Agent | Group 4 only        |

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Framework: Next.js (auto-detected)
4. Deploy — done!

## Features

- **Role-based access**: Agents see only their group's tickets
- **Ticket management**: Reply, change status, set priority
- **Internal notes**: Team-only notes per ticket (like Bianco Fitness example)
- **Customer history**: All notes across all tickets per customer
- **Groups overview**: Leads see stats per group
- **Email simulation**: Leads can simulate an incoming email and route it to a group

## Next steps (production)

- Connect real email via Outlook/Gmail API or Zapier
- Auto-match customer by sender domain → auto-assign to group
- Add a real database (Supabase, PlanetScale, etc.)
- Add email notifications to agents on new ticket
