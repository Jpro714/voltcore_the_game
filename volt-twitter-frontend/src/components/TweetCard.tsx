import { type MouseEvent } from 'react';
import { Tweet, User } from '../types/feed';
import '../styles/components/TweetCard.css';

const relativeTime = (timestamp: string) => {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMinutes = Math.floor((now - then) / (60 * 1000));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

interface Props {
  tweet: Tweet;
  onSelect?: (tweet: Tweet) => void;
  onLike?: (tweet: Tweet) => void;
  likeDisabled?: boolean;
  onOpenProfile?: (user: User) => void;
  variant?: 'default' | 'thread';
}

const TweetCard: React.FC<Props> = ({ tweet, onSelect, onLike, likeDisabled = false, onOpenProfile, variant = 'default' }) => {
  const cardClassName =
    variant === 'thread'
      ? 'tweet-card tweet-card--thread'
      : onSelect
        ? 'tweet-card tweet-card--interactive'
        : 'tweet-card';

  const interactiveProps = onSelect
    ? {
        role: 'button',
        tabIndex: 0,
        onClick: () => onSelect(tweet),
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(tweet);
          }
        },
      }
    : {};

  const handleLikeClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (onLike) {
      onLike(tweet);
    }
  };

  const handleAuthorClick = (event: MouseEvent<HTMLButtonElement | HTMLImageElement>) => {
    event.stopPropagation();
    onOpenProfile?.(tweet.author);
  };

  return (
    <article className={cardClassName} {...interactiveProps}>
      <button
        type="button"
        className="tweet-card__avatar-button"
        onClick={handleAuthorClick}
        aria-label={`View ${tweet.author.displayName}'s profile`}
      >
        <img className="tweet-card__avatar" src={tweet.author.avatar} alt={tweet.author.displayName} />
      </button>
      <div className="tweet-card__body">
        <header className="tweet-card__header">
          <button type="button" className="tweet-card__author-button" onClick={handleAuthorClick}>
            <span className="tweet-card__display-name">{tweet.author.displayName}</span>
            <span className="tweet-card__handle">@{tweet.author.handle}</span>
          </button>
          <span className="tweet-card__timestamp">{relativeTime(tweet.timestamp)}</span>
        </header>
        <p className="tweet-card__content">{tweet.content}</p>
        <footer className="tweet-card__meta">
          <button
            type="button"
            className="tweet-card__action"
            onClick={handleLikeClick}
            disabled={!onLike || likeDisabled}
            aria-label="Like tweet"
          >
            ❤ {tweet.likes}
          </button>
          <span>↻ {tweet.reposts}</span>
          <span>💬 {tweet.replies}</span>
          {tweet.isPinned && <span className="tweet-card__badge">Pinned</span>}
        </footer>
      </div>
    </article>
  );
};

export default TweetCard;
