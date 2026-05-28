import { complete } from './foundryClient.js';
import { TITLE_MODEL } from './modelRouter.js';
import type { Language } from './modelRouter.js';

const TITLE_INSTRUCTIONS: Record<Language, string> = {
  en: 'Generate a concise 4-6 word title for a chat conversation that starts with the following message. \
Return only the title — no punctuation, no quotes, no explanation.',
  ta: 'கீழே உள்ள செய்தியில் தொடங்கும் உரையாடலுக்கு 4-6 வார்த்தைகளில் தலைப்பு உருவாக்கு. \
தலைப்பை மட்டும் திருப்பி அனுப்பு — மேற்கோள் குறிகள், கூடுதல் விளக்கம் வேண்டாம்.',
};

const FALLBACK_TITLES: Record<Language, string> = {
  en: 'New conversation',
  ta: 'புதிய உரையாடல்',
};

/**
 * Generates a short chat title from the first user message.
 * Always uses gpt-4o-mini (see ADR-0006 — title quality doesn't need the full model).
 * Returns a fallback title rather than throwing if generation fails.
 */
export async function generateTitle(
  firstMessage: string,
  language: Language,
): Promise<string> {
  // Truncate very long first messages to keep the prompt cheap.
  // 300 chars gives the model enough context for a good title.
  const excerpt = firstMessage.length > 300
    ? `${firstMessage.slice(0, 300)}…`
    : firstMessage;

  try {
    const raw = await complete(TITLE_MODEL, [
      { role: 'system', content: TITLE_INSTRUCTIONS[language] },
      { role: 'user', content: excerpt },
    ]);

    const title = raw.trim().replace(/^["']|["']$/g, '');
    return title.length > 0 ? title : FALLBACK_TITLES[language];
  } catch {
    // Title generation is non-critical. A failed title is better than a
    // failed chat. Log silently and return the fallback.
    return FALLBACK_TITLES[language];
  }
}
