# Oak Bay Scheduler

Web application for day-to-day operations at **Oak Bay Family Chiropractic** — scheduling, patients, billing, online booking, and role-based staff access.

**Live demo:** _Add your Azure URL here after deploy_

## Features

- **Appointment scheduler** — daily calendar, statuses, practitioner columns
- **Public booking** (`/book`) — patients request appointments; reception approves or declines
- **Patients & billing** — records, checkout, card on file (last four digits only)
- **Team** — chiropractors and receptionists; admins manage staff and Firebase logins
- **Staff schedule** — monthly chiropractor hours (admin edit, all staff view)
- **Practice overview** — revenue and operations summary; optional Clinic Copilot (Azure OpenAI)
- **Security** — Firebase session cookies, encrypted PHI fields, audit logging, role-based access ([compliance.md](compliance.md))

## Tech stack

Next.js · React · Prisma · PostgreSQL (Neon) · Firebase Authentication · Tailwind CSS · Azure OpenAI · Azure Communication Services (email, optional)

## Setup (local)

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables and fill in values:

```bash
cp .env.example .env.local
```

3. Set up the database (Prisma reads `.env.local` via the scripts below — the CLI alone only loads `.env`):

```bash
npm run db:migrate:dev
npm run db:generate
npx prisma db seed
```

For production or an existing database:

```bash
npm run db:migrate:deploy
```

Requires `DATABASE_URL` (pooled Neon URL) and `DIRECT_URL` (non-pooler URL) in `.env.local` — see [.env.example](.env.example).

4. Start the development server:

```bash
npm run dev
```

Open `/Login` and sign in with a staff email that exists in the database (see **Team** in the app).

### Firebase (required for login)

1. Add Firebase **client** keys and **Admin** credentials in `.env.local` — see [.env.example](.env.example).
   - Local: `FIREBASE_SERVICE_ACCOUNT_PATH` pointing at your downloaded service account JSON.
   - Azure: use `FIREBASE_SERVICE_ACCOUNT_JSON` (full JSON on one line).
2. Admins add staff under **Team**. In demo mode, Firebase users are created automatically (`DEMO_STAFF_PASSWORD`, default `123456`). No invite email is sent.
3. Each person's Firebase email must match their row in the database.
4. Add your app host to Firebase **Authentication → Authorized domains** (e.g. `localhost` and your Azure hostname).

### Operations & compliance

- **Reliability:** [docs/reliability-and-trust.md](docs/reliability-and-trust.md) — health check (`GET /api/health`), deploy notes
- **Privacy & security:** [compliance.md](compliance.md) — HIA/PIPEDA, encryption, audit log, role redaction

### Optional: AI

- **Clinic Copilot** (Summary page) — set `AZURE_OPENAI_*` in `.env.local`
- **Local assistant** — [Ollama](https://ollama.com/download) with `llama3.2:3b` for `/api/aiAssistant`

### Local dev only: skip auth

If Firebase is not configured yet, you can bypass login in development:

```bash
# .env.local
NEXT_PUBLIC_SKIP_AUTH=true
```

Restart `npm run dev`. A yellow banner appears. **Remove this before production** — it has no effect when `NODE_ENV=production`.

## Deploy (Azure)

Set application settings for at least: `DATABASE_URL`, `ENCRYPTION_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`, all `NEXT_PUBLIC_FIREBASE_*` variables (also required at **build** time in GitHub Actions), and optional `AZURE_OPENAI_*`. Do not set `NEXT_PUBLIC_SKIP_AUTH` in production.

Run migrations against the target database before or after first deploy:

```bash
npm run db:migrate:deploy
```
