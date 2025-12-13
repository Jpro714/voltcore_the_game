import TweetCard from '../components/TweetCard';
import { useFeed } from '../context/FeedContext';
import '../styles/ProfileScreen.css';

const ProfileScreen: React.FC = () => {
  const { profile, timeline } = useFeed();
  const personalPosts = timeline.filter((tweet) => tweet.author.id === profile?.user.id);

  if (!profile) {
    return (
      <section className="profile-screen">
        <p>Loading profile...</p>
      </section>
    );
  }

  return (
    <section className="profile-screen">
      <header className="profile-screen__hero">
        <img src={profile.user.avatar} alt={profile.user.displayName} />
        <div>
          <h2>{profile.user.displayName}</h2>
          <p>@{profile.user.handle}</p>
          <p className="profile-screen__bio">{profile.bio}</p>
          {profile.location && <p className="profile-screen__location">📍 {profile.location}</p>}
          <div className="profile-screen__stats">
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

      {profile.pinnedTweet && (
        <div className="profile-screen__pinned">
          <h3>Pinned</h3>
          <TweetCard tweet={profile.pinnedTweet} />
        </div>
      )}

      <div className="profile-screen__timeline">
        <h3>Recent Posts</h3>
        {personalPosts.length === 0 && <p>No posts yet.</p>}
        {personalPosts.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
      </div>
    </section>
  );
};

export default ProfileScreen;
