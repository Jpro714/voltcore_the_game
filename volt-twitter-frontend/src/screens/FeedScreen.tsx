import ComposeBox from '../components/ComposeBox';
import TweetCard from '../components/TweetCard';
import { useFeed } from '../context/FeedContext';
import '../styles/FeedScreen.css';

const FeedScreen: React.FC = () => {
  const { timeline, isLoading, refresh } = useFeed();

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
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
      </div>
    </section>
  );
};

export default FeedScreen;
