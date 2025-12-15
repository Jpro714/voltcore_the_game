import OpenAI from 'openai';
import { LLMProvider } from '../llmProvider.js';
import { ActivationBundle, ActivationDecision, CharacterActionType, PingContext } from '../../types.js';

const actionTypes: CharacterActionType[] = ['post', 'reply', 'dm', 'like', 'noop'];

const activationSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'Short recap (1-2 sentences) of what the character intends to do next.' },
    currentSituation: { type: ['string', 'null'] },
    workingMemory: { type: ['string', 'null'] },
    nextActivationMinutes: { type: ['number', 'null'], description: 'Minutes until the character should wake up again.' },
    actions: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: actionTypes },
          content: { type: ['string', 'null'] },
          targetHandle: { type: ['string', 'null'] },
          referencePostId: { type: ['string', 'null'] },
        },
        required: ['type', 'content', 'targetHandle', 'referencePostId'],
        additionalProperties: false,
      },
    },
  },
  required: ['summary', 'currentSituation', 'workingMemory', 'nextActivationMinutes', 'actions'],
  additionalProperties: false,
};

const describePingGuidance = (ping?: PingContext) => {
  if (!ping) {
    return '';
  }

  if (ping.type === 'reply') {
    const payload = ping.payload ?? {};
    const depthValue =
      payload && typeof payload === 'object' ? (payload as Record<string, unknown>)['threadDepth'] : undefined;
    const depth = typeof depthValue === 'number' ? depthValue : Number(depthValue ?? 0);
    return `This ping is a reply inside a thread depth of ${depth}. Review the provided threadHistory before acting. The deeper the thread, the less obligated you are to respond—once depth reaches 2 or more, default to "noop" unless the new message demands it, to avoid endless back-and-forth.`;
  }

  if (ping.type === 'dm') {
    return 'This ping is a direct message; respond privately only if you have something meaningful to add.';
  }

  return 'This ping is a public mention; consider a brief reply if it adds value.';
};

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.client = new OpenAI({ apiKey });
    this.model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  }

  async generateActivation(bundle: ActivationBundle): Promise<ActivationDecision> {
    const response = await this.client.responses.create({
      model: this.model,
      text: {
        format: {
          type: 'json_schema',
          name: 'ActivationPlan',
          schema: activationSchema,
          strict: true,
        },
      },
      input: [
        {
          role: 'system',
          content: `You simulate autonomous social media personas living in the Voltcore universe. Your handle is ${
            bundle.handle
          }. Never send direct messages to yourself. When "ping" data is present treat it as an urgent summon:
- type "dm": someone messaged you privately; respond privately if helpful.
- type "mention": another user tagged you publicly; consider replying on that thread.
- type "reply": someone replied to one of your posts; evaluate if their message merits a response, do not fall into endless back-and-forth.
${describePingGuidance(bundle.ping)}
When a ping exists you may ignore the general feed (the threadHistory will be provided when relevant), and it is acceptable to emit a "noop" action if silence is best. Respond ONLY with JSON matching the provided schema.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            handle: bundle.handle,
            persona: bundle.persona,
            state: bundle.state,
            feed: bundle.feed,
            profile: bundle.profile,
            ping: bundle.ping ?? null,
          }),
        },
      ],
    });

    const output = (response as any).output?.[0]?.content?.[0];

    if (!output) {
      throw new Error('LLM response did not include output content.');
    }

    let payload: unknown;
    try {
      if (output.type === 'output_text' || output.type === 'text') {
        payload = JSON.parse(output.text);
      } else if (output.type === 'json_schema' || output.type === 'output_json') {
        const candidate = output.parsed_json ?? output.json ?? output.data ?? output;
        payload = typeof candidate === 'string' ? JSON.parse(candidate) : candidate;
      } else {
        throw new Error(`Unsupported OpenAI response content type: ${output.type}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse OpenAI response: ${(error as Error).message}`);
    }

    return payload as ActivationDecision;
  }
}
