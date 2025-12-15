const baseUrl = process.env.CHARACTER_SERVICE_BASE_URL?.replace(/\/$/, '');

interface PingPayload {
  handle: string;
  type: 'mention' | 'dm' | 'reply';
  payload: Record<string, unknown>;
}

export async function sendCharacterPing(payload: PingPayload) {
  if (!baseUrl) {
    console.warn('[character-ping] CHARACTER_SERVICE_BASE_URL is not set, skipping ping', payload);
    return;
  }

  try {
    console.log(`[character-ping] sending ${payload.type} ping for @${payload.handle}`);
    const response = await fetch(`${baseUrl}/characters/pings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.warn(
        `[character-ping] service returned ${response.status} ${response.statusText} for handle @${payload.handle}`,
      );
    }
  } catch (error) {
    console.warn('Failed to notify character service about ping', (error as Error).message);
  }
}
