import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { taskRoutes } from './controllers/task.controller.js';
import { resolveCognitoConfig } from './config/cognito.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
}));
app.use(express.json());

app.use('/api/tasks', taskRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

const PORT = env.PORT;

async function start() {
  await resolveCognitoConfig();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();

export default app;
