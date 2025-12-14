import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import charactersRouter from './routes/characters.js';

const app = express();
const PORT = Number(process.env.PORT) || 4100;

app.use(cors());
app.use(express.json());

app.use('/characters', charactersRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Character service listening on http://localhost:${PORT}`);
});
