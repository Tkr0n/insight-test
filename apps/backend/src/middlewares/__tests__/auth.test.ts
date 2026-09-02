import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../auth';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));
jest.mock('jwks-rsa', () => () => ({
  getSigningKey: jest.fn(),
}));

// Mock env to have cognito config
jest.mock('../../config/env.js', () => ({
  env: {
    COGNITO_USER_POOL_ID: 'us-east-2_testPool',
    COGNITO_CLIENT_ID: 'test-client-id',
    AWS_REGION: 'us-east-2',
  },
}));

import jwt from 'jsonwebtoken';

const mockVerify = jest.mocked(jwt.verify);

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    cookies: {},
    ...overrides,
  } as unknown as Request;
}

describe('authenticate middleware', () => {
  let next: NextFunction;
  let res: Response;

  beforeEach(() => {
    jest.clearAllMocks();
    next = jest.fn();
    res = {} as Response;
    // Default verify success
    mockVerify.mockImplementation((_token, _key, _opts, cb) => {
      (cb as Function)(null, { sub: 'user-123', email: 'test@insightt.com' });
    });
  });

  it('reads token from id_token cookie', async () => {
    const req = mockReq({ cookies: { id_token: 'valid-token' } });
    await authenticate(req, res, next);
    expect(jwt.verify).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
    expect((req as any).user.sub).toBe('user-123');
  });

  it('reads token from __Host-id_token cookie (legacy)', async () => {
    const req = mockReq({ cookies: { '__Host-id_token': 'legacy-token' } });
    await authenticate(req, res, next);
    expect(jwt.verify).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('prefers id_token over __Host-id_token', async () => {
    const req = mockReq({ cookies: { id_token: 'new-token', '__Host-id_token': 'legacy-token' } });
    await authenticate(req, res, next);
    // Should call verify with new-token, not legacy
    const callToken = (mockVerify.mock.calls[0] as unknown[])[0];
    expect(callToken).toBe('new-token');
  });

  it('falls back to Authorization Bearer header', async () => {
    const req = mockReq({ headers: { authorization: 'Bearer header-token' } });
    await authenticate(req, res, next);
    const callToken = (mockVerify.mock.calls[0] as unknown[])[0];
    expect(callToken).toBe('header-token');
  });

  it('rejects with 401 when no token present', async () => {
    const req = mockReq();
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('rejects with 401 when token is invalid', async () => {
    mockVerify.mockImplementation((_token, _key, _opts, cb) => {
      (cb as Function)(new Error('invalid'), undefined);
    });
    const req = mockReq({ cookies: { id_token: 'bad-token' } });
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
