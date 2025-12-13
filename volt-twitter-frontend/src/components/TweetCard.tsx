import { Tweet } from '../types/feed';
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
}

const TweetCard: React.FC<Props> = ({ tweet }) => (
  <article className="tweet-card">
    <img className="tweet-card__avatar" src={tweet.author.avatar} alt={tweet.author.displayName} />
    <div className="tweet-card__body">
      <header className="tweet-card__header">
        <div>
          <span className="tweet-card__display-name">{tweet.author.displayName}</span>
          <span className="tweet-card__handle">@{tweet.author.handle}</span>
        </div>
        <span className="tweet-card__timestamp">{relativeTime(tweet.timestamp)}</span>
      </header>
      <p className="tweet-card__content">{tweet.content}</p>
      <footer className="tweet-card__meta">
        <span>❤ {tweet.likes}</span>
        <span>↻ {tweet.reposts}</span>
        <span>💬 {tweet.replies}</span>
        {tweet.isPinned && <span className="tweet-card__badge">Pinned</span>}
      </footer>
    </div>
  </article>
);

export default TweetCard;
