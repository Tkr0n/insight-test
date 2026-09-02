import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  AWS_REGION: z.string().default('us-east-1'),
  COGNITO_USER_POOL_ID: z.string().default(''),
  COGNITO_CLIENT_ID: z.string().default(''),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default('*'),
  CSRF_SECRET: z.string().default('insightt-csrf-secret-change-in-prod-32-chars'),
  COOKIE_SECURE: z.preprocess((v) => v === 'true', z.boolean().default(false)),
  LAMBDA_FUNCTION_NAME: z.string().default('markAsDone'),
  ADMIN_EMAIL: z.string().default('admin@insightt.com'),
});

export const env = envSchema.parse(process.env);
