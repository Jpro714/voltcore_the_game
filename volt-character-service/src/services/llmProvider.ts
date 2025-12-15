import { ActivationBundle, ActivationDecision } from '../types.js';
import { OpenAIProvider } from './providers/openaiProvider.js';

export interface LLMProvider {
  generateActivation(bundle: ActivationBundle): Promise<ActivationDecision>;
}

let cachedProvider: LLMProvider | null = null;

export const getLLMProvider = (): LLMProvider => {
  if (cachedProvider) {
    return cachedProvider;
  }

  const providerName = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase();

  switch (providerName) {
    case 'openai':
      cachedProvider = new OpenAIProvider();
      return cachedProvider;
    default:
      throw new Error(`Unsupported LLM provider: ${providerName}`);
  }
};
