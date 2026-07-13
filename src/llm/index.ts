import type { DraftingLlm } from '../core/pipeline.js';
import { AnthropicDrafter } from './anthropic.js';
import { OpenAiDrafter } from './openai.js';

/**
 * Create the production drafting LLM from environment variables.
 *
 *   LLM_PROVIDER=anthropic (default) → ANTHROPIC_API_KEY
 *   LLM_PROVIDER=openai             → OPENAI_API_KEY, optionally OPENAI_MODEL / OPENAI_BASE_URL
 *   LLM_PROVIDER=azure              → AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT
 */
export function createDrafter(): DraftingLlm {
  const provider = process.env.LLM_PROVIDER ?? 'anthropic';
  switch (provider) {
    case 'openai':
    case 'azure':
      return new OpenAiDrafter();
    case 'anthropic':
    default:
      return new AnthropicDrafter();
  }
}
