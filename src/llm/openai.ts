import { AzureOpenAI, OpenAI } from 'openai';
import type { DraftingLlm, LlmDraft } from '../core/pipeline.js';
import type { RtsHit } from '../core/planner.js';
import type { Question } from '../core/types.js';
import { buildDraftPrompt, parseDraftReply } from './prompt.js';

/** OpenAI/Azure OpenAI drafter. Provider-agnostic hardening lives in prompt.ts. */
export class OpenAiDrafter implements DraftingLlm {
  private readonly client: OpenAI | AzureOpenAI;
  private readonly model: string;

  constructor() {
    const provider = process.env.LLM_PROVIDER ?? 'openai';

    if (provider === 'azure') {
      const endpoint = required('AZURE_OPENAI_ENDPOINT');
      const apiKey = required('AZURE_OPENAI_API_KEY');
      const deployment = required('AZURE_OPENAI_DEPLOYMENT');
      const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? '2024-02-01';
      this.client = new AzureOpenAI({ endpoint, apiKey, deployment, apiVersion });
      this.model = process.env.AZURE_OPENAI_MODEL ?? deployment;
    } else {
      const apiKey = required('OPENAI_API_KEY');
      const baseURL = process.env.OPENAI_BASE_URL;
      this.client = baseURL ? new OpenAI({ apiKey, baseURL }) : new OpenAI({ apiKey });
      this.model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    }
  }

  async draft(question: Question, hits: RtsHit[]): Promise<LlmDraft> {
    const message = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 500,
      messages: [{ role: 'user', content: buildDraftPrompt(question, hits) }],
    });
    const text = message.choices[0]?.message.content ?? '';
    return parseDraftReply(text);
  }
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}
