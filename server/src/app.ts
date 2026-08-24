import cors from 'cors';
import express from 'express';
import { env } from './config/env.ts';
import { sessionRouter } from './routes/session.ts';
import cookieParser from 'cookie-parser';
import { usersRouter } from './routes/users.ts';

export const buildServer = () => {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_, res) => {
    res.json({
      status: 'ok',
    });
  });

  app.use('/api/auth/session', sessionRouter);
  app.use('/api/users', usersRouter);
  return app;
};
