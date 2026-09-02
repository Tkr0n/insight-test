export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Non Critical',
  2: 'Moderate',
  3: 'Important',
  4: 'Critical',
};

export const PRIORITY_COLORS: Record<number, { bg: string; color: string; border: string }> = {
  1: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
  2: { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
  3: { bg: '#fff3e0', color: '#ef6c00', border: '#ffcc80' },
  4: { bg: '#fce4ec', color: '#c62828', border: '#ef9a9a' },
};

export const PRIORITY_COLORS_DARK: Record<number, { bg: string; color: string; border: string }> = {
  1: { bg: 'rgba(46,125,50,0.18)', color: '#81c784', border: 'rgba(129,199,132,0.3)' },
  2: { bg: 'rgba(21,101,192,0.18)', color: '#64b5f6', border: 'rgba(100,181,246,0.3)' },
  3: { bg: 'rgba(239,108,0,0.18)', color: '#ffb74d', border: 'rgba(255,183,77,0.3)' },
  4: { bg: 'rgba(198,40,40,0.18)', color: '#ef9a9a', border: 'rgba(239,154,154,0.3)' },
};

export function getPriorityLabel(level: number): string {
  return PRIORITY_LABELS[level] ?? 'Moderate';
}

export function getPriorityMeta(level: number, isDark = false) {
  const map = isDark ? PRIORITY_COLORS_DARK : PRIORITY_COLORS;
  return map[level] ?? map[2]!;
}
