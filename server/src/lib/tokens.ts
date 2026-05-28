import { get_encoding } from 'tiktoken';

// All current deployments (gpt-4o, gpt-4o-mini, phi-4) use the o200k_base
// encoding. The encoder is created once at module load — WASM initialization
// is expensive and must not happen per-request.
const encoder = get_encoding('o200k_base');

/**
 * Returns the number of tokens in `text` under the o200k_base encoding
 * (GPT-4o family). The `model` parameter is accepted for API consistency
 * but currently ignored — all our deployments share the same encoding.
 *
 * Use this everywhere a token count is needed. Never count messages.length.
 */
export function estimateTokens(text: string, _model?: string): number {
  return encoder.encode(text).length;
}

/**
 * Returns the token budget for history messages given a language.
 * Tamil encodes at ~3-4× the density of English, so the window is tighter
 * to keep costs predictable and latency low.
 */
export function historyBudget(language: 'en' | 'ta'): number {
  return language === 'ta' ? 2000 : 3000;
}
