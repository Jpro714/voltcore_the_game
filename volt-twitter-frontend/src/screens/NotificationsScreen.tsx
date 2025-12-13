import { useFeed } from '../context/FeedContext';
import '../styles/NotificationsScreen.css';

const NotificationsScreen: React.FC = () => {
  const { notifications, isLoading } = useFeed();

  return (
    <section className="notifications-screen">
      <h2>Notifications</h2>
      {isLoading && <p className="notifications-screen__status">Gathering signals...</p>}
      {!isLoading && notifications.length === 0 && <p>No notifications yet.</p>}
      <ul>
        {notifications.map((notification) => (
          <li key={notification.id} className="notifications-screen__item">
            <img src={notification.relatedUser.avatar} alt={notification.relatedUser.displayName} />
            <div>
              <p className="notifications-screen__message">{notification.message}</p>
              <span className="notifications-screen__timestamp">{new Date(notification.timestamp).toLocaleTimeString()}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default NotificationsScreen;
