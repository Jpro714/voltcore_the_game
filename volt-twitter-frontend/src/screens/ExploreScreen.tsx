import { useFeed } from '../context/FeedContext';
import '../styles/ExploreScreen.css';

const ExploreScreen: React.FC = () => {
  const { trendingTopics, isLoading } = useFeed();

  return (
    <section className="explore-screen">
      <h2>Explore</h2>
      <p className="explore-screen__hint">Trending topics across Voltcore City.</p>
      {isLoading && <p className="explore-screen__status">Loading trending data...</p>}
      <ul>
        {trendingTopics.map((topic) => (
          <li key={topic.id} className="explore-screen__topic">
            <div>
              <p className="explore-screen__hashtag">{topic.hashtag}</p>
              <p className="explore-screen__description">{topic.description}</p>
            </div>
            <span className="explore-screen__posts">{topic.posts.toLocaleString()} posts</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ExploreScreen;
