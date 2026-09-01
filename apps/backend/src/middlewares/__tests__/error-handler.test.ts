import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../error-handler';
import { InvalidStateTransitionError } from '../../use-cases/state-machine';
import { ZodError } from 'zod';

describe('errorHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {} as Request;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    next = jest.fn();
  });

  it('returns AppError with its statusCode', () => {
    const err = new AppError(404, 'Not found');
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  it('returns ZodError as HTTP 400 with details', () => {
    const issues = [
      { code: 'invalid_type' as const, expected: 'string' as const, received: 'number' as const, path: ['title'], message: 'Expected string, received number' },
    ];
    const err = new ZodError(issues as any);
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Validation error' })
    );
  });

  it('returns InvalidStateTransitionError as HTTP 422', () => {
    const err = new InvalidStateTransitionError('PENDING', 'DONE');
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid state transition: PENDING → DONE',
    });
  });

  it('returns unknown errors as HTTP 500', () => {
    const err = new Error('something broke');
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
