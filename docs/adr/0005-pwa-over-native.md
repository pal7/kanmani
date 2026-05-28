# ADR-0005 — PWA over native app (Android-first)

## Status
Accepted

## Date
2026-05-26

## Context

Kanmani's target audience uses Android as their primary device — Tamil speakers in India and the diaspora skew heavily toward Android, where market share exceeds 90% in India. The product needs to feel installed: home screen icon, full-screen launch, and an offline shell that loads the UI immediately even without a network connection (the user can see their chat history from cache while the app reconnects).

The question is whether to build a native Android app, a cross-platform native app (React Native or Flutter), or a Progressive Web App.

The constraints are:
- Single developer, frontend/full-stack background
- React 18 + TypeScript already chosen for the web frontend
- No current requirement for device APIs beyond what the web platform provides (camera, microphone are Phase 2 via the Web API equivalents)
- No app store launch required for MVP; the audience is reachable via a web link
- Rapid iteration is important — store review cycles (2–7 days) would slow down the early feedback loop

iOS is a secondary target. Apple's PWA support has improved but is still meaningfully worse than Android's: push notifications require iOS 16.4+, some install flows are less discoverable, and background sync is limited. This is accepted for MVP and documented in Phase 2.

## Decision

Build a PWA using Vite PWA plugin (Workbox) with a Web App Manifest, maskable icon set, and a service worker that precaches the app shell and self-hosted Tamil fonts. The install prompt on Android Chrome is native; users tap "Add to Home Screen" and get a standalone app experience.

The service worker strategy: app shell (HTML, JS, CSS) is precached on install. Tamil font files (`noto-tamil-*.woff2`) are precached because they are the most expensive asset to load on a slow connection and the most critical for Tamil UX. API calls are not cached — chat data is live.

## Consequences

**Positive:**
- Single codebase serves both web and "installed" Android experience. No maintained fork.
- No app store review: deploy on merge, users get the update automatically via Workbox's `autoUpdate` registration strategy.
- Offline shell: the app loads and shows cached chat history even on a flaky 2G connection common in rural India.
- Tamil fonts are precached — first paint in Tamil is instant after the first load, even offline.
- Full-screen standalone mode (`"display": "standalone"`) removes browser chrome, giving native-like UX.

**Negative / trade-offs:**
- iOS PWA limitations: no background sync, weaker install discoverability, push notifications require iOS 16.4+. Accepted for MVP; tracked in Phase 2.
- Service worker debugging adds complexity. Stale cache bugs can be hard to reproduce. Mitigated by Workbox's structured caching strategies and explicit `skipWaiting` / `clientsClaim` config.
- Android install prompt (`beforeinstallprompt`) requires HTTPS, a manifest with required fields, and a registered service worker. All three are met by the production deployment on Azure Static Web Apps (HTTPS by default) and the Vite PWA plugin.
- No access to Android system APIs (Bluetooth, NFC, background location). Not needed for this product; if voice input is added in Phase 2, the Web Speech API covers the use case.

## Alternatives Considered

**React Native:** Would allow code sharing of business logic with a native shell. Rejected because: it requires a separate build pipeline, Apple Developer and Google Play accounts, store review, and a different component model (React Native components, not DOM). The development velocity cost is high and the UX gain over a well-built PWA on Android is marginal for a text-based chat app.

**Flutter:** Strong Android performance, excellent multilingual text rendering. Rejected because: entirely different language (Dart) and framework — no code sharing with the web frontend, doubling the maintenance surface. The developer's background is frontend/TypeScript, not Dart.

**Capacitor (web-to-native wrapper):** A middle path — wrap the web app in a native shell for store distribution. Worth revisiting in Phase 2 if store presence becomes important. Rejected for MVP because it still requires a store submission workflow and adds a native build step without clear UX benefit at this stage.

**Native Android (Kotlin/Jetpack Compose):** Best possible Android UX but requires learning a new stack entirely. Not compatible with the portfolio goal of demonstrating frontend + AI engineering.
