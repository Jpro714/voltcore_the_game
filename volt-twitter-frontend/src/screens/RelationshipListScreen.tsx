import { useEffect, useState } from 'react';
import { fetchFollowersList, fetchFollowingList } from '../api/feedApi';
import { User } from '../types/feed';
import '../styles/RelationshipListScreen.css';

interface Props {
  handle: string;
  type: 'followers' | 'following';
  onBack: () => void;
  onSelectProfile: (user: User) => void;
}

const RelationshipListScreen: React.FC<Props> = ({ handle, type, onBack, onSelectProfile }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const fetcher = type === 'followers' ? fetchFollowersList : fetchFollowingList;
    fetcher(handle)
      .then((response) => {
        setUsers(response);
        setIsLoading(false);
      })
      .catch((err) => {
        setError((err as Error).message);
        setIsLoading(false);
      });
  }, [handle, type]);

  const title = type === 'followers' ? 'Followers' : 'Following';

  return (
    <section className="relationship-list">
      <button type="button" className="relationship-list__back" onClick={onBack}>
        ← Back
      </button>
      <header className="relationship-list__header">
        <h2>{title}</h2>
        <p>@{handle}</p>
      </header>
      {isLoading && <p className="relationship-list__status">Loading {title.toLowerCase()}…</p>}
      {!isLoading && error && <p className="relationship-list__status relationship-list__status--error">{error}</p>}
      {!isLoading && !error && users.length === 0 && (
        <p className="relationship-list__status">No {title.toLowerCase()} yet.</p>
      )}
      {!isLoading && !error && users.length > 0 && (
        <ul className="relationship-list__items">
          {users.map((user) => (
            <li key={user.id}>
              <button type="button" onClick={() => onSelectProfile(user)}>
                <img src={user.avatar} alt={user.displayName} />
                <div>
                  <span className="relationship-list__name">{user.displayName}</span>
                  <span className="relationship-list__handle">@{user.handle}</span>
                  {user.tagline && <span className="relationship-list__tagline">{user.tagline}</span>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default RelationshipListScreen;
