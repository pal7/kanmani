# ADR-0003 — Supabase over self-rolled auth

## Status
Accepted

## Date
2026-05-26

## Context

Kanmani requires user authentication for two reasons: to associate chat history with a specific user, and to authorize API requests so the server can enforce that users only access their own data.

The auth requirements are standard but not trivial: email/password sign-up with email verification, Google OAuth, JWT-based session management, and token refresh. Building this correctly from scratch means implementing password hashing (bcrypt), JWT signing and verification, refresh token rotation, OAuth 2.0 callback flows, CSRF protection on cookie-based flows, and rate limiting on auth endpoints. Each of these has a known class of implementation mistakes that result in security vulnerabilities.

The database requirement is equally standard: a Postgres database with row-level security so that even if application code has a bug that constructs a wrong query, the database itself will not return another user's rows.

The project is a learning and portfolio exercise, but that framing cuts both ways — it means we want to understand the decisions, not that we want to re-implement solved infrastructure. Auth and Postgres are the infrastructure layer; the application layer (bilingual AI, SSE streaming, model routing) is where the learning and portfolio value lives.

## Decision

Use Supabase for both authentication and the Postgres database. Supabase Auth handles email + Google OAuth out of the box. The Supabase Postgres instance is where `chats` and `messages` live, with Row Level Security policies that enforce ownership at the database layer. The API server verifies Supabase JWTs using the `SUPABASE_JWT_SECRET` without any network call — pure local signature verification.

## Consequences

**Positive:**
- One vendor for auth and database eliminates a synchronization problem: the `user_id` in the database is the same UUID that Supabase Auth issues, with no mapping layer.
- RLS policies mean that even a SQL injection vulnerability in application code — a `WHERE` clause that is constructed wrong — cannot leak another user's chats. The database enforces ownership independently of the application.
- JWT verification on the API server is stateless: verify the signature with the shared secret, extract `sub` as `user_id`. No auth service round-trip per request.
- Supabase's free tier is sufficient through early growth; the path to Pro is documented and straightforward.
- The Supabase client library (`@supabase/supabase-js`) is well-maintained and handles token refresh transparently on the client.

**Negative / trade-offs:**
- Supabase free tier has connection limits (default pooler: 60 connections). Under load we would need PgBouncer or the Supabase connection pooler. This is a known scaling concern documented in `docs/ARCHITECTURE.md`.
- Vendor lock-in: migrating away from Supabase Auth would require re-hashing passwords or forcing a password reset. Acceptable trade-off given the alternative is implementing auth ourselves.
- The Supabase service role key must never reach the client or be logged. It bypasses RLS. This is enforced by the environment variable architecture (server-only, never in `VITE_` prefix).

## Alternatives Considered

**NextAuth.js + self-hosted Postgres:** NextAuth is React/Next-specific — it would work but is designed around the Next.js request lifecycle and would feel awkward in an Express server. We would also need to manage a separate Postgres instance, doubling infrastructure concerns.

**Auth0 + separate Postgres:** Two vendors, two billing relationships, no integrated RLS story. Auth0 is excellent for enterprise SSO but is over-specified for a consumer app and expensive at scale.

**Azure Active Directory B2C:** Built for enterprise identity federation, not consumer sign-up flows. The UX for email sign-up with Azure AD B2C is customizable but complex. Does not give us a database. Inconsistent with the product's audience.

**Roll our own (bcrypt + JWT + Postgres):** The most educational option, but the risk surface for mistakes in auth implementation (insecure token storage, missing refresh token rotation, OAuth state parameter CSRF) is high enough that it would detract from the portfolio value rather than adding to it. We would be demonstrating that we can implement auth, not that we can architect a system.
