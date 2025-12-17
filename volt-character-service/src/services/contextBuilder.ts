import { getActivationBundle } from './activationService.js';
import { ActivationBundle, PingContext } from '../types.js';

interface SectionGenerator {
  title: string;
  generate: (bundle: ActivationBundle, helpers: ContextHelpers) => string | undefined | Promise<string | undefined>;
}

interface ThreadInsights {
  history: Array<{ id: string; authorHandle: string; content: string }>;
  participants: string[];
  depth: number;
  lastSpeaker?: string;
  previousSpeaker?: string;
}

interface ContextHelpers {
  thread?: ThreadInsights;
}

abstract class ActivationContextBuilder {
  constructor(protected bundle: ActivationBundle, protected helpers: ContextHelpers) {}

  async build() {
    const sections = await Promise.all(
      this.getSections().map(async (section) => this.formatSection(section.title, await section.generate(this.bundle, this.helpers))),
    );
    return sections.filter(Boolean).join('\n').trim();
  }

  protected abstract getSections(): SectionGenerator[];

  private formatSection(title: string, body?: string) {
    if (!body) return '';
    return `### ${title}\n${body}\n`;
  }
}

const personaSection: SectionGenerator = {
  title: 'Persona Snapshot',
  generate: (bundle) => {
    const personaBits = [
      bundle.persona.role ? `Role: ${bundle.persona.role}.` : null,
      bundle.persona.tone ? `Tone: ${bundle.persona.tone}.` : null,
      bundle.persona.personality ? `Personality: ${bundle.persona.personality}.` : null,
    ]
      .filter(Boolean)
      .join(' ');

    const situation = bundle.state.currentSituation ? `Current situation: ${bundle.state.currentSituation}.` : null;
    const memory = bundle.state.workingMemory ? `Working memory focus: ${bundle.state.workingMemory}.` : null;
    return [personaBits, situation, memory].filter(Boolean).join(' ');
  },
};

const timelineHighlightsSection: SectionGenerator = {
  title: 'Timeline Pulse',
  generate: (bundle) => {
    if (!Array.isArray(bundle.feed) || bundle.feed.length === 0) {
      return undefined;
    }
    const items = (bundle.feed as Record<string, any>[]).slice(0, 2).map((post) => {
      const authorHandle =
        typeof post.author === 'object' && post.author && 'handle' in post.author ? (post.author as any).handle : 'unknown';
      return `@${authorHandle}: ${post.content ?? ''}`;
    });
    return items.join('\n');
  },
};

const mentionSection: SectionGenerator = {
  title: 'Mention Alert',
  generate: (bundle) => {
    if (!bundle.ping || bundle.ping.type !== 'mention') return undefined;
    const payload = bundle.ping.payload ?? {};
    const source = typeof payload.sourceHandle === 'string' ? payload.sourceHandle : 'unknown';
    const quote = typeof payload.content === 'string' ? payload.content : '';
    return `@${source} tagged you publicly: "${quote}". Decide if a public response helps or if silence keeps leverage.`;
  },
};

const dmSection: SectionGenerator = {
  title: 'Direct Message',
  generate: (bundle) => {
    if (!bundle.ping || bundle.ping.type !== 'dm') return undefined;
    const payload = bundle.ping.payload ?? {};
    const sender = typeof payload.senderHandle === 'string' ? payload.senderHandle : 'unknown';
    const content = typeof payload.content === 'string' ? payload.content : '';
    return `Private note from @${sender}: "${content}". Reply privately only if it drives your objectives.`;
  },
};

const replyMetaSection: SectionGenerator = {
  title: 'Thread Snapshot',
  generate: (_bundle, helpers) => {
    if (!helpers.thread) return undefined;
    const { history, participants, depth } = helpers.thread;
    const lastTwo = history.slice(-2).map((entry, idx) => `${idx + 1}. @${entry.authorHandle}: ${entry.content}`);
    return `Conversation spans ${history.length} turns among ${participants.map((p) => `@${p}`).join(', ')} at depth ${depth}.
Recent turns:
${lastTwo.join('\n')}`;
  },
};

const replyGuidanceSection: SectionGenerator = {
  title: 'Engagement Guidance',
  generate: (bundle, helpers) => {
    if (!helpers.thread) return undefined;
    const { depth, lastSpeaker, previousSpeaker } = helpers.thread;
    const lines: string[] = [];
    if (lastSpeaker === bundle.handle) {
      lines.push('You already spoke last; stay silent unless you can reveal new evidence.');
    } else if (previousSpeaker === bundle.handle) {
      lines.push(`@${lastSpeaker} is responding directly to you—reply only if it shifts the narrative.`);
    }
    if (depth >= 2) {
      lines.push('Thread is deep; default to calm silence to avoid endless loops.');
    }
    if (!lines.length) {
      lines.push('Treat this reply as a single ping; respond only if it advances your goals.');
    }
    return lines.join(' ');
  },
};

const fallbackSection: SectionGenerator = {
  title: 'General Guidance',
  generate: (bundle) => {
    if (bundle.ping) return undefined;
    return 'No urgent mentions or DMs. Scan the feed, seed a storyline, or stay silent.';
  },
};

class ScrollContextBuilder extends ActivationContextBuilder {
  protected getSections(): SectionGenerator[] {
    return [personaSection, timelineHighlightsSection, fallbackSection];
  }
}

class MentionContextBuilder extends ActivationContextBuilder {
  protected getSections(): SectionGenerator[] {
    return [personaSection, mentionSection];
  }
}

class DMContextBuilder extends ActivationContextBuilder {
  protected getSections(): SectionGenerator[] {
    return [personaSection, dmSection];
  }
}

class ReplyContextBuilder extends ActivationContextBuilder {
  protected getSections(): SectionGenerator[] {
    return [personaSection, replyMetaSection, replyGuidanceSection];
  }
}

const deriveThreadInsights = (bundle: ActivationBundle): ThreadInsights | undefined => {
  if (!bundle.ping || bundle.ping.type !== 'reply') return undefined;
  const payload = bundle.ping.payload ?? {};
  const history = Array.isArray(payload.threadHistory)
    ? (payload.threadHistory as Array<{ id: string; authorHandle: string; content: string }>)
    : [];
  if (!history.length) return undefined;
  const participants = Array.from(new Set(history.map((entry) => entry.authorHandle)));
  const depth = typeof payload.threadDepth === 'number' ? payload.threadDepth : Number(payload.threadDepth ?? history.length - 1);
  const lastSpeaker = history[history.length - 1]?.authorHandle;
  const previousSpeaker = history[history.length - 2]?.authorHandle;
  return { history, participants, depth, lastSpeaker, previousSpeaker };
};

const selectBuilder = (bundle: ActivationBundle, helpers: ContextHelpers): ActivationContextBuilder => {
  if (bundle.ping) {
    switch (bundle.ping.type) {
      case 'dm':
        return new DMContextBuilder(bundle, helpers);
      case 'mention':
        return new MentionContextBuilder(bundle, helpers);
      case 'reply':
        return new ReplyContextBuilder(bundle, helpers);
      default:
        return new ScrollContextBuilder(bundle, helpers);
    }
  }
  return new ScrollContextBuilder(bundle, helpers);
};

export const createActivationContext = async (characterId: string, ping?: PingContext): Promise<ActivationBundle> => {
  let bundle = await getActivationBundle(characterId);
  if (ping) {
    bundle = { ...bundle, ping };
  }

  const helpers: ContextHelpers = {
    thread: deriveThreadInsights(bundle),
  };

  const builder = selectBuilder(bundle, helpers);
  const contextSummary = await builder.build();

  return {
    ...bundle,
    contextSummary,
  };
};
