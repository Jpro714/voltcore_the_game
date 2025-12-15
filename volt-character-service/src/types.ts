export interface Persona {
  role: string;
  personality: string;
  interests: string[];
  tone?: string;
}

export interface ActivationBundle {
  characterId: string;
  handle: string;
  persona: Persona;
  state: {
    currentSituation?: string | null;
    workingMemory?: string | null;
    lastActivationAt?: string | null;
  };
  feed: unknown;
  profile: unknown;
}

export type CharacterActionType = 'post' | 'reply' | 'dm' | 'like' | 'noop';

export interface CharacterAction {
  type: CharacterActionType;
  content?: string;
  targetHandle?: string;
  referencePostId?: string;
  metadata?: Record<string, unknown>;
}

export interface ActivationDecision {
  summary: string;
  currentSituation?: string | null;
  workingMemory?: string | null;
  nextActivationMinutes?: number;
  actions: CharacterAction[];
}
