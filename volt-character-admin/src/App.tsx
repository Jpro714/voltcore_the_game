import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCharacters, requestActivationBundle, commitActivation, fetchActivationHistory } from './api/characters';
import { CHARACTER_API_BASE_URL } from './api/client';
import type { ActivationLog, Character } from './types';
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
  const [historyByCharacter, setHistoryByCharacter] = useState<Record<string, ActivationLog[]>>({});
  const [historyLoading, setHistoryLoading] = useState<Record<string, boolean>>({});
  const [expandedActivations, setExpandedActivations] = useState<Record<string, boolean>>({});
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

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

  const loadHistory = useCallback(async (characterId: string) => {
    if (!CHARACTER_API_BASE_URL) {
      return;
    }
    setHistoryLoading((prev) => ({ ...prev, [characterId]: true }));
    try {
      const entries = await fetchActivationHistory(characterId, 5);
      setHistoryByCharacter((prev) => ({ ...prev, [characterId]: entries }));
    } catch (err) {
      console.error(`Failed to load history for ${characterId}`, err);
    } finally {
      setHistoryLoading((prev) => ({ ...prev, [characterId]: false }));
    }
  }, []);

  useEffect(() => {
    if (characters.length > 0 && !selectedCharacterId) {
      setSelectedCharacterId(characters[0].id);
    } else if (selectedCharacterId && !characters.some((character) => character.id === selectedCharacterId)) {
      setSelectedCharacterId(characters[0]?.id ?? null);
    }
  }, [characters, selectedCharacterId]);

  useEffect(() => {
    if (selectedCharacterId) {
      void loadHistory(selectedCharacterId);
    }
  }, [selectedCharacterId, loadHistory]);

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
        await loadHistory(character.id);
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

  const selectedCharacter = selectedCharacterId ? characters.find((character) => character.id === selectedCharacterId) : null;
  const selectedHistory = selectedCharacterId ? historyByCharacter[selectedCharacterId] ?? [] : [];

  const toggleActivation = useCallback((activationId: string) => {
    setExpandedActivations((prev) => ({ ...prev, [activationId]: !prev[activationId] }));
  }, []);

  const renderDetail = useCallback(() => {
    if (!selectedCharacter) {
      return <div className="empty-state">Select a character to view details.</div>;
    }

    return (
      <div className="detail-panel">
        <header className="detail-header">
          <div>
            <h2>{selectedCharacter.displayName}</h2>
            <p>@{selectedCharacter.twitterHandle}</p>
          </div>
          <span className={`status-pill ${selectedCharacter.isActive ? 'status-pill--active' : ''}`}>
            {selectedCharacter.isActive ? 'Active' : 'Paused'}
          </span>
        </header>

        <section className="detail-section">
          <h3>Persona</h3>
          <p>{personaSummary(selectedCharacter)}</p>
          {selectedCharacter.persona?.interests && selectedCharacter.persona.interests.length > 0 && (
            <p className="muted">Interests: {selectedCharacter.persona.interests.join(', ')}</p>
          )}
        </section>

        <section className="detail-grid">
          <div>
            <h4>Current Situation</h4>
            <p>{selectedCharacter.state?.currentSituation || '—'}</p>
          </div>
          <div>
            <h4>Working Memory</h4>
            <p>{selectedCharacter.state?.workingMemory || '—'}</p>
          </div>
        </section>

        <section className="detail-grid">
          <div>
            <h4>Last Activation</h4>
            <p>{formatTimestamp(selectedCharacter.state?.lastActivationAt)}</p>
          </div>
          <div>
            <h4>Next Activation</h4>
            <p>{formatTimestamp(selectedCharacter.state?.nextActivationAt)}</p>
          </div>
        </section>

        {logMessages[selectedCharacter.id] && <div className="activation-log">{logMessages[selectedCharacter.id]}</div>}

        <section className="detail-section">
          <div className="history-header">
            <span>Recent Activations</span>
            <button type="button" onClick={() => loadHistory(selectedCharacter.id)} disabled={historyLoading[selectedCharacter.id]}>
              {historyLoading[selectedCharacter.id] ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {historyLoading[selectedCharacter.id] && selectedHistory.length === 0 ? (
            <div className="history-empty">Loading history…</div>
          ) : selectedHistory.length > 0 ? (
            <ul className="history-list history-list--detail">
              {selectedHistory.map((entry) => (
                <li key={entry.id} onClick={() => toggleActivation(entry.id)}>
                  <button type="button" className="history-entry">
                    <div>
                      <div className="history-summary">{entry.summary ?? 'No summary provided.'}</div>
                      <div className="history-meta">
                        <span>{new Date(entry.occurredAt).toLocaleString()}</span>
                        <span>{Array.isArray(entry.actions) ? `${entry.actions.length} actions` : '0 actions'}</span>
                      </div>
                    </div>
                    <span>{expandedActivations[entry.id] ? 'Hide' : 'View'}</span>
                  </button>
                  {expandedActivations[entry.id] && (
                    <pre className="history-actions">{JSON.stringify(entry.actions, null, 2)}</pre>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="history-empty">No activations yet.</div>
          )}
        </section>

        <footer className="detail-footer">
          <button type="button" onClick={() => handleActivate(selectedCharacter)} disabled={activating === selectedCharacter.id}>
            {activating === selectedCharacter.id ? 'Activating…' : 'Activate Now'}
          </button>
        </footer>
      </div>
    );
  }, [
    activating,
    expandedActivations,
    handleActivate,
    historyLoading,
    loadHistory,
    logMessages,
    personaSummary,
    selectedCharacter,
    selectedHistory,
    toggleActivation,
  ]);

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
      <div className="control-layout">
        <aside className="character-list">
          {characters.map((character) => (
            <button
              key={character.id}
              className={
                character.id === selectedCharacterId ? 'character-list__item character-list__item--active' : 'character-list__item'
              }
              onClick={() => setSelectedCharacterId(character.id)}
            >
              <div>
                <div className="character-list__name">{character.displayName}</div>
                <div className="character-list__handle">@{character.twitterHandle}</div>
              </div>
              <div className="character-list__meta">
                <span>{character.isActive ? 'Active' : 'Paused'}</span>
                <span>{formatTimestamp(character.state?.nextActivationAt)}</span>
              </div>
            </button>
          ))}
        </aside>
        <section className="character-detail">{renderDetail()}</section>
      </div>
    );
  }, [CHARACTER_API_BASE_URL, characters, loading, renderDetail, selectedCharacterId]);

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
