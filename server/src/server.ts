import { buildServer } from './app.ts';
import { env } from './config/env.ts';

const app = buildServer();

app.listen(env.PORT, () => {
  console.log(`Express server started: http://localhost:${env.PORT}`);
});
