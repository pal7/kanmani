# ADR-0004 — Azure AI Foundry over OpenAI direct

## Status
Accepted

## Date
2026-05-26

## Context

Kanmani needs access to GPT-4o and GPT-4o-mini for its core AI functionality. Both Azure AI Foundry and the OpenAI API expose these models with nearly identical REST interfaces (Azure Foundry implements the OpenAI API spec). The technical capability is equivalent; the decision is about operational, commercial, and strategic fit.

The developer has an existing Azure DevOps environment and organizational familiarity with Azure. Hosting is already decided as Azure Static Web Apps (client) and Azure App Service (server). Billing and infrastructure management are Azure-native. Introducing a second cloud vendor (OpenAI) purely for the AI layer would split billing, logging, and monitoring across two platforms without any technical benefit on the model layer.

Azure AI Foundry also provides access to the Microsoft model family — specifically Phi-4, a small language model with strong multilingual capabilities that is a candidate for a future Tamil A/B test. This is not available through the OpenAI API.

The data residency argument matters for the target audience. Tamil users in India are increasingly attentive to where their data is processed. Azure's regional data centers include India West and India South, allowing us to specify a deployment region that keeps data in-country. OpenAI's API does not offer comparable data residency guarantees.

## Decision

Use Azure AI Foundry as the AI provider. All model calls go through a single `foundryClient.ts` wrapper that reads deployment names from environment variables. This abstraction means the routes and context builder have no knowledge of whether the underlying deployment is GPT-4o, GPT-4o-mini, or Phi-4 — they only see a deployment name string passed in by `modelRouter.ts`. The SDK is `@azure/openai`, which is the official Azure client for AI Foundry.

## Consequences

**Positive:**
- Unified Azure billing: one invoice, one cost dashboard, one set of access controls.
- Azure Monitor + Application Insights can collect telemetry from both the App Service and the AI Foundry deployments in the same workspace.
- Access to Phi-4 for the planned Tamil A/B test without a separate API relationship.
- Data residency in Azure India regions is available and documentable.
- The `@azure/openai` SDK is maintained by Microsoft and tracks the Azure Foundry API version lifecycle.

**Negative / trade-offs:**
- The Azure SDK is slightly more verbose than the OpenAI SDK — deployment name is a separate parameter rather than the model field. This is fully absorbed by `foundryClient.ts`; no route or AI layer file sees it.
- Azure AI Foundry deployment requires provisioning capacity (TPM quotas) per region and deployment. This is a one-time setup cost documented in `docs/DEPLOYMENT.md`.
- The `AZURE_FOUNDRY_API_VERSION` environment variable must be kept up to date as Azure rotates API versions. Current version: `2024-10-21`.

## Alternatives Considered

**OpenAI direct API:** The technically simpler choice — fewer setup steps, same models. Rejected because: no Phi-4, no Azure billing integration, no India data residency, splits the vendor surface of an otherwise entirely Azure deployment. For a solo or small-team project where Azure is already the platform, the simplicity of OpenAI direct does not outweigh the coherence of staying Azure-native.

**Anthropic Claude API:** Different model family. Not rejected on quality grounds, but the user requirement is Azure and the GPT-4o family has better documented Tamil tokenization characteristics. Would also break the Azure-native billing and monitoring story.

**Google Vertex AI (Gemini):** Another strong multilingual model. Same objections as Anthropic: third cloud vendor, breaks billing coherence, not the user requirement.

**Self-hosted open-source model (Ollama, vLLM):** Would require significant infrastructure investment for GPU hosting. Tamil quality from available open models is not competitive with GPT-4o as of this decision. Potentially interesting for a future Phi-4 on-premises deployment but not for MVP.
