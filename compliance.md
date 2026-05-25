# OakBay Scheduler — Compliance Documentation

## Applicable Laws

This application is a chiropractic clinic scheduling system operating in Alberta, Canada.
It collects and stores personal health information and is subject to:

### 1. Health Information Act (HIA) — Alberta
The primary law governing health information in Alberta. Chiropractors are designated
custodians under the HIA. Key obligations:
- Section 60 — Custodians must protect health information using reasonable safeguards
- Section 63 — Access must be restricted to authorized staff only
- Section 34 — Individuals have the right to access their own health records
- Section 35 — Individuals may request corrections to their records

### 2. PIPEDA — Personal Information Protection and Electronic Documents Act (federal)
Governs collection, use, and disclosure of personal information in commercial activities.
Key principles: consent, limiting collection, accuracy, safeguards, and accountability.

---

## What Data We Store

| Field | Model | Classification | Protection |
|-------|-------|---------------|------------|
| firstName, lastName | Patient | Personal information | None (name only) |
| phone | Patient | Personal information | Plaintext (needed for search) |
| email | Patient | Personal information | Plaintext (needed for reminders) |
| ahcNumber | Patient | Protected health information | AES-256-GCM encrypted |
| notes | Patient | Health information | AES-256-GCM encrypted |
| password | User | Credential | bcrypt hashed (cost 12) |
| amount, paymentType | Payment | Financial | Plaintext |
| last4, brand, expiry | Card | Partial card data | Plaintext (last4 only — no full PAN) |

---

## Implemented Security Measures

### Authentication & route protection
- Firebase session cookie (`__session`) verified on staff pages and API routes via `middleware.ts`
- API handlers wrapped with `withAuth` / `withAuthSimple` (`lib/withAuth.ts`)
- Public exceptions: login/session exchange, `/book`, booking request POST, availability GET, `/api/health`

### Field-Level Encryption (`lib/encrypt.ts`)
- Algorithm: AES-256-GCM (authenticated encryption)
- Applied to: `ahcNumber`, `notes`
- Key storage: 256-bit key in `ENCRYPTION_KEY` environment variable, never in code
- Each record gets a unique random IV — no two encryptions are the same
- Legacy plaintext values (no `enc:` prefix) still decrypt for backwards compatibility

### Role-based redaction (`lib/auth/redact.ts`)
- Receptionists see `ahcNumber: "Restricted"` — chiropractors and administrators see full values
- Enforced on patient list, create, and detail API responses

### Audit log (`AuditLog` model, `lib/audit/log.ts`)
- Records staff access to patient records, payments, and cards on file
- Fields: action, user id/email/role, patient id, resource id, IP, timestamp
- See `docs/reliability-and-trust.md` for monitored actions

### Password Hashing (`lib/hash.ts`)
- Algorithm: bcrypt, cost factor 12 (OWASP minimum recommendation)
- Applied to all User.password fields on creation and seeding

### Input Sanitization (`lib/profanity.ts`)
- Library: leo-profanity
- Free-text fields (notes, requestMessage, adminNotes) are cleaned before saving
- Patient names are rejected outright if they contain flagged words

### Card Data Minimization
- Only last 4 digits, brand, and expiry stored — never full card numbers
- No external payment processor — clinic processes cards in person

### Public booking safeguards
- Honeypot field, rate limit (5 requests/hour per email), one pending request per email
- Returning patients matched by email; new patients cannot reuse an existing email

---

## Operational reliability

See **`docs/reliability-and-trust.md`** for health checks, Neon connection guidance, and deployment checklist.

---

## Remaining gaps (future)

| Gap | Risk | Recommended fix |
|-----|------|----------------|
| No audit log UI for administrators | Harder to review access | Admin page to query `AuditLog` with date filters |
| Notes visible to all staff roles | Reception may not need clinical notes | Optional `canViewPatientNotes` role gate |
| AI copilot may receive patient context | Third-party processing | Document in privacy policy; restrict copilot to authorized roles |

---

## How to Generate an Encryption Key

Run once, store result in `.env.local` and production environment variables:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env.local`:
```
ENCRYPTION_KEY=<64-character-hex-string>
```

Never commit this key to Git.

After enabling encryption for notes, existing plaintext notes continue to work until re-saved (decrypt treats non-`enc:` values as plaintext).

---

## Database migrations

Apply in production after each release (loads `.env.local`):
```bash
npm run db:migrate:deploy
```

Includes `AuditLog` table (`20260526120000_add_audit_log`).

---

## Patient Rights (HIA Section 34-35)

Patients may request access to or correction of their personal health information.
These requests should be handled by the clinic administrator directly in the system.

*Last updated: May 2026*
*Prepared for Oak Bay Family Chiropractic — SAIT Capstone Project (G6 SAITMafia)*
