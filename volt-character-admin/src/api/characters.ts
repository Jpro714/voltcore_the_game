import { apiRequest } from './client';
import { ActivationBundle, ActivationLog, Character } from '../types';

export const fetchCharacters = () => apiRequest<Character[]>('/characters');

export const requestActivationBundle = (id: string) =>
  apiRequest<ActivationBundle>(`/characters/${id}/activation/request`, { method: 'POST' });

export interface ActivationCommitPayload {
  summary?: string;
  actions?: unknown;
  state?: {
    currentSituation?: string | null;
    workingMemory?: string | null;
    nextActivationAt?: string | null;
  };
}

export const commitActivation = (id: string, payload: ActivationCommitPayload) =>
  apiRequest<void>(`/characters/${id}/activation/commit`, {
    method: 'POST',
    body: JSON.stringify(payload),
    skipJson: true,
  });

export const fetchActivationHistory = (id: string, limit = 5) =>
  apiRequest<ActivationLog[]>(`/characters/${id}/activations?limit=${limit}`);
