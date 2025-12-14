import { useState } from 'react';
import FeedScreen from './screens/FeedScreen';
import ExploreScreen from './screens/ExploreScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfileScreen from './screens/ProfileScreen';
import TweetDetailScreen from './screens/TweetDetailScreen';
import { FeedProvider } from './context/FeedContext';
import { Tweet } from './types/feed';
import './styles/App.css';

const navigationScreens = {
  feed: { label: 'Home', Component: FeedScreen },
  explore: { label: 'Explore', Component: ExploreScreen },
  notifications: { label: 'Notifications', Component: NotificationsScreen },
  profile: { label: 'Profile', Component: ProfileScreen },
};

type NavScreenKey = keyof typeof navigationScreens;
type ScreenKey = NavScreenKey | 'tweetDetail';

type DetailEntry = { id: string; initial?: Tweet };

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>('feed');
  const [lastNavScreen, setLastNavScreen] = useState<NavScreenKey>('feed');
  const [detailStack, setDetailStack] = useState<DetailEntry[]>([]);

  const currentDetail = detailStack[detailStack.length - 1];

  const navigateTo = (screen: NavScreenKey) => {
    setLastNavScreen(screen);
    setActiveScreen(screen);
    setDetailStack([]);
  };

  const openTweetDetail = (tweet: Tweet) => {
    setDetailStack((prev) => [...prev, { id: tweet.id, initial: tweet }]);
    setActiveScreen('tweetDetail');
  };

  const handleBackFromDetail = () => {
    setDetailStack((prev) => {
      if (prev.length <= 1) {
        setActiveScreen(lastNavScreen);
        return [];
      }
      return prev.slice(0, -1);
    });
  };

  const renderScreen = () => {
    if (activeScreen === 'tweetDetail' && currentDetail) {
      return (
        <TweetDetailScreen
          tweetId={currentDetail.id}
          onBack={handleBackFromDetail}
          onSelectTweet={openTweetDetail}
          initialTweet={currentDetail.initial}
        />
      );
    }

    const Component = navigationScreens[activeScreen as NavScreenKey].Component;
    if (activeScreen === 'feed') {
      return <Component onSelectTweet={openTweetDetail} />;
    }
    return <Component />;
  };

  return (
    <FeedProvider>
      <div className="app-shell">
        <aside className="app-shell__sidebar">
          <div className="app-shell__brand">Voltcore Wire</div>
          <nav>
            {Object.entries(navigationScreens).map(([key, config]) => (
              <button
                key={key}
                className={
                  key === (activeScreen === 'tweetDetail' ? lastNavScreen : activeScreen)
                    ? 'nav-button nav-button--active'
                    : 'nav-button'
                }
                onClick={() => navigateTo(key as NavScreenKey)}
              >
                {config.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="app-shell__content">
          {renderScreen()}
        </main>
      </div>
    </FeedProvider>
  );
}

export default App;
