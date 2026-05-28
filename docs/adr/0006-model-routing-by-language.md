# ADR-0006 — Model routing by language

## Status
Accepted

## Date
2026-05-26

## Context

Kanmani supports two languages: English and Tamil. Both GPT-4o and GPT-4o-mini are available via Azure AI Foundry. The models differ significantly in cost and capability:

- **GPT-4o-mini** is approximately 15× cheaper per token than GPT-4o. For English conversations — where the quality gap is small for most everyday queries — this is the economically rational choice.
- **GPT-4o** has significantly better Tamil language quality: more accurate grammar, better register matching, stronger understanding of code-mixed Tanglish, and more culturally grounded responses. For Tamil, the quality difference is visible and matters to the product's core value proposition.

The problem is compounded by tokenization. Tamil text tokenizes at 3–4× the token density of English under `o200k_base`. A 200-character Tamil message may consume 60–80 tokens; a 200-character English message consumes 15–20. This makes every Tamil API call more expensive not just because of the model choice but also because of the input/output token counts.

If every conversation — English and Tamil — used GPT-4o, the cost structure would be: high model cost × high token count for Tamil, and high model cost × moderate token count for English. Routing gives us: moderate model cost × moderate token count for English, and high model cost × high token count for Tamil (unavoidable, but isolated to cases where the quality justifies it).

Title generation is a special case: it runs on the first user message to produce a 4–6 word chat title. This task does not require GPT-4o's full capability in any language. Auto-titles always use GPT-4o-mini regardless of chat language.

## Decision

Implement a `modelRouter.ts` module that maps language to deployment name:

```ts
const routes = {
  en: 'gpt-4o-mini',
  ta: 'gpt-4o',
} as const;
```

The route map is exported as a `const` (not a function that hides the mapping) so it is directly inspectable in code and tests. The router is a pure function with no side effects — it reads the map and returns a string. This makes it trivially testable and easy to audit.

A per-chat model override field exists in the `chats` table (`chats.model`) for power users and experiments, but the UI for this is deferred to Phase 2. For MVP, the router always determines the model.

The context window budget is also differentiated by language: 3000 tokens for English, 2000 tokens for Tamil. This is implemented in `contextBuilder.ts`, not here — but it is a direct consequence of the same cost reasoning.

## Consequences

**Positive:**
- Estimated 60–70% cost reduction on realistic mixed traffic (assume 60% English, 40% Tamil) versus routing all traffic to GPT-4o.
- Quality for Tamil is maximized by using the best available model where it matters most.
- The routing abstraction is in one place: `modelRouter.ts`. Adding Phi-4 as a third route (e.g., `ta_experimental: 'phi-4'`) requires adding one line to the map, not touching any route or middleware.
- Title generation is always cheap, regardless of chat language.

**Negative / trade-offs:**
- English queries that require deep reasoning (complex coding, long-form analysis) may hit GPT-4o-mini's capability ceiling. Mitigated by the per-chat model override field, available to power users in Phase 2.
- Language is determined at chat creation and persists in `chats.language`. Mid-chat language switch changes the system prompt but keeps the same deployment for the remainder of the chat. This is a simplification: a user who switches to Tamil mid-chat stays on GPT-4o-mini for the rest of that chat. Acceptable for MVP; a future version could re-route per-message.
- The routing logic is correct only if the `language` field in the request body accurately reflects what the user is typing. There is no automatic language detection. A user who types Tamil in an English-language chat will get GPT-4o-mini quality for their Tamil text. This edge case is accepted for MVP.

## Alternatives Considered

**All GPT-4o:** Maximizes quality for all languages but is the most expensive option. The cost difference is not justified for English queries where GPT-4o-mini performs comparably. Rejected on cost grounds.

**All GPT-4o-mini:** Minimizes cost but degrades Tamil quality below the product's baseline. The differentiator is native Tamil quality — routing everything to the cheaper model would undermine the core value proposition. Rejected on quality grounds.

**Runtime model picker UI (user selects the model):** Adds UI complexity and decision burden for users who came to have a conversation, not configure infrastructure. The right defaults should handle 95% of cases. Deferred to Phase 2 as an advanced setting.

**Per-message language detection and routing:** Technically more accurate — detect the language of each individual message and route accordingly. Adds latency (detection call before each model call), complexity, and a new failure mode (incorrect detection). Not worth the complexity for MVP. The per-chat language setting is explicit and user-controlled, which is simpler and more predictable.
