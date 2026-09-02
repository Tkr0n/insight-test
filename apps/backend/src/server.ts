import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { taskRoutes } from './controllers/task.controller.js';
import { shareRoutes } from './controllers/share.controller.js';
import { userRoutes } from './controllers/user.controller.js';
import { authRoutes } from './controllers/auth.controller.js';
import { docsRoutes } from './controllers/docs.controller.js';
import { csrfProtection } from './middlewares/csrf.js';
import { resolveCognitoConfig } from './config/cognito.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/tasks', csrfProtection, taskRoutes);
app.use('/api/tasks/:id/share', csrfProtection, shareRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

const PORT = env.PORT;

async function start() {
  const cognitoConfig = await resolveCognitoConfig();
  if (!cognitoConfig) {
    console.warn('[server] Starting without Cognito — authentication will be disabled');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();

export default app;
