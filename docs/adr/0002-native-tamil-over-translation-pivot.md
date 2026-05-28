# ADR-0002 — Native Tamil end-to-end, not translation-pivot

## Status
Accepted

## Date
2026-05-26

## Context

Kanmani's primary differentiator is production-quality bilingual UX for Tamil speakers. Tamil support in consumer AI products is almost universally implemented as a thin translation layer: translate the Tamil input to English, call the model in English, translate the response back to Tamil. This approach exists because Tamil is underrepresented in training data relative to English, and because it reduces token cost.

The cost argument is real. Tamil text tokenizes at roughly 3–4× the token count of equivalent English text under the GPT-4o tokenizer (`o200k_base`). A sentence like "நான் உன்னை நேசிக்கிறேன்" (7 words, 28 characters) may tokenize to 15–20 tokens, while its English equivalent "I love you" is 3 tokens. At scale, native Tamil costs meaningfully more per conversation turn.

Despite this, the translation-pivot approach has fundamental product problems that make it incompatible with Kanmani's goals:

1. **Register and code-mixing.** Tamil speakers — especially the diaspora audience in Toronto and urban India — naturally blend Tamil and English in the same sentence (Tanglish: "அந்த meeting-ல என்ன நடந்தது?"). A translation layer collapses this into English, loses the mixed register entirely, and cannot reconstruct it on the way back. The output feels synthetic.

2. **Cultural and script accuracy.** Tamil has a formal literary register (இலக்கிய நடை) and a colloquial spoken register (பேச்சு வழக்கு). These are meaningfully different. A translate-to-English-and-back pipeline cannot preserve which register the user was in, so every response comes back in a flattened, committee-style Tamil that no native speaker uses in conversation.

3. **Streaming breakage.** SSE streaming is a portfolio-defining feature of this product. A translation-pivot architecture requires translating the *output* back to Tamil — but you cannot stream tokens from the model while simultaneously running them through a translation pass. You either wait for the full response (losing streaming) or buffer large chunks for translation (destroying the perceived streaming UX). Either way, the experience regresses.

4. **Latency.** Two translation API calls add at minimum 300–600ms per turn on top of the model latency. On a mobile connection in India, this is perceptible.

5. **Competitive moat.** The competitors Kanmani is built to beat (Lavanya, Chat AI Tamil, TamilAI.in) all use some form of translation pivot. The entire point of native Tamil is that the quality difference is immediately obvious to a fluent speaker.

## Decision

Tamil is handled natively end-to-end. User input in Tamil is sent directly to the model without any intermediate translation. The system prompt for Tamil chats is **written in Tamil**, establishing register tolerance, code-mixing awareness, and cultural grounding (see ADR-0006 for model routing, `docs/SYSTEM_PROMPTS.md` for prompt content). We use model routing to assign GPT-4o to Tamil chats, absorbing the higher token cost in exchange for the quality required to make native Tamil work well.

Cost is controlled through a tighter context window (2000 tokens for Tamil vs 3000 for English) and model routing for non-Tamil work.

## Consequences

**Positive:**
- Streaming works correctly — the model outputs Tamil tokens directly, which stream to the client in real time.
- Register and code-mixing are preserved, which is the actual product differentiator.
- The system prompt can establish cultural context (Tamil calendar, festivals, regional idiom) that a translation layer cannot carry.
- Simpler architecture: no translation service dependency, no translation API keys, no translation failure modes.

**Negative / trade-offs:**
- Tamil chats cost ~3–4× more per token than English chats on the same model.
- Mitigated by: routing Tamil to GPT-4o (which has better Tamil quality per token than mini), tighter context window, and a planned per-user soft daily token cap in Phase 2.
- GPT-4o's Tamil quality varies by topic. Highly technical Tamil (legal, medical) may have gaps. Mitigated by versioned system prompts and planned thumbs-up/down telemetry per language.

## Alternatives Considered

**Translate input EN → call model → translate output TA:**
Rejected for all the reasons above. Specifically: breaks streaming, loses register and code-mixing, adds 300–600ms latency, introduces a second vendor dependency, and produces Tamil that native speakers immediately identify as machine-translated. The cost saved is partly given back to the translation provider, and entirely given back in user trust.

**Hybrid: translate only input, respond natively:**
Still breaks streaming and register-matching. The model cannot match the user's register if it received a translated input.

**Use a smaller Tamil-specialized model for all languages:**
No production-ready Tamil-specialized model with comparable general capability exists as of the time of this decision. Phi-4 is experimental and tracked under ADR-0004.
