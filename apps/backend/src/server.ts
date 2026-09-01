import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { redis } from './config/redis';
import { errorHandler } from './middlewares/error-handler';
import { taskRoutes } from './controllers/task.controller';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/tasks', taskRoutes);

app.use(errorHandler);

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL');

    await redis.ping();
    console.log('Connected to Redis');

    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

export default app;
