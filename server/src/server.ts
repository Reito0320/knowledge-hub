import { buildServer } from './app.js';
import { env } from './config/env.js';

const app = buildServer();

app.listen(env.PORT, () => {
  console.log(`Express server started: http://localhost:${env.PORT}`);
});
