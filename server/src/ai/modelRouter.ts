import { env } from '../env.js';

export type Language = 'en' | 'ta';

// Exported as a const object so the routing table is inspectable directly
// (in tests, in logs, in the REPL) without calling a function.
// See ADR-0006 for the cost/quality reasoning behind this mapping.
export const MODEL_ROUTES = {
  en: env.AZURE_FOUNDRY_DEPLOYMENT_GPT4O_MINI,
  ta: env.AZURE_FOUNDRY_DEPLOYMENT_GPT4O,
} as const satisfies Record<Language, string>;

// Title generation always uses the mini model regardless of chat language.
// The task (produce a 4-6 word title) does not require full GPT-4o capability.
export const TITLE_MODEL = env.AZURE_FOUNDRY_DEPLOYMENT_GPT4O_MINI;

export function routeModel(language: Language): string {
  return MODEL_ROUTES[language];
}
