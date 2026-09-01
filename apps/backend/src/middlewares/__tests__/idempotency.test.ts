import { Request, Response, NextFunction } from 'express';
import { idempotency, withIdempotencyCheck } from '../idempotency';
import { AppError } from '../error-handler';

jest.mock('../../config/redis.js', () => ({
  redis: {
    set: jest.fn(),
    del: jest.fn(),
  },
}));

import { redis } from '../../config/redis.js';

const mockRedis = jest.mocked(redis);

function createMockRequest(idempotencyKey?: string): Request {
  return {
    headers: idempotencyKey ? { 'idempotency-key': idempotencyKey } : {},
    idempotencyKey,
  } as unknown as Request;
}

function createMockResponse(): Response {
  return {} as Response;
}

describe('idempotency middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('idempotency', () => {
    it('throws 400 when Idempotency-Key header is missing', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = jest.fn();

      expect(() => idempotency(req, res, next)).toThrow(AppError);
      expect(() => idempotency(req, res, next)).toThrow('Missing Idempotency-Key header');
    });

    it('sets req.idempotencyKey and calls next', () => {
      const req = createMockRequest('test-key-123');
      const res = createMockResponse();
      const next = jest.fn();

      idempotency(req, res, next);

      expect(req.idempotencyKey).toBe('test-key-123');
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('withIdempotencyCheck', () => {
    it('acquires lock and executes handler on first request', async () => {
      const req = createMockRequest('key-1');
      const res = createMockResponse();
      const handler = jest.fn().mockResolvedValue(undefined);
      mockRedis.set.mockResolvedValue('OK' as any);

      await withIdempotencyCheck(req, res, handler);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'idempotency:key-1',
        '1',
        'EX',
        86400,
        'NX'
      );
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('returns 409 when key already exists', async () => {
      const req = createMockRequest('key-dup');
      const res = createMockResponse();
      const handler = jest.fn();
      mockRedis.set.mockResolvedValue(null as any);

      await expect(withIdempotencyCheck(req, res, handler)).rejects.toThrow(AppError);
      await expect(withIdempotencyCheck(req, res, handler)).rejects.toThrow(
        'Conflict: Request already processed'
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('simulates concurrent duplicate: second request gets 409', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      mockRedis.set
        .mockResolvedValueOnce('OK' as any)
        .mockResolvedValueOnce(null as any);

      const req1 = createMockRequest('concurrent-key');
      const req2 = createMockRequest('concurrent-key');
      const res = createMockResponse();

      await withIdempotencyCheck(req1, res, handler);
      await expect(withIdempotencyCheck(req2, res, handler)).rejects.toThrow(AppError);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('releases lock when handler throws', async () => {
      const req = createMockRequest('error-key');
      const res = createMockResponse();
      const handler = jest.fn().mockRejectedValue(new Error('handler failed'));
      mockRedis.set.mockResolvedValue('OK' as any);
      mockRedis.del.mockResolvedValue(1 as any);

      await expect(withIdempotencyCheck(req, res, handler)).rejects.toThrow('handler failed');
      expect(mockRedis.del).toHaveBeenCalledWith('idempotency:error-key');
    });

    it('allows retry after handler failure releases lock', async () => {
      const req = createMockRequest('retry-key');
      const res = createMockResponse();
      const failHandler = jest.fn().mockRejectedValue(new Error('fail'));
      const okHandler = jest.fn().mockResolvedValue(undefined);

      mockRedis.set
        .mockResolvedValueOnce('OK' as any)
        .mockResolvedValueOnce('OK' as any);
      mockRedis.del.mockResolvedValue(1 as any);

      await expect(withIdempotencyCheck(req, res, failHandler)).rejects.toThrow();
      await withIdempotencyCheck(req, res, okHandler);

      expect(okHandler).toHaveBeenCalledTimes(1);
    });
  });
});
