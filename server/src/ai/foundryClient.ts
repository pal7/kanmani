import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import type {
  ChatRequestMessageUnion,
  GetChatCompletionsOptions,
  ChatCompletions,
} from '@azure/openai';
import { env } from '../env.js';

export type { ChatRequestMessageUnion, ChatCompletions };

// Singleton — one HTTP connection pool for the lifetime of the process.
// Do not construct per-request; the Azure SDK manages keep-alive and retries.
let _client: OpenAIClient | undefined;

export function getClient(): OpenAIClient {
  if (!_client) {
    _client = new OpenAIClient(
      env.AZURE_FOUNDRY_ENDPOINT,
      new AzureKeyCredential(env.AZURE_FOUNDRY_API_KEY),
    );
  }
  return _client;
}

/**
 * Streams chat completion tokens from Azure AI Foundry.
 * Yields each non-empty content delta as a string.
 * Throws on model errors; the caller (SSE route) is responsible for
 * converting thrown errors into `event: error` frames.
 */
export async function* streamCompletion(
  deployment: string,
  messages: ChatRequestMessageUnion[],
  options?: GetChatCompletionsOptions,
): AsyncGenerator<string> {
  const client = getClient();
  const stream = await client.streamChatCompletions(deployment, messages, options);

  for await (const completion of stream) {
    const content = completion.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

/**
 * Non-streaming completion — used only by the title generator.
 * Returns the full response text or throws on error.
 */
export async function complete(
  deployment: string,
  messages: ChatRequestMessageUnion[],
  options?: GetChatCompletionsOptions,
): Promise<string> {
  const client = getClient();
  const result = await client.getChatCompletions(deployment, messages, options);
  return result.choices[0]?.message?.content ?? '';
}
