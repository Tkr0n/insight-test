import { parseISO, isValid, format } from 'date-fns';

export function formatDateISO(value: string | null | undefined): string {
  if (!value) return '';
  const d = parseISO(value);
  if (!isValid(d)) return value;
  return format(d, 'yyyy-MM-dd');
}
