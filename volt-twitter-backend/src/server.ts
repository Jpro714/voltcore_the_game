import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  createPost,
  createPostForUser,
  createReply,
  createReplyForUser,
  followUser,
  getAuthorProfile,
  getFollowersForUser,
  getFollowingForUser,
  getNotifications,
  getPostById,
  getProfile,
  getTimeline,
  getTrendingTopics,
  likePost,
  unfollowUser,
} from './services/feedService';
import {
  getConversationSummaries,
  getConversationThread,
  sendDirectMessage,
  sendDirectMessageAsUser,
} from './services/directMessageService';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/timeline', async (req, res) => {
  try {
    const handle = typeof req.query.handle === 'string' ? req.query.handle : undefined;
    const timeline = await getTimeline(handle);
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load timeline', error: (error as Error).message });
  }
});

app.get('/api/notifications', async (_req, res) => {
  try {
    const notifications = await getNotifications();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load notifications', error: (error as Error).message });
  }
});

app.get('/api/trending', async (_req, res) => {
  try {
    const topics = await getTrendingTopics();
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load trending topics', error: (error as Error).message });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const handle = typeof req.query.handle === 'string' ? req.query.handle : undefined;
    const profile = await getProfile(handle);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load profile', error: (error as Error).message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ message: 'content must be a string' });
    }

    const newPost = await createPost(content);
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create post', error: (error as Error).message });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    res.json(post);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
});

app.post('/api/posts/:id/replies', async (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ message: 'content must be a string' });
    }

    const reply = await createReply(req.params.id, content);
    res.status(201).json(reply);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create reply', error: (error as Error).message });
  }
});

app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const updated = await likePost(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
});

app.get('/api/users/:handle', async (req, res) => {
  try {
    const profile = await getAuthorProfile(req.params.handle);
    res.json(profile);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
});

app.post('/api/users/:handle/follow', async (req, res) => {
  try {
    const profile = await followUser(req.params.handle);
    res.json(profile);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.delete('/api/users/:handle/follow', async (req, res) => {
  try {
    const profile = await unfollowUser(req.params.handle);
    res.json(profile);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.get('/api/direct-messages/conversations', async (_req, res) => {
  try {
    const conversations = await getConversationSummaries();
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

app.get('/api/direct-messages/conversations/:handle', async (req, res) => {
  try {
    const thread = await getConversationThread(req.params.handle);
    res.json(thread);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
});

app.post('/api/direct-messages/conversations/:handle', async (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ message: 'content must be a string' });
    }
    const message = await sendDirectMessage(req.params.handle, content);
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post('/internal/characters/:handle/posts', async (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ message: 'content must be a string' });
    }
    const post = await createPostForUser(req.params.handle, content);
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post('/internal/characters/:handle/posts/:postId/replies', async (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ message: 'content must be a string' });
    }
    const post = await createReplyForUser(req.params.handle, req.params.postId, content);
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post('/internal/characters/:handle/direct-messages/:target', async (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ message: 'content must be a string' });
    }
    const message = await sendDirectMessageAsUser(req.params.handle, req.params.target, content);
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.get('/api/users/:handle/followers', async (req, res) => {
  try {
    const followers = await getFollowersForUser(req.params.handle);
    res.json(followers);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
});

app.get('/api/users/:handle/following', async (req, res) => {
  try {
    const following = await getFollowingForUser(req.params.handle);
    res.json(following);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Voltcore backend running on http://localhost:${PORT}`);
  });
}

export default app;
