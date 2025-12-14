export interface Persona {
  role?: string;
  personality?: string;
  interests?: string[];
  tone?: string;
}

export interface CharacterState {
  id: string;
  characterId: string;
  currentSituation?: string | null;
  workingMemory?: string | null;
  lastActivationAt?: string | null;
  nextActivationAt?: string | null;
  notes?: string | null;
}

export interface Character {
  id: string;
  handle: string;
  displayName: string;
  twitterUserId: string;
  twitterHandle: string;
  persona?: Persona | null;
  cadenceMinutes?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  state?: CharacterState | null;
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
