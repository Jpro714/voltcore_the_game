import cors from 'cors';
import express from 'express';
import { router } from './routes';
import { errorHandler } from './middleware/errorHandler';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', router);

  app.use(errorHandler);

  return app;
};
