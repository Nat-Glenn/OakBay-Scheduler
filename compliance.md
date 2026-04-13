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
| notes | Patient | Health information | Profanity filtered |
| password | User | Credential | bcrypt hashed (cost 12) |
| amount, paymentType | Payment | Financial | Plaintext |
| last4, brand, expiry | Card | Partial card data | Plaintext (last4 only — no full PAN) |

---

## Implemented Security Measures

### Field-Level Encryption (lib/encrypt.ts)
- Algorithm: AES-256-GCM (authenticated encryption)
- Applied to: ahcNumber — Alberta Health Care number
- Key storage: 256-bit key in ENCRYPTION_KEY environment variable, never in code
- Each record gets a unique random IV — no two encryptions are the same

### Password Hashing (lib/hash.ts)
- Algorithm: bcrypt, cost factor 12 (OWASP minimum recommendation)
- Applied to all User.password fields on creation and seeding

### Input Sanitization (lib/profanity.ts)
- Library: leo-profanity
- Free-text fields (notes, requestMessage, adminNotes) are cleaned before saving
- Patient names are rejected outright if they contain flagged words

### Card Data Minimization
- Only last 4 digits, brand, and expiry stored — never full card numbers
- No external payment processor — clinic processes cards in person

---

## Known Gaps (Recommended Future Improvements)

| Gap | Risk | Recommended Fix |
|-----|------|----------------|
| notes field not encrypted | May contain health information | Encrypt using lib/encrypt.ts |
| No audit log | HIA s.63 requires access tracking | Add AuditLog Prisma model |
| authGuard.ts built but not applied to routes | API routes have no auth protection until frontend sends Bearer token | Apply verifyAuth middleware once frontend sends Firebase token in Authorization header |
| No role-based field filtering | Receptionists can see AHC numbers | Redact AHC from receptionist responses |

---

## How to Generate an Encryption Key

Run once, store result in .env.local and Vercel environment variables:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to .env.local:
ENCRYPTION_KEY=<64-character-hex-string>

Never commit this key to Git.

---

## Patient Rights (HIA Section 34-35)

Patients may request access to or correction of their personal health information.
These requests should be handled by the clinic administrator directly in the system.

*Last updated: April 2026*
*Prepared for Oak Bay Family Chiropractic — SAIT Capstone Project (G6 SAITMafia)*