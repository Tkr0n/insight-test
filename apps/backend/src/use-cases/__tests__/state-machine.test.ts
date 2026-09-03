import { validateStateTransition, VALID_TRANSITIONS, InvalidStateTransitionError } from '../state-machine';
import type { TaskStatus } from '../state-machine';

describe('State Machine', () => {
  describe('VALID_TRANSITIONS', () => {
    it('defines transitions for all 4 statuses', () => {
      expect(Object.keys(VALID_TRANSITIONS)).toEqual(
        expect.arrayContaining(['PENDING', 'IN_PROGRESS', 'DONE', 'ARCHIVED'])
      );
    });

    it('PENDING can transition to IN_PROGRESS and ARCHIVED', () => {
      expect(VALID_TRANSITIONS.PENDING).toEqual(['IN_PROGRESS', 'ARCHIVED']);
    });

    it('IN_PROGRESS can transition to PENDING, DONE and ARCHIVED', () => {
      expect(VALID_TRANSITIONS.IN_PROGRESS).toEqual(['PENDING', 'DONE', 'ARCHIVED']);
    });

    it('DONE can transition to IN_PROGRESS and ARCHIVED', () => {
      expect(VALID_TRANSITIONS.DONE).toEqual(['IN_PROGRESS', 'ARCHIVED']);
    });

    it('ARCHIVED can transition to any previous state (unarchive)', () => {
      expect(VALID_TRANSITIONS.ARCHIVED).toEqual(['PENDING', 'IN_PROGRESS', 'DONE']);
    });
  });

  describe('validateStateTransition', () => {
    const validCases: [TaskStatus, TaskStatus][] = [
      ['PENDING', 'IN_PROGRESS'],
      ['PENDING', 'ARCHIVED'],
      ['IN_PROGRESS', 'PENDING'],
      ['IN_PROGRESS', 'DONE'],
      ['IN_PROGRESS', 'ARCHIVED'],
      ['DONE', 'IN_PROGRESS'],
      ['DONE', 'ARCHIVED'],
      ['ARCHIVED', 'PENDING'],
      ['ARCHIVED', 'IN_PROGRESS'],
      ['ARCHIVED', 'DONE'],
    ];

    it.each(validCases)('allows %s → %s', (from, to) => {
      expect(() => validateStateTransition(from, to)).not.toThrow();
    });

    const invalidCases: [TaskStatus, TaskStatus][] = [
      ['PENDING', 'DONE'],
      ['PENDING', 'PENDING'],
      ['IN_PROGRESS', 'IN_PROGRESS'],
      ['DONE', 'PENDING'],
      ['DONE', 'DONE'],
      ['ARCHIVED', 'ARCHIVED'],
      ['PENDING', 'DONE'],
    ];

    it.each(invalidCases)('rejects %s → %s', (from, to) => {
      expect(() => validateStateTransition(from, to)).toThrow(InvalidStateTransitionError);
    });

    it('throws InvalidStateTransitionError with descriptive message', () => {
      expect(() => validateStateTransition('PENDING', 'DONE')).toThrow(
        'Invalid state transition: PENDING → DONE'
      );
    });

    it('sets error name to InvalidStateTransitionError', () => {
      try {
        validateStateTransition('PENDING', 'DONE');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidStateTransitionError);
        expect((e as Error).name).toBe('InvalidStateTransitionError');
      }
    });
  });
});
