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
  cadenceMinMinutes?: number | null;
  cadenceMaxMinutes?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  state?: CharacterState | null;
}

export interface ActivationLog {
  id: string;
  occurredAt: string;
  summary?: string | null;
  actions?: unknown;
  inputContext?: unknown;
  inputBundle?: unknown;
}
