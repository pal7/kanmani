# ADR-0001 — SSE over WebSockets for streaming

## Status
Accepted

## Date
2026-05-26

## Context

Kanmani's core UX is a chat interface where AI-generated responses stream token-by-token to the user. The experience degrades sharply if the user must wait for a full response before seeing anything — especially for Tamil, where responses tend to be longer in characters. We need a transport mechanism that can push partial text from server to browser in real time.

Two candidates are realistic: Server-Sent Events (SSE) and WebSockets (WS). Long-polling was dismissed immediately as it cannot support true streaming.

The communication pattern for an AI chat product is fundamentally asymmetric: the user sends one message (one POST), and the server sends back many small chunks over the next several seconds. There is no need for bidirectional concurrent messaging. The user's *next* message is a separate HTTP POST that only happens after the current response finishes.

The hosting environment constrains us further. Azure App Service (Linux, B1) sits behind a reverse proxy. WebSocket connections require an HTTP Upgrade handshake that some proxy configurations block or time out, and enabling WS support requires explicit App Service configuration. SSE uses a plain long-lived HTTP response — no upgrade, no special infrastructure headers beyond `Content-Type: text/event-stream`.

Finally, auth is a concern. The browser's native `EventSource` API does not support custom request headers, which means it cannot send a `Bearer` JWT. We solve this by using `fetch` with `ReadableStream` on the client instead, which gives us identical streaming semantics while keeping auth in the standard `Authorization` header.

## Decision

Use SSE (`text/event-stream`) for all model output streaming. User messages are sent as `POST /api/chat/stream`, which opens the SSE response. The server writes named events — `meta`, `delta`, `done`, `error` — as the Azure Foundry client yields tokens. Client consumes the stream via `fetch` + `ReadableStream`, not `EventSource`.

## Consequences

**Positive:**
- No protocol upgrade — passes transparently through Azure App Service's reverse proxy with zero extra configuration.
- Server implementation is straightforward: write chunks in a loop, call `res.end()` when done. No socket lifecycle to manage.
- The named-event wire format (`event: delta\ndata: {"text":"..."}\n\n`) is plain text, inspectable with `curl` during development.
- HTTP/2 multiplexing means the SSE stream does not starve other concurrent requests on the same connection.

**Negative / trade-offs:**
- Client disconnect detection is not instantaneous in all Node versions. Mitigated by listening to `req.on('close', ...)` and aborting the Azure stream immediately on disconnect.
- If we ever need server-initiated push outside of a response stream (e.g., push notifications), we would need a separate channel. That use case is not in scope.
- Reconnect after a network interruption is not transparent — we handle it at the UX layer (show an error, let the user resend) rather than auto-resuming, which is appropriate for a chat product.

## Alternatives Considered

**WebSockets:** Bidirectional, but bidirectionality is not needed here. The added complexity — upgrade handshake, connection state machine, heartbeat pings, Azure App Service WS flag — is pure overhead with no user-facing benefit. WS is the right tool for multiplayer games and collaborative editors; for a request-response chat product it is over-engineered.

**HTTP long-polling:** The client sends a request, the server holds it until data is available, responds, and the client immediately re-requests. This approximates streaming but adds a full network round-trip between every token chunk — unacceptable for token-by-token streaming where chunks can arrive every few milliseconds.

**HTTP/2 Server Push:** Programmatic browser use of HTTP/2 Push has been deprecated in Chrome and is not a viable option for this pattern.
