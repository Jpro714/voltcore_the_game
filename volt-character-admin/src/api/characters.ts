import { apiRequest } from './client';
import { ActivationLog, Character } from '../types';

export const fetchCharacters = () => apiRequest<Character[]>('/characters');

export const triggerActivation = (id: string) =>
  apiRequest(`/characters/${id}/activation/run`, {
    method: 'POST',
  });

export const updateCharacterCadence = (id: string, payload: { cadenceMinMinutes: number; cadenceMaxMinutes: number }) =>
  apiRequest<Character>(`/characters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const fetchActivationHistory = (id: string, limit = 5) =>
  apiRequest<ActivationLog[]>(`/characters/${id}/activations?limit=${limit}`);
