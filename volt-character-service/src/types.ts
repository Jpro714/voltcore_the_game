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
