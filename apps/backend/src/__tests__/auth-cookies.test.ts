import express from 'express';
import request from 'supertest';
import { authRoutes } from '../controllers/auth.controller';

jest.mock('../config/env.js', () => ({
  env: {
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    REDIS_URL: 'redis://localhost:6379',
    AWS_REGION: 'us-east-2',
    COGNITO_USER_POOL_ID: 'us-east-2_testPool',
    COGNITO_CLIENT_ID: 'test-client-id',
    NODE_ENV: 'test',
    PORT: 3000,
    CORS_ORIGIN: 'https://insight.verkku.com',
    CSRF_SECRET: 'test-csrf-secret-0123456789abcdef',
    COOKIE_SECURE: true,
    COOKIE_DOMAIN: '.insight.verkku.com',
    LAMBDA_FUNCTION_NAME: 'markAsDone',
    ADMIN_EMAIL: 'admin@insightt.com',
  },
}));

jest.mock('../config/prisma.js', () => ({
  prisma: {
    user: { upsert: jest.fn().mockResolvedValue({}) },
  },
}));

jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      AuthenticationResult: { IdToken: 'test-id-token' },
    }),
  })),
  InitiateAuthCommand: jest.fn(),
  RespondToAuthChallengeCommand: jest.fn(),
  SignUpCommand: jest.fn(),
  AdminConfirmSignUpCommand: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  decode: jest.fn(() => ({ sub: 'user-123', email: 'test@insightt.com', name: 'Test' })),
}));

jest.mock('jwks-rsa', () => () => ({
  getSigningKey: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use(authRoutes);

describe('auth cookies', () => {
  it('sets Domain=.insight.verkku.com on id_token and csrf_token', async () => {
    const res = await request(app).post('/login').send({ email: 'a@b.com', password: 'Passw0rd!' });
    expect(res.status).toBe(200);
    const setCookie = (res.headers['set-cookie'] as unknown as string[]) ?? [];
    const joined = setCookie.join('\n');
    expect(joined).toContain('id_token=test-id-token');
    expect(joined).toContain('Domain=.insight.verkku.com');
    expect(joined).toContain('csrf_token=');
  }, 30_000);
});