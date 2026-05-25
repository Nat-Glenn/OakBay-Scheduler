# Reliability & Trust

Operational practices so staff can depend on the scheduler during clinic hours.

## Monitoring

| Check | Endpoint | Expected |
|-------|----------|----------|
| App + database | `GET /api/health` | `200` with `"status":"ok"` and `"database":"connected"` |
| Degraded DB | Same | `503` with `"database":"disconnected"` |

Configure Azure App Service (or your host) to poll `/api/health` every 1–5 minutes. No authentication required.

## Database (Neon)

- Use the **pooled** connection string (`-pooler` in hostname) for `DATABASE_URL`.
- Add `connect_timeout=15` so cold starts do not fail silently.
- After schema changes: `npm run db:migrate:deploy` in production (loads `.env.local`), then restart the app.

## API behaviour

- Staff routes use `withAuth` / `withAuthSimple` (Firebase session cookie).
- Public booking: `POST /api/booking-requests`, `GET /api/booking-requests/availability` only.
- Errors return JSON `{ error: "..." }` with appropriate HTTP status codes.

## Audit trail (trust)

Sensitive actions are logged to `AuditLog` (who, when, which patient):

- Patient view / create / update
- Payment recorded at checkout
- Cards on file list / create / update / delete

Audit writes never block the main request; failures are logged to the server console.

## Deployment checklist

1. `npx prisma migrate deploy`
2. `ENCRYPTION_KEY` set in production (64-char hex)
3. `FIREBASE_SERVICE_ACCOUNT_JSON` configured; remove `NEXT_PUBLIC_SKIP_AUTH` in production
4. Health check URL registered with your host

*Last updated: May 2026*
