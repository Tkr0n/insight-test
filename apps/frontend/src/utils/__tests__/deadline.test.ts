import { getDeadlineColor } from '../deadline';

describe('getDeadlineColor', () => {
  it('returns red for overdue', () => {
    expect(getDeadlineColor('2026-01-01')).toBe('red');
  });
  it('returns orange for today', () => {
    const today = new Date().toISOString().split('T')[0]!;
    expect(getDeadlineColor(today)).toBe('orange');
  });
  it('returns yellow for within 2 days', () => {
    const in2 = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]!;
    expect(getDeadlineColor(in2)).toBe('yellow');
  });
  it('returns null for far future', () => {
    expect(getDeadlineColor('2099-12-31')).toBe(null);
  });
  it('returns null for no due date', () => {
    expect(getDeadlineColor(null)).toBe(null);
  });
});
