import ComposeBox from '../components/ComposeBox';
import TweetCard from '../components/TweetCard';
import { useFeed } from '../context/FeedContext';
import { Tweet } from '../types/feed';
import '../styles/FeedScreen.css';

interface Props {
  onSelectTweet?: (tweet: Tweet) => void;
  onSelectProfile?: (user: Tweet['author']) => void;
}

const FeedScreen: React.FC<Props> = ({ onSelectTweet, onSelectProfile }) => {
  const { timeline, isLoading, refresh, likeTweet } = useFeed();

  const handleLike = (tweet: Tweet) => {
    likeTweet(tweet.id).catch((error) => {
      console.error('Failed to like tweet', error);
    });
  };

  return (
    <section className="feed-screen">
      <div className="feed-screen__header">
        <h2>Home Feed</h2>
        <button onClick={refresh} aria-label="Refresh feed">
          ↻ Refresh
        </button>
      </div>
      <ComposeBox />
      {isLoading && <p className="feed-screen__status">Loading timeline...</p>}
      {!isLoading && timeline.length === 0 && <p className="feed-screen__status">No posts yet.</p>}
      <div className="feed-screen__list">
        {timeline.map((tweet) => (
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

export default FeedScreen;
