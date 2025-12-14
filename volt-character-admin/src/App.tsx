import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCharacters, requestActivationBundle, commitActivation } from './api/characters';
import { CHARACTER_API_BASE_URL } from './api/client';
import type { Character } from './types';
import './App.css';

const DEFAULT_CADENCE_MINUTES = 10;

const formatTimestamp = (value?: string | null) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
};

function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);
  const [logMessages, setLogMessages] = useState<Record<string, string>>({});

  const loadCharacters = useCallback(async () => {
    if (!CHARACTER_API_BASE_URL) {
      setLoading(false);
      return;
    }
    try {
      setRefreshing(true);
      setError(null);
      const data = await fetchCharacters();
      setCharacters(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load characters');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  const handleActivate = useCallback(
    async (character: Character) => {
      if (!CHARACTER_API_BASE_URL) return;
      setActivating(character.id);
      setError(null);
      try {
        const bundle = await requestActivationBundle(character.id);
        const cadence = character.cadenceMinutes ?? DEFAULT_CADENCE_MINUTES;
        const nextActivationAt = new Date(Date.now() + cadence * 60 * 1000).toISOString();

        await commitActivation(character.id, {
          summary: 'Manual activation triggered from control panel',
          state: {
            currentSituation: bundle.state?.currentSituation ?? character.state?.currentSituation ?? null,
            workingMemory: bundle.state?.workingMemory ?? character.state?.workingMemory ?? null,
            nextActivationAt,
          },
        });

        setLogMessages((prev) => ({
          ...prev,
          [character.id]: `Activated manually at ${new Date().toLocaleTimeString()}`,
        }));

        await loadCharacters();
      } catch (err) {
        setError((err as Error).message || 'Failed to trigger activation');
      } finally {
        setActivating(null);
      }
    },
    [loadCharacters],
  );

  const personaSummary = useCallback((character: Character) => {
    const sections: string[] = [];
    if (character.persona?.role) {
      sections.push(character.persona.role);
    }
    if (character.persona?.tone) {
      sections.push(`Tone: ${character.persona.tone}`);
    }
    return sections.join(' • ') || '—';
  }, []);

  const content = useMemo(() => {
    if (!CHARACTER_API_BASE_URL) {
      return (
        <div className="empty-state">
          <h2>No API configured</h2>
          <p>Set <code>VITE_CHARACTER_API_URL</code> and restart the dev server to connect to the character service.</p>
        </div>
      );
    }

    if (loading) {
      return <div className="empty-state">Loading characters…</div>;
    }

    if (characters.length === 0) {
      return <div className="empty-state">No personas have been created yet.</div>;
    }

    return (
      <div className="card-grid">
        {characters.map((character) => (
          <article key={character.id} className="character-card">
            <header className="character-card__header">
              <div>
                <div className="character-card__name">{character.displayName}</div>
                <div className="character-card__handle">@{character.twitterHandle}</div>
              </div>
              <span className={`status-pill ${character.isActive ? 'status-pill--active' : ''}`}>
                {character.isActive ? 'Active' : 'Paused'}
              </span>
            </header>

            <dl>
              <div>
                <dt>Persona</dt>
                <dd>{personaSummary(character)}</dd>
                {character.persona?.interests && character.persona.interests.length > 0 && (
                  <dd className="muted">Interests: {character.persona.interests.join(', ')}</dd>
                )}
              </div>
              <div>
                <dt>Current Situation</dt>
                <dd>{character.state?.currentSituation || '—'}</dd>
              </div>
              <div>
                <dt>Working Memory</dt>
                <dd>{character.state?.workingMemory || '—'}</dd>
              </div>
              <div className="timeline">
                <div>
                  <dt>Last Activation</dt>
                  <dd>{formatTimestamp(character.state?.lastActivationAt)}</dd>
                </div>
                <div>
                  <dt>Next Activation</dt>
                  <dd>{formatTimestamp(character.state?.nextActivationAt)}</dd>
                </div>
              </div>
            </dl>

            {logMessages[character.id] && <div className="activation-log">{logMessages[character.id]}</div>}

            <footer className="character-card__actions">
              <button
                type="button"
                onClick={() => handleActivate(character)}
                disabled={activating === character.id}
              >
                {activating === character.id ? 'Activating…' : 'Activate Now'}
              </button>
            </footer>
          </article>
        ))}
      </div>
    );
  }, [CHARACTER_API_BASE_URL, activating, characters, handleActivate, loading, logMessages, personaSummary]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Volt Character Control</h1>
          <p>Monitor persona memory and fire test activations without touching the CLI.</p>
        </div>
        <button type="button" onClick={loadCharacters} disabled={refreshing || !CHARACTER_API_BASE_URL}>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {content}
    </div>
  );
}

export default App;
