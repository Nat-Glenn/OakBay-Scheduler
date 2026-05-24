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

3. Set up the database:

```bash
npx prisma migrate dev
npx prisma db seed
```

4. Start the development server:

```bash
npm run dev
```

Sign in at `/Login` with a Firebase account that has a verified email.

### Temporary: skip auth while waiting for Firebase access

In `.env.local` (development only):

```bash
NEXT_PUBLIC_SKIP_AUTH=true
```

Restart `npm run dev`, then open `http://localhost:3000` directly. A yellow banner confirms auth is off. **Remove this line** once `FIREBASE_SERVICE_ACCOUNT_JSON` is configured — it has no effect in production builds.

### Optional: local AI code assistant

Install [Ollama](https://ollama.com/download), pull `llama3.2:3b`, and keep Ollama running for `/api/aiAssistant`.

The Summary page Clinic Copilot uses Azure OpenAI (`AZURE_OPENAI_*` in `.env.local`).
