import { useEffect, useState } from 'react';
import TweetCard from '../components/TweetCard';
import { fetchAuthorProfile } from '../api/feedApi';
import { useFeed } from '../context/FeedContext';
import { AuthorProfile, Tweet, User } from '../types/feed';
import '../styles/AuthorProfileScreen.css';

interface Props {
  handle: string;
  onBack: () => void;
  onSelectTweet: (tweet: Tweet) => void;
  onSelectProfile: (user: User) => void;
}

const AuthorProfileScreen: React.FC<Props> = ({ handle, onBack, onSelectTweet, onSelectProfile }) => {
  const { likeTweet } = useFeed();
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchAuthorProfile(handle)
      .then((response) => {
        setProfile(response);
        setIsLoading(false);
      })
      .catch((err) => {
        setError((err as Error).message);
        setIsLoading(false);
      });
  }, [handle]);

  const handleLike = async (tweet: Tweet) => {
    const updated = await likeTweet(tweet.id);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            posts: prev.posts.map((post) => (post.id === updated.id ? updated : post)),
          }
        : prev,
    );
  };

  if (isLoading) {
    return (
      <section className="author-profile">
        <button className="author-profile__back" onClick={onBack}>
          ← Back
        </button>
        <p className="author-profile__status">Loading profile...</p>
      </section>
    );
  }

  if (error || !profile) {
    return (
      <section className="author-profile">
        <button className="author-profile__back" onClick={onBack}>
          ← Back
        </button>
        <p className="author-profile__status author-profile__status--error">{error ?? 'Profile not found'}</p>
      </section>
    );
  }

  return (
    <section className="author-profile">
      <button className="author-profile__back" onClick={onBack}>
        ← Back
      </button>

      <header className="author-profile__hero">
        <img src={profile.user.avatar} alt={profile.user.displayName} />
        <div>
          <h2>{profile.user.displayName}</h2>
          <p>@{profile.user.handle}</p>
          {profile.user.tagline && <p className="author-profile__tagline">{profile.user.tagline}</p>}
          {profile.bio && <p className="author-profile__bio">{profile.bio}</p>}
          {profile.location && <p className="author-profile__location">📍 {profile.location}</p>}
          <div className="author-profile__stats">
            <span>
              <strong>{profile.stats.followers.toLocaleString()}</strong> Followers
            </span>
            <span>
              <strong>{profile.stats.following.toLocaleString()}</strong> Following
            </span>
            <span>
              <strong>{profile.stats.posts.toLocaleString()}</strong> Posts
            </span>
          </div>
        </div>
      </header>

      <div className="author-profile__timeline">
        <h3>Recent Posts</h3>
        {profile.posts.length === 0 && <p className="author-profile__status">No posts yet.</p>}
        {profile.posts.map((tweet) => (
          <TweetCard
            key={tweet.id}
            tweet={tweet}
            onSelect={onSelectTweet}
            onLike={handleLike}
            onOpenProfile={onSelectProfile}
          />
        ))}
      </div>
    </section>
  );
};

export default AuthorProfileScreen;
