import { describe, it, expect } from 'vitest';
import { isDoneTransition } from '../statusTransition';

describe('isDoneTransition', () => {
  it('routes only DONE to the Lambda-backed markAsDone endpoint', () => {
    expect(isDoneTransition('DONE')).toBe(true);
  });

  it('routes every other status to the regular updateTask API', () => {
    expect(isDoneTransition('PENDING')).toBe(false);
    expect(isDoneTransition('IN_PROGRESS')).toBe(false);
    expect(isDoneTransition('ARCHIVED')).toBe(false);
  });
});
