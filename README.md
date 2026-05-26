# Oak Bay Scheduler

Web application for managing appointments, patients, and payments for Oak Bay Family Chiropractic.

## Setup (Local)

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

Production / existing DB:

```bash
npm run db:migrate:deploy
```

Requires both `DATABASE_URL` (pooled Neon URL) and `DIRECT_URL` (non-pooler URL) in `.env.local` — see `.env.example`.

4. Start the development server:

```bash
npm run dev
```

Sign in at `/Login` with a staff email that exists in the database (Team page).

**Firebase (required for login):**

1. Add client keys and `FIREBASE_SERVICE_ACCOUNT_PATH` (or `FIREBASE_SERVICE_ACCOUNT_JSON`) — see `.env.example`.
2. Staff added under **Team** (admin) get a Firebase login automatically in demo mode (`DEMO_STAFF_PASSWORD`, default `123456`). No invite email is sent.
3. Each person's Firebase email must match their row in the database.

### Operations & compliance

- **Reliability / monitoring:** [docs/reliability-and-trust.md](docs/reliability-and-trust.md) — health check (`GET /api/health`), Neon DB, deploy checklist
- **Privacy & security:** [compliance.md](compliance.md) — HIA/PIPEDA, encryption, audit log, role redaction

### Temporary: skip auth while waiting for Firebase access

In `.env.local` (development only):

```bash
NEXT_PUBLIC_SKIP_AUTH=true
```

Restart `npm run dev`, then open `http://localhost:3000` directly. A yellow banner confirms auth is off. **Remove this line** once Firebase is configured — it has no effect in production builds.

### Optional: local AI code assistant

Install [Ollama](https://ollama.com/download), pull `llama3.2:3b`, and keep Ollama running for `/api/aiAssistant`.

The Summary page Clinic Copilot uses Azure OpenAI (`AZURE_OPENAI_*` in `.env.local`).
