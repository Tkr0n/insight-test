import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';

export type DeadlineColor = 'yellow' | 'orange' | 'red' | null;

export function getDeadlineColor(dueDate: string | null): DeadlineColor {
  if (!dueDate) return null;
  const due = parseISO(dueDate);
  if (!isValid(due)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = differenceInCalendarDays(due, today);
  if (diff < 0) return 'red';
  if (diff === 0) return 'orange';
  if (diff <= 2) return 'yellow';
  return null;
}

export const deadlineBorder: Record<NonNullable<DeadlineColor>, string> = {
  yellow: '2px solid #f9a825',
  orange: '2px solid #ef6c00',
  red: '2px solid #c62828',
};
