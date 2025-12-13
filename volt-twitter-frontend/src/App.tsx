import { useState } from 'react';
import FeedScreen from './screens/FeedScreen';
import ExploreScreen from './screens/ExploreScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfileScreen from './screens/ProfileScreen';
import { FeedProvider } from './context/FeedContext';
import './styles/App.css';

const screens = {
  feed: { label: 'Home', Component: FeedScreen },
  explore: { label: 'Explore', Component: ExploreScreen },
  notifications: { label: 'Notifications', Component: NotificationsScreen },
  profile: { label: 'Profile', Component: ProfileScreen },
};

export type ScreenKey = keyof typeof screens;

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>('feed');
  const ActiveComponent = screens[activeScreen].Component;

  return (
    <FeedProvider>
      <div className="app-shell">
        <aside className="app-shell__sidebar">
          <div className="app-shell__brand">Voltcore Wire</div>
          <nav>
            {Object.entries(screens).map(([key, config]) => (
              <button
                key={key}
                className={key === activeScreen ? 'nav-button nav-button--active' : 'nav-button'}
                onClick={() => setActiveScreen(key as ScreenKey)}
              >
                {config.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="app-shell__content">
          <ActiveComponent />
        </main>
      </div>
    </FeedProvider>
  );
}

export default App;
