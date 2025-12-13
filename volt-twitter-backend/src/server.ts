import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createPost, getNotifications, getProfile, getTimeline, getTrendingTopics } from './services/feedService';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/timeline', async (_req, res) => {
  try {
    const timeline = await getTimeline();
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

app.get('/api/profile', async (_req, res) => {
  try {
    const profile = await getProfile();
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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Voltcore backend running on http://localhost:${PORT}`);
  });
}

export default app;
