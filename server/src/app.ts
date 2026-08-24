import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { sessionRouter } from './routes/session.js';

export const buildServer = () => {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get('/health', (_, res) => {
    res.json({
      status: 'ok',
    });
  });

  app.use('/api/auth/session', sessionRouter);

  return app;
};
