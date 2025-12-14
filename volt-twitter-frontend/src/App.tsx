import { useState } from 'react';
import FeedScreen from './screens/FeedScreen';
import ExploreScreen from './screens/ExploreScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfileScreen from './screens/ProfileScreen';
import TweetDetailScreen from './screens/TweetDetailScreen';
import AuthorProfileScreen from './screens/AuthorProfileScreen';
import { FeedProvider } from './context/FeedContext';
import { Tweet, User } from './types/feed';
import './styles/App.css';

const navigationScreens = {
  feed: { label: 'Home', Component: FeedScreen },
  explore: { label: 'Explore', Component: ExploreScreen },
  notifications: { label: 'Notifications', Component: NotificationsScreen },
  profile: { label: 'Profile', Component: ProfileScreen },
};

type NavScreenKey = keyof typeof navigationScreens;
type ScreenKey = NavScreenKey | 'detail';

type DetailEntry =
  | { type: 'tweet'; tweet: Tweet }
  | { type: 'profile'; handle: string };

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
    setDetailStack((prev) => [...prev, { type: 'tweet', tweet }]);
    setActiveScreen('detail');
  };

  const openAuthorProfile = (user: User) => {
    setDetailStack((prev) => [...prev, { type: 'profile', handle: user.handle }]);
    setActiveScreen('detail');
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
    if (activeScreen === 'detail' && currentDetail) {
      if (currentDetail.type === 'tweet') {
        return (
          <TweetDetailScreen
            tweetId={currentDetail.tweet.id}
            onBack={handleBackFromDetail}
            onSelectTweet={openTweetDetail}
            onOpenProfile={openAuthorProfile}
            initialTweet={currentDetail.tweet}
          />
        );
      }

      return (
        <AuthorProfileScreen
          handle={currentDetail.handle}
          onBack={handleBackFromDetail}
          onSelectTweet={openTweetDetail}
          onSelectProfile={openAuthorProfile}
        />
      );
    }

    const Component = navigationScreens[activeScreen as NavScreenKey].Component;
    if (activeScreen === 'feed') {
      return <Component onSelectTweet={openTweetDetail} onSelectProfile={openAuthorProfile} />;
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
                  key === (activeScreen === 'detail' ? lastNavScreen : activeScreen)
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
